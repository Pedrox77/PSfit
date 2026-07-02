"use client";
import { deleteCommunityPost } from "@/app/community/actions";
import { LoaderCircle, MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";

export function PostMenu({
  own,
  postId,
  onDeleted,
}: {
  own: boolean;
  postId: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const actions = own
    ? ["Edit caption", "Change visibility", "Disable comments", "Delete post"]
    : ["Unfollow", "Mute", "Report", "Block", "Copy post link"];

  function selectAction(action: string) {
    if (action !== "Delete post") {
      setOpen(false);
      return;
    }
    if (!confirm("Delete this post permanently? This cannot be undone.")) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await deleteCommunityPost(postId);
      if (!result.ok) {
        setError(result.error ?? "We could not delete this post.");
        return;
      }
      setOpen(false);
      onDeleted?.();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Post options"
        aria-expanded={open}
        className="p-2 text-muted"
      >
        <MoreHorizontal size={19} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#101512] shadow-2xl">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => selectAction(action)}
              disabled={pending}
              className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-white/[.05] disabled:cursor-wait disabled:opacity-60 ${
                action === "Delete post" ? "text-red-400" : ""
              }`}
            >
              {action === "Delete post" && pending && (
                <LoaderCircle size={15} className="animate-spin" />
              )}
              {action === "Delete post" && pending ? "Deleting..." : action}
            </button>
          ))}
          {error && (
            <p role="alert" className="border-t border-white/10 px-4 py-3 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
