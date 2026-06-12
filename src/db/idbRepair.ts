type StoreDefinition = {
  keyPath: string;
  indexes: string[];
};

const databaseName = "dnsfit";
const repairTargetVersion = 40;

const requiredStores: Record<string, StoreDefinition> = {
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

const createMissingStores = (database: IDBDatabase) => {
  for (const [storeName, definition] of Object.entries(requiredStores)) {
    if (database.objectStoreNames.contains(storeName)) continue;

    const objectStore = database.createObjectStore(storeName, { keyPath: definition.keyPath });
    for (const index of definition.indexes) {
      objectStore.createIndex(index, index);
    }
  }
};

const getMissingStores = (database: IDBDatabase) => {
  return Object.keys(requiredStores).filter((storeName) => !database.objectStoreNames.contains(storeName));
};

const openNativeDatabase = (version?: number) => new Promise<IDBDatabase>((resolve, reject) => {
  const request = version ? indexedDB.open(databaseName, version) : indexedDB.open(databaseName);

  request.onupgradeneeded = () => createMissingStores(request.result);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
  request.onblocked = () => reject(new Error("IndexedDB esta bloqueado por otra pestana abierta."));
});

export const repairMissingObjectStores = async () => {
  if (!("indexedDB" in globalThis)) return;

  const database = await openNativeDatabase();
  const missingStores = getMissingStores(database);
  database.close();

  if (missingStores.length === 0) return;
  if (database.version >= repairTargetVersion) {
    throw new Error("IndexedDB necesita reparacion, pero la version local ya es mas nueva que la app.");
  }

  const repairedDatabase = await openNativeDatabase(repairTargetVersion);
  repairedDatabase.close();
};
