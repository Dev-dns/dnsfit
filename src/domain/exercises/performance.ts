import type { Exercise } from "./exerciseTypes";
import type { Workout, WorkoutSet } from "../workouts/workoutTypes";

export const rmTargets = [1, 3, 5, 8, 10] as const;

export type RmTarget = typeof rmTargets[number];

export type ExercisePerformanceSummary = {
  exerciseId: string;
  autoPrWeightKg?: number;
  autoPrReps?: number;
  autoPrRir?: number;
  autoEstimatedOneRmKg?: number;
  autoRms: Partial<Record<RmTarget, number>>;
  manualMaxSet?: {
    weightKg?: number;
    reps?: number;
    rir?: number;
  };
  manualEstimatedOneRmKg?: number;
  manualPrWeightKg?: number;
  manualRms?: Partial<Record<RmTarget, number>>;
};

export const estimateOneRm = (weightKg: number | undefined, reps: number | undefined) => {
  if (weightKg === undefined || reps === undefined || weightKg <= 0 || reps <= 0) return undefined;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
};

export const calculateExercisePerformanceSummaries = (exercises: Exercise[], workouts: Workout[], sets: WorkoutSet[]) => {
  const completedWorkoutIds = new Set(workouts.filter((workout) => workout.status === "completed").map((workout) => workout.id));

  return exercises.map<ExercisePerformanceSummary>((exercise) => {
    const exerciseSets = sets.filter((set) => (
      completedWorkoutIds.has(set.workoutId)
      && set.exerciseId === exercise.id
      && set.isCompleted
      && typeof set.weight === "number"
      && typeof set.reps === "number"
    ));
    const autoRms: Partial<Record<RmTarget, number>> = {};

    for (const target of rmTargets) {
      const best = exerciseSets
        .filter((set) => set.reps === target)
        .reduce<number | undefined>((currentBest, set) => currentBest === undefined || (set.weight ?? 0) > currentBest ? set.weight : currentBest, undefined);
      if (best !== undefined) autoRms[target] = best;
    }

    const autoPrSet = exerciseSets.reduce<WorkoutSet | undefined>((currentBest, set) => (
      currentBest === undefined || (set.weight ?? 0) > (currentBest.weight ?? 0) ? set : currentBest
    ), undefined);

    return {
      exerciseId: exercise.id,
      autoPrWeightKg: autoPrSet?.weight,
      autoPrReps: autoPrSet?.reps,
      autoPrRir: autoPrSet?.rir,
      autoEstimatedOneRmKg: estimateOneRm(autoPrSet?.weight, autoPrSet?.reps),
      autoRms,
      manualMaxSet: exercise.manualPerformance?.maxSet,
      manualEstimatedOneRmKg: estimateOneRm(exercise.manualPerformance?.maxSet?.weightKg, exercise.manualPerformance?.maxSet?.reps),
      manualPrWeightKg: exercise.manualPerformance?.prWeightKg,
      manualRms: exercise.manualPerformance?.rms
    };
  });
};
