import type { MuscleGroupId } from "../muscles/muscleTypes";

export type DirectMuscleVolume = {
  muscleId: MuscleGroupId;
  effectiveSets: number;
  volumeKg: number;
};
