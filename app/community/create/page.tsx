import { CreatePostDialog } from "@/components/community/create-post-dialog";
import { isPostType } from "@/lib/community/post-options";
import { getWorkoutReceiptPreview } from "../actions";

export const metadata = {
  title: "Create a community post",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; session?: string }>;
}) {
  const { type, session } = await searchParams;
  const initialType =
    type && isPostType(type) ? type : "daily_life";
  const workoutReceipt = session
    ? await getWorkoutReceiptPreview(session)
    : null;

  return (
    <div className="bg-black/20 p-3 sm:p-8">
      <CreatePostDialog
        initialType={initialType}
        workoutSessionId={session}
        workoutReceipt={workoutReceipt}
      />
    </div>
  );
}
