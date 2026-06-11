import Dexie, { type EntityTable } from "dexie";
import type { Exercise } from "../domain/exercises/exerciseTypes";
import type { MuscleGroup } from "../domain/muscles/muscleTypes";
import type { RestTimerState } from "../domain/restTimer/restTimerTypes";
import type { Routine, RoutineDay, RoutineExercise } from "../domain/routines/routineTypes";
import type { Settings } from "../domain/settings/settingsTypes";
import type { Workout, WorkoutExercise, WorkoutSet } from "../domain/workouts/workoutTypes";
import { configureSchema } from "./schema";

export class DnsfitDatabase extends Dexie {
  muscleGroups!: EntityTable<MuscleGroup, "id">;
  exercises!: EntityTable<Exercise, "id">;
  routines!: EntityTable<Routine, "id">;
  routineDays!: EntityTable<RoutineDay, "id">;
  routineExercises!: EntityTable<RoutineExercise, "id">;
  workouts!: EntityTable<Workout, "id">;
  workoutExercises!: EntityTable<WorkoutExercise, "id">;
  workoutSets!: EntityTable<WorkoutSet, "id">;
  restTimers!: EntityTable<RestTimerState, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("dnsfit");
    configureSchema(this);
  }
}

export const db = new DnsfitDatabase();
