# Data Model

## Overview
The MVP data model is stored in IndexedDB through Dexie. TypeScript types define the application shape, Dexie schema defines persistence indexes, and backup JSON defines portable local data.

## Shared Rules
- Use string IDs, preferably `crypto.randomUUID()`.
- Use ISO strings for dates.
- Most persisted records include `id`, `createdAt`, and `updatedAt`.
- Derived metrics such as direct volume should be recalculated from workouts unless caching becomes necessary.
- Historical workouts should remain readable even if exercises or routines are archived later.

## Entity Types

### Exercise
```ts
type Exercise = {
  id: string;
  name: string;
  category: "strength" | "cardio" | "mobility" | "other";
  primaryDirectMuscle: MuscleGroupId;
  equipmentType: "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "smith" | "other";
  exerciseType: "compound" | "isolation" | "cardio" | "core" | "other";
  isUnilateral: boolean;
  technicalConfig?: ExerciseTechnicalConfig;
  notes?: string;
  visualAsset?: { type: "none" | "icon" | "image"; url?: string };
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Each variant with non-comparable weight history should be a separate exercise.

### MuscleGroup
```ts
type MuscleGroup = {
  id: string;
  name: string;
  bodyRegion: "chest" | "back" | "shoulders" | "arms" | "legs" | "core" | "glutes" | "calves" | "other";
  bodyView: "front" | "back" | "both";
};
```

Minimum seeded muscles:
- Pecho
- Pecho superior
- Dorsal
- Espalda alta
- Trapecio
- Deltoide anterior
- Deltoide lateral
- Deltoide posterior
- Biceps
- Triceps
- Antebrazo
- Abdomen
- Oblicuos
- Cuadriceps
- Isquios
- Gluteo
- Gemelo
- Aductores
- Abductores

### Routine
```ts
type Routine = {
  id: string;
  name: string;
  description?: string;
  goal: "hypertrophy" | "strength" | "maintenance" | "cutting" | "custom";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### RoutineDay
```ts
type RoutineDay = EntityBase & {
  routineId: string;
  name: string;
  order: number;
  notes?: string;
};
```

### RoutineExercise
```ts
type RoutineExercise = EntityBase & {
  routineDayId: string;
  exerciseId: string;
  order: number;
  structureType: "normal" | "top_set_back_off";
  targetSets: number;
  topSets?: number;
  backOffSets?: number;
  backOffReductionPercent?: number;
  backOffReductionPercents?: number[];
  targetRepsMin?: number;
  targetRepsMax?: number;
  topSetRepsMin?: number;
  topSetRepsMax?: number;
  backOffRepsMin?: number;
  backOffRepsMax?: number;
  targetRirMin?: number;
  targetRirMax?: number;
  targetRirs?: Array<number | undefined>;
  warmupWeightMultipliers?: number[];
  restSeconds?: number;
  topSetRestSeconds?: number;
  backOffRestSeconds?: number;
  betweenExercisesRestSeconds?: number;
  notes?: string;
};
```

### Workout
```ts
type Workout = {
  id: string;
  routineId?: string;
  routineDayId?: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: "active" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### WorkoutExercise
```ts
type WorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  routineExerciseId?: string;
  order: number;
  setupNotesForThisWorkout?: string;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### WorkoutSet
```ts
type WorkoutSet = {
  id: string;
  workoutId: string;
  workoutExerciseId: string;
  exerciseId: string;
  order: number;
  setType: "warmup" | "normal" | "top_set" | "back_off" | "dropset";
  weight?: number;
  reps?: number;
  rir?: number;
  targetRir?: number;
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
  previousRir?: number;
  previousWorkoutDate?: string;
  suggestedWeight?: number;
  suggestedWeightMultiplier?: number;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Settings
```ts
type Settings = {
  id: "global";
  weightUnit: "kg" | "lb";
  defaultRestSeconds: number;
  defaultBetweenExercisesRestSeconds: number;
  rirEnabled: boolean;
  theme: "dark";
  backupReminderEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### RestTimerState
```ts
type RestTimerState = EntityBase & {
  workoutId: string;
  durationSeconds: number;
  startedAt?: string;
  pausedAt?: string;
  remainingSeconds?: number;
  status: "idle" | "running" | "paused";
};
```

The MVP uses `id === workoutId` so each active workout has at most one persisted rest timer state.

## Derived Types

### Direct Muscle Volume
```ts
type DirectMuscleVolume = {
  muscleId: MuscleGroupId;
  effectiveSets: number;
  volumeKg: number;
};
```

Rules:
- Count only completed sets.
- Include `normal`, `top_set`, `back_off`, and `dropset`.
- Exclude `warmup` by default.
- Attribute each set only to the exercise `primaryDirectMuscle`.
- `volumeKg` requires valid `weight` and `reps`.

### Previous Set Reference
```ts
type PreviousSetReference = {
  sourceWorkoutId: string;
  sourceWorkoutDate: string;
  weight?: number;
  reps?: number;
  rir?: number;
  setType: WorkoutSet["setType"];
};
```

Lookup priority:
- Same exercise in same routine/day.
- Same exercise in any completed workout.
- Prefer same set order and same set type.

## Dexie Tables
Suggested v1 stores:

```ts
db.version(1).stores({
  muscleGroups: "id, bodyRegion, bodyView",
  exercises: "id, name, primaryDirectMuscle, category, equipmentType, exerciseType, isArchived, updatedAt",
  routines: "id, name, goal, isActive, updatedAt",
  routineDays: "id, routineId, order",
  routineExercises: "id, routineDayId, exerciseId, order, structureType",
  workouts: "id, routineId, routineDayId, status, startedAt, endedAt, updatedAt",
  workoutExercises: "id, workoutId, exerciseId, routineExerciseId, order",
  workoutSets: "id, workoutId, workoutExerciseId, exerciseId, order, setType, isCompleted, completedAt",
  restTimers: "id, workoutId, status, updatedAt",
  settings: "id"
});
```

Add compound indexes only when a query actually needs them.

## Backup Format
```ts
type BackupFile = {
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
```

Import rules:
- Validate `app === "dnsfit"`.
- Validate supported `schemaVersion`.
- Validate required arrays and settings.
- Validate references before replacing local data.
- Use a transaction for replacement.
- Do not partially import invalid backups.

## Integrity Rules
- `RoutineDay.routineId` must reference a routine.
- `RoutineExercise.routineDayId` must reference a routine day.
- `RoutineExercise.exerciseId` must reference an exercise.
- `WorkoutExercise.workoutId` must reference a workout.
- `WorkoutExercise.exerciseId` must reference an exercise.
- `WorkoutSet.workoutId` and `WorkoutSet.workoutExerciseId` must match existing records.
- Summaries should tolerate archived or missing records without crashing.
