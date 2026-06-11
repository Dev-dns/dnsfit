import { backupSchemaVersion, type BackupFile } from "./backupTypes";

const requiredStores = [
  "muscleGroups",
  "exercises",
  "routines",
  "routineDays",
  "routineExercises",
  "workouts",
  "workoutExercises",
  "workoutSets",
  "restTimers"
] as const;

export const getBackupFilename = (date = new Date()) => `dnsfit-backup-${date.toISOString().slice(0, 10)}.json`;

export const isBackupFile = (value: unknown): value is BackupFile => {
  if (!value || typeof value !== "object") return false;
  const backup = value as Partial<BackupFile>;
  if (backup.app !== "dnsfit") return false;
  if (backup.schemaVersion !== backupSchemaVersion) return false;
  if (!backup.exportedAt || typeof backup.exportedAt !== "string") return false;
  if (!backup.data || typeof backup.data !== "object") return false;

  return requiredStores.every((store) => Array.isArray((backup.data as Record<string, unknown>)[store])) && Boolean(backup.data.settings);
};

export const validateBackupFile = (value: unknown): BackupFile => {
  if (!isBackupFile(value)) {
    throw new Error("Backup invalido o version no soportada.");
  }

  const exerciseIds = new Set(value.data.exercises.map((exercise) => exercise.id));
  const routineIds = new Set(value.data.routines.map((routine) => routine.id));
  const routineDayIds = new Set(value.data.routineDays.map((day) => day.id));
  const workoutIds = new Set(value.data.workouts.map((workout) => workout.id));
  const workoutExerciseIds = new Set(value.data.workoutExercises.map((exercise) => exercise.id));

  for (const day of value.data.routineDays) {
    if (!routineIds.has(day.routineId)) throw new Error("Backup invalido: dia de rutina sin rutina.");
  }

  for (const routineExercise of value.data.routineExercises) {
    if (!routineDayIds.has(routineExercise.routineDayId)) throw new Error("Backup invalido: ejercicio de rutina sin dia.");
    if (!exerciseIds.has(routineExercise.exerciseId)) throw new Error("Backup invalido: ejercicio de rutina sin ejercicio.");
  }

  for (const workoutExercise of value.data.workoutExercises) {
    if (!workoutIds.has(workoutExercise.workoutId)) throw new Error("Backup invalido: ejercicio de entreno sin entreno.");
    if (!exerciseIds.has(workoutExercise.exerciseId)) throw new Error("Backup invalido: ejercicio de entreno sin ejercicio.");
  }

  for (const set of value.data.workoutSets) {
    if (!workoutIds.has(set.workoutId)) throw new Error("Backup invalido: serie sin entreno.");
    if (!workoutExerciseIds.has(set.workoutExerciseId)) throw new Error("Backup invalido: serie sin ejercicio de entreno.");
    if (!exerciseIds.has(set.exerciseId)) throw new Error("Backup invalido: serie sin ejercicio.");
  }

  return value;
};
