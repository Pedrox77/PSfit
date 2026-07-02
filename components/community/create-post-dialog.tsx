import { PostComposer } from "./post-composer";
import type { PostType, WorkoutReceipt } from "@/types/database";
export function CreatePostDialog({
  initialType,
  workoutSessionId,
  workoutReceipt,
}: {
  initialType?: PostType;
  workoutSessionId?: string;
  workoutReceipt?: WorkoutReceipt | null;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl overflow-hidden rounded-2xl border border-white/[.09] bg-[#090c0a] shadow-2xl sm:rounded-3xl">
      <div className="border-b border-white/[.09] p-4 sm:p-5">
        <p className="text-xs text-muted">
          Select media · Edit · Details · Preview · Publish
        </p>
      </div>
      <PostComposer
        initialType={initialType}
        workoutSessionId={workoutSessionId}
        workoutReceipt={workoutReceipt}
      />
    </div>
  );
}
