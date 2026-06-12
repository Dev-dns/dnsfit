import type { Routine, RoutineDay, RoutineExercise } from "../../domain/routines/routineTypes";
import { nowIso } from "../../domain/shared/entity";
import { db } from "../db";

export const routineRepository = {
  list: () => db.routines.orderBy("updatedAt").reverse().toArray(),
  get: (id: string) => db.routines.get(id),
  putRoutine: (routine: Routine) => db.routines.put({ ...routine, updatedAt: nowIso() }),
  archiveRoutine: (id: string) => db.routines.update(id, { isActive: false, updatedAt: nowIso() }),
  putDay: (day: RoutineDay) => db.routineDays.put({ ...day, updatedAt: nowIso() }),
  deleteDay: (id: string) => db.routineDays.delete(id),
  putExercise: (routineExercise: RoutineExercise) => db.routineExercises.put({ ...routineExercise, updatedAt: nowIso() }),
  deleteExercise: (id: string) => db.routineExercises.delete(id),
  moveExercise: async (id: string, direction: "up" | "down") => {
    const current = await db.routineExercises.get(id);
    if (!current) return;

    const exercises = await db.routineExercises.where("routineDayId").equals(current.routineDayId).sortBy("order");
    const currentIndex = exercises.findIndex((exercise) => exercise.id === id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = exercises[targetIndex];
    if (currentIndex < 0 || !target) return;

    const now = nowIso();
    await db.transaction("rw", db.routineExercises, async () => {
      await db.routineExercises.update(current.id, { order: target.order, updatedAt: now });
      await db.routineExercises.update(target.id, { order: current.order, updatedAt: now });
    });
  },
  listDays: (routineId: string) => db.routineDays.where("routineId").equals(routineId).sortBy("order"),
  listExercises: (routineDayId: string) => db.routineExercises.where("routineDayId").equals(routineDayId).sortBy("order"),
  getRoutineDetail: async (routineId: string) => {
    const routine = await db.routines.get(routineId);
    const days = await db.routineDays.where("routineId").equals(routineId).sortBy("order");
    const exercises = await Promise.all(
      days.map(async (day) => ({
        day,
        exercises: await db.routineExercises.where("routineDayId").equals(day.id).sortBy("order")
      }))
    );
    return { routine, days: exercises };
  }
};
