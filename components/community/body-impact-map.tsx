import { WorkoutMuscleMap } from "@/components/training/workout-muscle-map";
import type { WorkoutReceipt } from "@/types/database";

export function BodyImpactMap({
  receipt,
}: {
  receipt: WorkoutReceipt;
}) {
  return (
    <section className="flex h-full min-h-[430px] flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(53,217,245,.08),transparent_48%),#050706] p-5">
      <WorkoutMuscleMap
        primaryMuscles={
          receipt.primary_muscles ?? receipt.muscles
        }
        secondaryMuscles={
          receipt.secondary_muscles ?? []
        }
        muscleSets={receipt.muscle_intensity}
        compact
      />
    </section>
  );
}
