"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { saveImportedWorkout } from "@/app/internal-actions";
type Extracted = {
  title: string | null;
  exercises: Array<{
    name: string;
    sets: number | null;
    repetitions: string | null;
    rest_seconds: number | null;
    load_guidance: string | null;
    notes: string | null;
  }>;
};
async function compress(file: File) {
  const bitmap = await createImageBitmap(file),
    scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not compress the image."))),
      "image/webp",
      0.82,
    ),
  );
}
export function PhotoImporter({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [data, setData] = useState<Extracted | null>(null);
  async function choose(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await compress(file),
        id = crypto.randomUUID(),
        path = `${userId}/${id}.webp`,
        db = createClient();
      const upload = await db.storage
        .from("workout-imports")
        .upload(path, blob, { contentType: "image/webp" });
      if (upload.error) throw upload.error;
      const saved = await db
        .from("workout_imports")
        .insert({
          id,
          user_id: userId,
          storage_path: path,
          mime_type: "image/webp",
          size_bytes: blob.size,
          status: "uploaded",
          extracted_data: null,
          error_message: null,
        });
      if (saved.error) throw saved.error;
      const response = await fetch("/api/training/import-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: path,
          }),
        }),
        json = (await response.json()) as Extracted & { error?: string;errorCode?:string };
      if (!response.ok) {
        const messages:Record<string,string>={
          GEMINI_NOT_CONFIGURED:"Photo analysis is temporarily unavailable.",
          GEMINI_RATE_LIMIT:"The temporary analysis limit was reached. Try again later.",
          IMAGE_UNREADABLE:"We couldn't identify exercises in this image.",
          UNAUTHENTICATED:"Your session expired. Sign in again.",
          PRO_REQUIRED:"Photo import is available with PSFIT Pro.",
        };
        throw new Error(messages[json.errorCode??""]??json.error??"Import failed.");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }
  function update(i: number, key: string, value: string) {
    setData((d) =>
      d
        ? {
            ...d,
            exercises: d.exercises.map((x, n) =>
              n === i
                ? {
                    ...x,
                    [key]: ["sets", "rest_seconds"].includes(key)
                      ? Number(value)
                      : value,
                  }
                : x,
            ),
          }
        : d,
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Workout from photo</p>
        <h1 className="mt-2 text-4xl font-semibold">
          Turn your workout sheet into a reviewable workout.
        </h1>
      </div>
      {!data ? (
        <label className="card grid cursor-pointer place-items-center border-dashed p-12 text-center">
          <Camera className="text-acid" size={42} />
          <b className="mt-4">
            {busy ? "Uploading and analyzing..." : "Choose or take a photo"}
          </b>
          <p className="mt-2 text-sm text-muted">
            The image will be compressed to WebP before upload.
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={busy}
            onChange={(e) => choose(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      ) : (
        <form action={saveImportedWorkout} className="space-y-4">
          <input type="hidden" name="payload" value={JSON.stringify(data)} />
          <label>
            Workout name
            <input
              value={data.title ?? ""}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="field"
            />
          </label>
          {data.exercises.map((x, i) => (
            <div key={i} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
              <label className="sm:col-span-2">
                Exercise
                <input
                  value={x.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  className="field"
                />
              </label>
              <label>
                Sets
                <input
                  value={x.sets ?? ""}
                  onChange={(e) => update(i, "sets", e.target.value)}
                  className="field"
                />
              </label>
              <label>
                Repetitions
                <input
                  value={x.repetitions ?? ""}
                  onChange={(e) => update(i, "repetitions", e.target.value)}
                  className="field"
                />
              </label>
              <label>
                Rest
                <input
                  value={x.rest_seconds ?? ""}
                  onChange={(e) => update(i, "rest_seconds", e.target.value)}
                  className="field"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    exercises: data.exercises.filter((_, n) => n !== i),
                  })
                }
              >
                <Trash2 />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setData({
                ...data,
                exercises: [
                  ...data.exercises,
                  {
                    name: "",
                    sets: null,
                    repetitions: null,
                    rest_seconds: null,
                    load_guidance: null,
                    notes: null,
                  },
                ],
              })
            }
            className="rounded-full border border-white/10 px-4 py-2"
          >
            + Add exercise
          </button>
          <label>
            Day
            <select name="day" className="field">
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((x, i) => (
                <option value={i} key={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            Duration
            <input
              name="minutes"
              type="number"
              defaultValue="45"
              className="field"
            />
          </label>
          <button className="rounded-full bg-acid px-6 py-3 font-bold text-ink">
            Save reviewed workout
          </button>
        </form>
      )}
      {error && (
        <p className="rounded-xl bg-danger/10 p-4 text-danger">{error}</p>
      )}
    </div>
  );
}
