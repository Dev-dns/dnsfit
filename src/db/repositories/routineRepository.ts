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
