import type { MuscleGroupId } from "../muscles/muscleTypes";

export type ProgressRange = "week" | "last_week" | "30d" | "all";

export type MuscleVolumeSummary = {
  muscleId: MuscleGroupId;
  muscleName: string;
  effectiveSets: number;
  volumeKg: number;
};

export type ProgressSummary = {
  range: ProgressRange;
  workoutsCount: number;
  totalDurationSeconds: number;
  effectiveSets: number;
  volumeKg: number;
  muscles: MuscleVolumeSummary[];
};
