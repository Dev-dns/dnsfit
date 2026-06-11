import type { Dexie } from "dexie";

export const configureSchema = (db: Dexie) => {
  db.version(1).stores({
    muscleGroups: "id, bodyRegion, bodyView",
    exercises: "id, name, primaryDirectMuscle, category, equipmentType, exerciseType, isArchived, updatedAt",
    routines: "id, name, goal, isActive, updatedAt",
    routineDays: "id, routineId, order",
    routineExercises: "id, routineDayId, exerciseId, order, structureType",
    workouts: "id, routineId, routineDayId, status, startedAt, endedAt, updatedAt",
    workoutExercises: "id, workoutId, exerciseId, routineExerciseId, order",
    workoutSets: "id, workoutId, workoutExerciseId, exerciseId, order, setType, isCompleted, completedAt",
    settings: "id"
  });

  db.version(2)
    .stores({
      muscleGroups: "id, bodyRegion, bodyView",
      exercises: "id, name, primaryDirectMuscle, category, equipmentType, exerciseType, isArchived, updatedAt",
      routines: "id, name, goal, isActive, updatedAt",
      routineDays: "id, routineId, order, updatedAt",
      routineExercises: "id, routineDayId, exerciseId, order, structureType, updatedAt",
      workouts: "id, routineId, routineDayId, status, startedAt, endedAt, updatedAt",
      workoutExercises: "id, workoutId, exerciseId, routineExerciseId, order",
      workoutSets: "id, workoutId, workoutExerciseId, exerciseId, order, setType, isCompleted, completedAt",
      restTimers: "id, workoutId, status, updatedAt",
      settings: "id"
    })
    .upgrade(async (transaction) => {
      const now = new Date().toISOString();
      await transaction.table("routineDays").toCollection().modify((day) => {
        day.createdAt ??= now;
        day.updatedAt ??= now;
      });
      await transaction.table("routineExercises").toCollection().modify((exercise) => {
        exercise.createdAt ??= now;
        exercise.updatedAt ??= now;
      });
    });
};
