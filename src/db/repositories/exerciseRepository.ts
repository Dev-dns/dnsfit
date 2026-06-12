import type { Exercise } from "../../domain/exercises/exerciseTypes";
import { calculateExercisePerformanceSummaries } from "../../domain/exercises/performance";
import { nowIso } from "../../domain/shared/entity";
import { db } from "../db";

export const exerciseRepository = {
  list: () => db.exercises.orderBy("name").toArray(),
  listActive: async () => (await db.exercises.orderBy("name").toArray()).filter((exercise) => !exercise.isArchived),
  listPerformanceSummaries: async () => {
    const [exercises, workouts, sets] = await Promise.all([
      db.exercises.orderBy("name").toArray(),
      db.workouts.toArray(),
      db.workoutSets.toArray()
    ]);
    return calculateExercisePerformanceSummaries(exercises, workouts, sets);
  },
  listMuscles: () => db.muscleGroups.toArray(),
  get: (id: string) => db.exercises.get(id),
  put: (exercise: Exercise) => db.exercises.put({ ...exercise, updatedAt: nowIso() }),
  archive: (id: string) => db.exercises.update(id, { isArchived: true, updatedAt: nowIso() })
};
