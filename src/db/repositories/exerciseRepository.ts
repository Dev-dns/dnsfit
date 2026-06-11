import type { Exercise } from "../../domain/exercises/exerciseTypes";
import { nowIso } from "../../domain/shared/entity";
import { db } from "../db";

export const exerciseRepository = {
  list: () => db.exercises.orderBy("name").toArray(),
  listActive: async () => (await db.exercises.orderBy("name").toArray()).filter((exercise) => !exercise.isArchived),
  listMuscles: () => db.muscleGroups.toArray(),
  get: (id: string) => db.exercises.get(id),
  put: (exercise: Exercise) => db.exercises.put({ ...exercise, updatedAt: nowIso() }),
  archive: (id: string) => db.exercises.update(id, { isArchived: true, updatedAt: nowIso() })
};
