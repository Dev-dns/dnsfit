import type { Exercise } from "../exercises/exerciseTypes";
import type { MuscleGroup } from "../muscles/muscleTypes";
import type { RestTimerState } from "../restTimer/restTimerTypes";
import type { Routine, RoutineDay, RoutineExercise } from "../routines/routineTypes";
import type { Settings } from "../settings/settingsTypes";
import type { Workout, WorkoutExercise, WorkoutSet } from "../workouts/workoutTypes";

export const backupSchemaVersion = 1;

export type BackupFile = {
  app: "dnsfit";
  schemaVersion: number;
  exportedAt: string;
  data: {
    muscleGroups: MuscleGroup[];
    exercises: Exercise[];
    routines: Routine[];
    routineDays: RoutineDay[];
    routineExercises: RoutineExercise[];
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    workoutSets: WorkoutSet[];
    restTimers: RestTimerState[];
    settings: Settings;
  };
};
