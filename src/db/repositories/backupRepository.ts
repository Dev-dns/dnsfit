import { backupSchemaVersion, type BackupFile } from "../../domain/backup/backupTypes";
import { validateBackupFile } from "../../domain/backup/backupValidation";
import { seedMuscleGroups, seedSettings } from "../seed";
import { db } from "../db";

export const backupRepository = {
  readAll: async () => ({
    muscleGroups: await db.muscleGroups.toArray(),
    exercises: await db.exercises.toArray(),
    routines: await db.routines.toArray(),
    routineDays: await db.routineDays.toArray(),
    routineExercises: await db.routineExercises.toArray(),
    workouts: await db.workouts.toArray(),
    workoutExercises: await db.workoutExercises.toArray(),
    workoutSets: await db.workoutSets.toArray(),
    restTimers: await db.restTimers.toArray(),
    settings: await db.settings.get("global")
  }),
  createBackup: async (): Promise<BackupFile> => {
    const data = await backupRepository.readAll();
    const settings = data.settings;
    if (!settings) throw new Error("No se encontro la configuracion global.");

    return {
      app: "dnsfit",
      schemaVersion: backupSchemaVersion,
      exportedAt: new Date().toISOString(),
      data: { ...data, settings }
    };
  },
  replaceAll: async (candidate: unknown) => {
    const backup = validateBackupFile(candidate);
    await db.transaction(
      "rw",
      [
        db.muscleGroups,
        db.exercises,
        db.routines,
        db.routineDays,
        db.routineExercises,
        db.workouts,
        db.workoutExercises,
        db.workoutSets,
        db.restTimers,
        db.settings
      ],
      async () => {
        await Promise.all([
          db.muscleGroups.clear(),
          db.exercises.clear(),
          db.routines.clear(),
          db.routineDays.clear(),
          db.routineExercises.clear(),
          db.workouts.clear(),
          db.workoutExercises.clear(),
          db.workoutSets.clear(),
          db.restTimers.clear(),
          db.settings.clear()
        ]);

        await db.muscleGroups.bulkPut(backup.data.muscleGroups);
        await db.exercises.bulkPut(backup.data.exercises);
        await db.routines.bulkPut(backup.data.routines);
        await db.routineDays.bulkPut(backup.data.routineDays);
        await db.routineExercises.bulkPut(backup.data.routineExercises);
        await db.workouts.bulkPut(backup.data.workouts);
        await db.workoutExercises.bulkPut(backup.data.workoutExercises);
        await db.workoutSets.bulkPut(backup.data.workoutSets);
        await db.restTimers.bulkPut(backup.data.restTimers);
        await db.settings.put(backup.data.settings);
      }
    );
  },
  clearAll: async () => {
    await db.transaction(
      "rw",
      [
        db.muscleGroups,
        db.exercises,
        db.routines,
        db.routineDays,
        db.routineExercises,
        db.workouts,
        db.workoutExercises,
        db.workoutSets,
        db.restTimers,
        db.settings
      ],
      async () => {
        await Promise.all([
          db.muscleGroups.clear(),
          db.exercises.clear(),
          db.routines.clear(),
          db.routineDays.clear(),
          db.routineExercises.clear(),
          db.workouts.clear(),
          db.workoutExercises.clear(),
          db.workoutSets.clear(),
          db.restTimers.clear(),
          db.settings.clear()
        ]);
      }
    );
    await seedMuscleGroups();
    await seedSettings();
  }
};
