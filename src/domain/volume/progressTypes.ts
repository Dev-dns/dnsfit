import type { MuscleGroupId } from "../muscles/muscleTypes";

export type ProgressRange = "week" | "last_week" | "30d" | "all";

export type MuscleVolumeSummary = {
  muscleId: MuscleGroupId;
  muscleName: string;
  effectiveSets: number;
  plannedSets: number;
  volumeKg: number;
  bestWeightKg?: number;
  previousBestWeightKg?: number;
  weightProgressKg?: number;
};

export type ProgressSummary = {
  range: ProgressRange;
  workoutsCount: number;
  totalDurationSeconds: number;
  effectiveSets: number;
  plannedSets: number;
  volumeKg: number;
  muscles: MuscleVolumeSummary[];
};
