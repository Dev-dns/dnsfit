import type { RoutineExercise } from "../routines/routineTypes";
import type { Settings } from "../settings/settingsTypes";
import type { WorkoutSet } from "../workouts/workoutTypes";

export const getRestSecondsForSet = (set: WorkoutSet, routineExercise: RoutineExercise | undefined, settings: Settings | undefined) => {
  if (set.setType === "top_set" && routineExercise?.topSetRestSeconds) return routineExercise.topSetRestSeconds;
  if (set.setType === "back_off" && routineExercise?.backOffRestSeconds) return routineExercise.backOffRestSeconds;
  return routineExercise?.restSeconds ?? settings?.defaultRestSeconds ?? 180;
};

export const getRestSecondsBetweenExercises = (routineExercise: RoutineExercise | undefined, settings: Settings | undefined) => (
  routineExercise?.betweenExercisesRestSeconds ?? settings?.defaultBetweenExercisesRestSeconds ?? 240
);

export const getRemainingRestSeconds = (timer: { status: "idle" | "running" | "paused"; startedAt?: string; durationSeconds: number; remainingSeconds?: number }) => {
  if (timer.status === "paused") return timer.remainingSeconds ?? timer.durationSeconds;
  if (timer.status !== "running" || !timer.startedAt) return 0;
  const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
  return Math.max(0, timer.durationSeconds - elapsed);
};
