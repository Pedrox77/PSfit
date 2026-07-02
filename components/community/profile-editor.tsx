"use client";

import {
  updateProfile,
  type UpdateProfileState,
} from "@/app/community/actions";
import { MusicPicker } from "@/components/music/music-picker";
import type { CommunityProfile } from "@/types/database";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { UserAvatar } from "./user-avatar";

const categories = [
  "athlete",
  "fitness_creator",
  "personal_trainer",
  "runner",
  "cyclist",
  "bodybuilder",
  "nutrition_creator",
  "lifestyle",
  "beginner",
];

export function ProfileEditor({
  profile,
}: {
  profile: CommunityProfile;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    { ok: false } satisfies UpdateProfileState,
  );
  const [username, setUsername] = useState(profile.username ?? "");
  const [availability, setAvailability] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [preview, setPreview] = useState<string | null>(
    profile.avatar_url,
  );
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (username === profile.username) {
      setAvailability("");
      return;
    }
    const timer = setTimeout(async () => {
      if (!/^[a-zA-Z0-9._]{3,30}$/.test(username)) {
        setAvailability(
          "Use 3–30 letters, numbers, dots, or underscores.",
        );
        return;
      }
      const response = await fetch(
        `/api/community/username?value=${encodeURIComponent(username)}`,
      );
      const data = (await response.json()) as { available: boolean };
      setAvailability(
        data.available
          ? "Username is available."
          : "Username is unavailable.",
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [username, profile.username]);

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function chooseAvatar(file?: File) {
    setAvatarError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Use a JPG, PNG or WebP image.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Profile photos must be 5 MB or smaller.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  }

  function removePhoto() {
    if (fileInput.current) fileInput.current.value = "";
    setPreview(null);
    setRemoveAvatar(true);
    setAvatarError("");
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.025] p-5 sm:flex-row">
        <UserAvatar
          src={preview}
          name={profile.full_name}
          username={username}
          size="xl"
        />
        <div className="text-center sm:text-left">
          <input
            ref={fileInput}
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => chooseAvatar(event.target.files?.[0])}
          />
          <input
            type="hidden"
            name="remove_avatar"
            value={String(removeAvatar)}
          />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-aqua/30 px-4 py-2 text-sm text-aqua"
            >
              Change photo
            </button>
            {preview && (
              <button
                type="button"
                onClick={removePhoto}
                className="rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-300"
              >
                Remove photo
              </button>
            )}
          </div>
          {(avatarError || state.error) && (
            <p role="alert" className="mt-2 text-sm text-red-300">
              {avatarError || state.error}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="full_name" label="Full name" value={profile.full_name} />
        <label className="text-sm">
          Username
          <input
            required
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3"
          />
          <span className="mt-1 block text-xs text-muted">
            {availability}
          </span>
        </label>
        <Field name="pronouns" label="Pronouns" value={profile.pronouns} />
        <Field name="location" label="Location" value={profile.location} />
        <Field name="website" label="Website" value={profile.website} />
        <Field
          name="primary_goal"
          label="Primary goal"
          value={profile.primary_goal}
        />
        <Field
          name="experience_level"
          label="Experience level"
          value={profile.experience_level}
        />
        <label className="text-sm">
          Profile category
          <select
            name="profile_category"
            defaultValue={profile.profile_category ?? "athlete"}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Bio
        <textarea
          name="bio"
          maxLength={500}
          defaultValue={profile.bio ?? ""}
          rows={4}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-4"
        />
      </label>
      <div>
        <p className="mb-2 text-sm">Profile anthem</p>
        <MusicPicker />
      </div>
      <div className="space-y-2">
        {[
          ["is_private", "Private account", profile.is_private],
          [
            "show_momentum_score",
            "Show Momentum Score",
            profile.show_momentum_score,
          ],
          [
            "show_workout_stats",
            "Show workout statistics",
            profile.show_workout_stats,
          ],
        ].map(([name, label, checked]) => (
          <label
            key={String(name)}
            className="flex items-center justify-between rounded-xl bg-white/[.03] p-4 text-sm"
          >
            {String(label)}
            <input
              name={String(name)}
              type="checkbox"
              defaultChecked={Boolean(checked)}
              className="accent-[#a8ff2a]"
            />
          </label>
        ))}
      </div>
      <button
        disabled={pending || Boolean(avatarError)}
        className="w-full rounded-full bg-acid py-3 font-bold text-ink disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        name={name}
        defaultValue={value ?? ""}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3"
      />
    </label>
  );
}
