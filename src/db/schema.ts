import type { Dexie } from "dexie";

type StoreDefinition = {
  keyPath: string;
  indexes: string[];
};

const mvpStores: Record<string, StoreDefinition> = {
  muscleGroups: { keyPath: "id", indexes: ["bodyRegion", "bodyView"] },
  exercises: { keyPath: "id", indexes: ["name", "primaryDirectMuscle", "category", "equipmentType", "exerciseType", "isArchived", "updatedAt"] },
  routines: { keyPath: "id", indexes: ["name", "goal", "isActive", "updatedAt"] },
  routineDays: { keyPath: "id", indexes: ["routineId", "order", "updatedAt"] },
  routineExercises: { keyPath: "id", indexes: ["routineDayId", "exerciseId", "order", "structureType", "updatedAt"] },
  workouts: { keyPath: "id", indexes: ["routineId", "routineDayId", "status", "startedAt", "endedAt", "updatedAt"] },
  workoutExercises: { keyPath: "id", indexes: ["workoutId", "exerciseId", "routineExerciseId", "order"] },
  workoutSets: { keyPath: "id", indexes: ["workoutId", "workoutExerciseId", "exerciseId", "order", "setType", "isCompleted", "completedAt"] },
  restTimers: { keyPath: "id", indexes: ["workoutId", "status", "updatedAt"] },
  settings: { keyPath: "id", indexes: [] }
};

const ensureMissingStores = (idbDatabase: IDBDatabase) => {
  for (const [storeName, definition] of Object.entries(mvpStores)) {
    if (idbDatabase.objectStoreNames.contains(storeName)) continue;

    const objectStore = idbDatabase.createObjectStore(storeName, { keyPath: definition.keyPath });
    for (const index of definition.indexes) {
      objectStore.createIndex(index, index);
    }
  }
};

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

  db.version(3)
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
    .upgrade((transaction) => {
      ensureMissingStores(transaction.idbtrans.db);
    });

  db.version(4)
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
    .upgrade((transaction) => {
      ensureMissingStores(transaction.idbtrans.db);
    });
};
