import type { Exercise } from "../exercises/exerciseTypes";
import type { MuscleGroup, MuscleGroupId } from "../muscles/muscleTypes";
import type { Workout, WorkoutSet } from "../workouts/workoutTypes";
import { calculateEffectiveSetCount, calculateKgVolume, isEffectiveSet } from "./volumeCalculations";
import type { ProgressRange, ProgressSummary } from "./progressTypes";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const day = startOfDay(date);
  const dayIndex = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - dayIndex);
  return day;
};

export const getRangeBounds = (range: ProgressRange, now = new Date()) => {
  if (range === "all") return { start: undefined, end: undefined };
  if (range === "30d") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 29);
    return { start, end: undefined };
  }

  const thisWeekStart = startOfWeek(now);
  if (range === "week") return { start: thisWeekStart, end: undefined };

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return { start: lastWeekStart, end: thisWeekStart };
};

const isWorkoutInRange = (workout: Workout, range: ProgressRange) => {
  if (workout.status !== "completed") return false;
  const { start, end } = getRangeBounds(range);
  const date = new Date(workout.endedAt ?? workout.startedAt);
  if (start && date < start) return false;
  if (end && date >= end) return false;
  return true;
};

export const calculateProgressSummary = (
  range: ProgressRange,
  workouts: Workout[],
  sets: WorkoutSet[],
  exercises: Exercise[],
  muscleGroups: MuscleGroup[]
): ProgressSummary => {
  const workoutIds = new Set(workouts.filter((workout) => isWorkoutInRange(workout, range)).map((workout) => workout.id));
  const completedWorkouts = workouts.filter((workout) => workoutIds.has(workout.id));
  const rangeSets = sets.filter((set) => workoutIds.has(set.workoutId));
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const muscleById = new Map(muscleGroups.map((muscle) => [muscle.id, muscle]));
  const muscleTotals = new Map<string, { effectiveSets: number; volumeKg: number }>();

  for (const set of rangeSets) {
    if (!isEffectiveSet(set)) continue;
    const exercise = exerciseById.get(set.exerciseId);
    if (!exercise) continue;

    const current = muscleTotals.get(exercise.primaryDirectMuscle) ?? { effectiveSets: 0, volumeKg: 0 };
    current.effectiveSets += 1;
    if (typeof set.weight === "number" && typeof set.reps === "number") current.volumeKg += set.weight * set.reps;
    muscleTotals.set(exercise.primaryDirectMuscle, current);
  }

  const muscles = [...muscleTotals.entries()]
    .map(([muscleId, totals]) => ({
      muscleId: muscleId as MuscleGroupId,
      muscleName: muscleById.get(muscleId as MuscleGroupId)?.name ?? muscleId,
      effectiveSets: totals.effectiveSets,
      volumeKg: totals.volumeKg
    }))
    .sort((a, b) => b.effectiveSets - a.effectiveSets || b.volumeKg - a.volumeKg);

  return {
    range,
    workoutsCount: completedWorkouts.length,
    totalDurationSeconds: completedWorkouts.reduce((sum, workout) => sum + (workout.durationSeconds ?? 0), 0),
    effectiveSets: calculateEffectiveSetCount(rangeSets),
    volumeKg: calculateKgVolume(rangeSets),
    muscles
  };
};

export const getMuscleIntensity = (effectiveSets: number) => {
  if (effectiveSets <= 0) return "zero";
  if (effectiveSets <= 3) return "low";
  if (effectiveSets <= 8) return "medium";
  return "high";
};
