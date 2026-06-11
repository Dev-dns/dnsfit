import type { WorkoutSet } from "../workouts/workoutTypes";
import { effectiveSetTypes } from "../workouts/workoutTypes";

export const isEffectiveSet = (set: WorkoutSet) => set.isCompleted && effectiveSetTypes.includes(set.setType);

export const calculateEffectiveSetCount = (sets: WorkoutSet[]) => sets.filter(isEffectiveSet).length;

export const calculateKgVolume = (sets: WorkoutSet[]) =>
  sets
    .filter((set) => isEffectiveSet(set) && typeof set.weight === "number" && typeof set.reps === "number")
    .reduce((sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0), 0);
