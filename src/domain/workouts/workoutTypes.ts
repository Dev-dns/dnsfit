import type { EntityBase } from "../shared/entity";

export type Workout = EntityBase & {
  routineId?: string;
  routineDayId?: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: "active" | "completed" | "cancelled";
  notes?: string;
};

export type WorkoutExercise = EntityBase & {
  workoutId: string;
  exerciseId: string;
  routineExerciseId?: string;
  order: number;
  setupNotesForThisWorkout?: string;
  isCompleted?: boolean;
};

export type WorkoutSetType = "warmup" | "normal" | "top_set" | "back_off" | "dropset";

export type WorkoutSet = EntityBase & {
  workoutId: string;
  workoutExerciseId: string;
  exerciseId: string;
  order: number;
  setType: WorkoutSetType;
  weight?: number;
  reps?: number;
  targetReps?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  rir?: number;
  targetRir?: number;
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
  previousRir?: number;
  previousWorkoutDate?: string;
  previousReferenceLabel?: string;
  suggestedWeight?: number;
  suggestedWeightMultiplier?: number;
  plannedRestSeconds?: number;
  notes?: string;
  completedAt?: string;
};

export const effectiveSetTypes: WorkoutSetType[] = ["normal", "top_set", "back_off", "dropset"];
