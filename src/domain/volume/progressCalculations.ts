import type { Exercise } from "../exercises/exerciseTypes";
import type { MuscleGroup, MuscleGroupId } from "../muscles/muscleTypes";
import type { Routine, RoutineDay, RoutineExercise } from "../routines/routineTypes";
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

const getPreviousRangeBounds = (range: ProgressRange, now = new Date()) => {
  if (range === "all") return { start: undefined, end: undefined };
  const { start, end } = getRangeBounds(range, now);
  if (!start) return { start: undefined, end: undefined };
  const currentEnd = end ?? now;
  const durationMs = currentEnd.getTime() - start.getTime();
  const previousEnd = new Date(start);
  const previousStart = new Date(start.getTime() - durationMs);
  return { start: previousStart, end: previousEnd };
};

const isWorkoutInRange = (workout: Workout, range: ProgressRange) => {
  if (workout.status !== "completed") return false;
  const { start, end } = getRangeBounds(range);
  const date = new Date(workout.endedAt ?? workout.startedAt);
  if (start && date < start) return false;
  if (end && date >= end) return false;
  return true;
};

const isWorkoutBetween = (workout: Workout, start: Date | undefined, end: Date | undefined) => {
  if (workout.status !== "completed") return false;
  const date = new Date(workout.endedAt ?? workout.startedAt);
  if (start && date < start) return false;
  if (end && date >= end) return false;
  return true;
};

const getBestWeightByMuscle = (workouts: Workout[], sets: WorkoutSet[], exercises: Exercise[], start: Date | undefined, end: Date | undefined) => {
  const workoutIds = new Set(workouts.filter((workout) => isWorkoutBetween(workout, start, end)).map((workout) => workout.id));
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const bestByMuscle = new Map<string, number>();

  for (const set of sets) {
    if (!workoutIds.has(set.workoutId) || !isEffectiveSet(set) || typeof set.weight !== "number") continue;
    const exercise = exerciseById.get(set.exerciseId);
    if (!exercise) continue;
    const currentBest = bestByMuscle.get(exercise.primaryDirectMuscle);
    if (currentBest === undefined || set.weight > currentBest) bestByMuscle.set(exercise.primaryDirectMuscle, set.weight);
  }

  return bestByMuscle;
};

const getPlannedSetsByMuscle = (routines: Routine[], routineDays: RoutineDay[], routineExercises: RoutineExercise[], exercises: Exercise[]) => {
  const activeRoutineIds = new Set(routines.filter((routine) => routine.isActive).map((routine) => routine.id));
  const activeDayIds = new Set(routineDays.filter((day) => activeRoutineIds.has(day.routineId)).map((day) => day.id));
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const plannedByMuscle = new Map<string, number>();

  for (const routineExercise of routineExercises) {
    if (!activeDayIds.has(routineExercise.routineDayId)) continue;
    const exercise = exerciseById.get(routineExercise.exerciseId);
    if (!exercise) continue;
    plannedByMuscle.set(
      exercise.primaryDirectMuscle,
      (plannedByMuscle.get(exercise.primaryDirectMuscle) ?? 0) + Math.max(0, routineExercise.targetSets)
    );
  }

  return plannedByMuscle;
};

export const calculateProgressSummary = (
  range: ProgressRange,
  workouts: Workout[],
  sets: WorkoutSet[],
  exercises: Exercise[],
  muscleGroups: MuscleGroup[],
  routines: Routine[] = [],
  routineDays: RoutineDay[] = [],
  routineExercises: RoutineExercise[] = []
): ProgressSummary => {
  const workoutIds = new Set(workouts.filter((workout) => isWorkoutInRange(workout, range)).map((workout) => workout.id));
  const completedWorkouts = workouts.filter((workout) => workoutIds.has(workout.id));
  const rangeSets = sets.filter((set) => workoutIds.has(set.workoutId));
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const muscleById = new Map(muscleGroups.map((muscle) => [muscle.id, muscle]));
  const muscleTotals = new Map<string, { effectiveSets: number; volumeKg: number }>();
  const plannedSets = getPlannedSetsByMuscle(routines, routineDays, routineExercises, exercises);
  const { start: previousStart, end: previousEnd } = getPreviousRangeBounds(range);
  const bestWeights = getBestWeightByMuscle(workouts, sets, exercises, getRangeBounds(range).start, getRangeBounds(range).end);
  const previousBestWeights = getBestWeightByMuscle(workouts, sets, exercises, previousStart, previousEnd);

  for (const set of rangeSets) {
    if (!isEffectiveSet(set)) continue;
    const exercise = exerciseById.get(set.exerciseId);
    if (!exercise) continue;

    const current = muscleTotals.get(exercise.primaryDirectMuscle) ?? { effectiveSets: 0, volumeKg: 0 };
    current.effectiveSets += 1;
    if (typeof set.weight === "number" && typeof set.reps === "number") current.volumeKg += set.weight * set.reps;
    muscleTotals.set(exercise.primaryDirectMuscle, current);
  }

  const muscleIds = new Set([...muscleTotals.keys(), ...plannedSets.keys()]);
  const muscles = [...muscleIds]
    .map((muscleId) => {
      const totals = muscleTotals.get(muscleId) ?? { effectiveSets: 0, volumeKg: 0 };
      const bestWeightKg = bestWeights.get(muscleId);
      const previousBestWeightKg = previousBestWeights.get(muscleId);
      return {
      muscleId: muscleId as MuscleGroupId,
      muscleName: muscleById.get(muscleId as MuscleGroupId)?.name ?? muscleId,
      effectiveSets: totals.effectiveSets,
      plannedSets: plannedSets.get(muscleId) ?? 0,
      volumeKg: totals.volumeKg,
      bestWeightKg,
      previousBestWeightKg,
      weightProgressKg: bestWeightKg !== undefined && previousBestWeightKg !== undefined ? bestWeightKg - previousBestWeightKg : undefined
    };
    })
    .sort((a, b) => b.effectiveSets - a.effectiveSets || b.plannedSets - a.plannedSets);

  return {
    range,
    workoutsCount: completedWorkouts.length,
    totalDurationSeconds: completedWorkouts.reduce((sum, workout) => sum + (workout.durationSeconds ?? 0), 0),
    effectiveSets: calculateEffectiveSetCount(rangeSets),
    plannedSets: [...plannedSets.values()].reduce((sum, value) => sum + value, 0),
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
