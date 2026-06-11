# Phase 1 - Base Functional App

## Status
Implemented on 2026-06-11.

Validation:
- `npm run typecheck` passed.
- `npm run build` passed.

Notes:
- Exercise CRUD is currently under `Mas -> Ejercicios`.
- Completed workout history is currently under `Mas -> Historial`.
- Routine exercises support `normal` and `top_set_back_off` structure selection, but Phase 2 still owns advanced top set/back off suggestions and previous references.

## Objective
Implement the first usable local training loop: create exercises, create routines with days, start a workout from a routine day, log sets, autosave, finish the workout, and view basic history.

## Scope
- Exercises CRUD.
- Routine CRUD.
- Routine days CRUD.
- Routine exercises add/edit/remove/reorder.
- Start workout from a routine day.
- Generate planned workout exercises and sets from routine configuration.
- Active workout screen with global timer.
- Log weight, reps, and RIR per set.
- Autosave all workout edits.
- Resume active workout after reload.
- Finish or cancel workout.
- Basic completed workout history.

## Out Of Scope
- Top set/back off weight suggestion.
- Previous-session references.
- Adaptive rest timer.
- Direct muscle progress views.
- Muscle SVG heatmap.
- JSON backup/import.
- Full PWA offline tuning.

## Architecture Affected
- `src/features/exercises`
- `src/features/routines`
- `src/features/training`
- `src/features/history`
- `src/domain/exercises`
- `src/domain/routines`
- `src/domain/workouts`
- `src/db/repositories/exerciseRepository.ts`
- `src/db/repositories/routineRepository.ts`
- `src/db/repositories/workoutRepository.ts`

## Data Model
Use these entities from `02-data-model.md`:
- `Exercise`
- `Routine`
- `RoutineDay`
- `RoutineExercise`
- `Workout`
- `WorkoutExercise`
- `WorkoutSet`

Required behavior:
- A routine can contain multiple ordered days.
- A routine day can contain multiple ordered exercises.
- Starting a workout snapshots the routine day into workout records.
- A workout has status `active`, `completed`, or `cancelled`.
- There should be at most one active workout.

## Screens
- Exercise list.
- Create/edit exercise.
- Exercise detail.
- Routine list.
- Create/edit routine.
- Routine detail with days.
- Routine day editor.
- Routine exercise config editor.
- Training home with active workout resume.
- Active workout.
- Basic workout summary.
- Basic history list.

## Components
- `ExerciseForm`
- `ExerciseListItem`
- `MuscleSelect`
- `RoutineForm`
- `RoutineDayTabs`
- `RoutineExerciseCard`
- `RoutineExerciseEditor`
- `WorkoutHeader`
- `ExerciseBlock`
- `WorkoutSetRow`
- `WeightInput`
- `RepsInput`
- `RirInput`
- `FinishWorkoutDialog`
- `WorkoutHistoryItem`

## Domain Logic
- Validate exercise form data.
- Validate routine and routine day data.
- Generate workout exercise records from a routine day.
- Generate initial workout set records from routine exercise configuration.
- Calculate workout duration from `startedAt` and `endedAt`.
- Determine whether a workout has incomplete sets.
- Determine whether a set is complete.
- Prevent starting a second active workout without resolving the existing one.

## Persistence
- Use Dexie transactions to start workouts from routine days.
- Update `updatedAt` on all writes.
- Autosave set edits immediately or with a short safe debounce.
- Keep completed workouts readable even if exercises/routines are later archived.
- Archive exercises/routines when needed instead of hard deleting referenced records.

## Edge Cases
- User reloads during active workout.
- User tries to start another workout while one is active.
- Routine day has no exercises.
- Exercise is archived after being used in a completed workout.
- Numeric inputs are empty, decimal, or invalid.
- RIR is disabled in settings.
- User finishes workout with incomplete sets.
- User cancels a workout accidentally.
- Long routine names or exercise names on mobile.

## Manual Validation
- Create an exercise with a direct muscle.
- Edit the exercise and confirm persisted changes.
- Create a routine with at least two days.
- Add and reorder exercises in a routine day.
- Start a workout from a routine day.
- Log weight, reps, and RIR across multiple sets.
- Reload and confirm active workout is restored.
- Finish the workout and confirm it appears in history.
- Cancel a workout and confirm it is not counted as completed.
- Confirm mobile layout remains usable at 375px width.

## Completion Criteria
- Exercises and routines can be managed locally.
- A workout can be started from a routine day.
- Sets can be logged with weight, reps, and RIR.
- Active workout survives reload.
- Workout timer uses real elapsed time from `startedAt`.
- Completed workouts appear in history.
- All data persists in IndexedDB through repositories.
