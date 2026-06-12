# Phase 2 - Training Logic

## Status
Implemented on 2026-06-11.

Validation:
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser smoke test loaded the app after Dexie v2 migration and rendered the Rutinas screen.

Notes:
- Previous references are captured when a workout is started, using completed workout history.
- Back off suggestions are generated after top set weight changes and preserve manually edited back off weights.
- Rest timer state is persisted in the `restTimers` store with one timer per workout.
- 2026-06-12 update: routine setup supports per-backoff reduction percentages, per-set target RIR, warmup/approach schemes, routine exercise reordering, manual rest timer starts, and previous-reference dates.
- Advanced exercise history drawer and full final summary screen remain future polish beyond the core Phase 2 logic.

## Objective
Add the dnsfit-specific training behavior: top set + back off, back off weight suggestion, previous set references, set types, RIR targets, and adaptive rest timer.

## Scope
- Configure `normal` and `top_set_back_off` routine exercises.
- Configure top sets, back off sets, reduction percent, rep targets, RIR targets, and rest times.
- Configure each back off set with its own reduction percent when needed.
- Configure each planned set with its own target RIR.
- Configure warmup/approach schemes as working-weight multipliers such as `0.5, 0.7, 0.8`.
- Generate set types from routine configuration.
- Suggest back off weight after top set weight is entered.
- Let users override suggested weight.
- Show previous references for each set.
- Add adaptive rest timer with start, pause, resume, reset, and skip.
- Let the user manually start the rest timer from any active workout set.
- Restore rest timer after reload when feasible.
- Improve workout completion summary with effective sets and total volume.

## Out Of Scope
- Muscle SVG heatmap.
- Progress dashboard.
- Long-term exercise charts.
- Backup/import.
- AI progression recommendations.

## Architecture Affected
- `src/features/routines`
- `src/features/training`
- `src/domain/workouts`
- `src/domain/restTimer`
- `src/domain/volume`
- `src/db/repositories/workoutRepository.ts`
- `src/db/repositories/routineRepository.ts`

## Data Model
Use `RoutineExercise` fields:
- `structureType`
- `topSets`
- `backOffSets`
- `backOffReductionPercent`
- `backOffReductionPercents`
- `topSetRepsMin` / `topSetRepsMax`
- `backOffRepsMin` / `backOffRepsMax`
- `targetRirMin` / `targetRirMax`
- `targetRirs`
- `warmupWeightMultipliers`
- `restSeconds`
- `topSetRestSeconds`
- `backOffRestSeconds`
- `betweenExercisesRestSeconds`

Use `WorkoutSet` fields:
- `setType`
- `previousWeight`
- `previousReps`
- `previousRir`
- `previousWorkoutDate`
- `targetRir`
- `suggestedWeight`
- `suggestedWeightMultiplier`
- `isCompleted`
- `completedAt`

Rest timer state is persisted in the `restTimers` store. The timer id is the active workout id, so only one rest timer exists per active workout.

## Screens
- Routine exercise advanced config.
- Active workout with set type labels.
- Active workout with previous reference row.
- Active workout with persistent rest timer bar.
- Workout finished summary.
- Exercise history shortcut/drawer.

## Components
- `StructureTypeSelector`
- `TopSetBackOffEditor`
- `SetTypeBadge`
- `PreviousSetReference`
- `RestTimerBar`
- `RestTimerControls`
- `WorkoutSummaryMetrics`
- `ExerciseHistoryDrawer`

## Domain Logic
- `generatePlannedSets(routineExercise)`.
- `calculateBackOffWeight(topSetWeight, reductionPercent)`.
- `shouldPreserveManualWeight(set)`.
- `findPreviousSetReference(context)`.
- `getRestSecondsForCompletedSet(set, routineExercise, settings)`.
- `calculateEffectiveSetCount(sets)`.
- `calculateWorkoutVolume(sets)`.
- `formatPreviousReference(reference)`.

## Persistence
- Store generated set types explicitly.
- Store suggested weight separately from actual edited weight.
- Store previous reference values on the set for display consistency during the active workout.
- Store previous reference date on the set so the active workout shows when the reference happened.
- Store target RIR on generated workout sets so later routine edits do not mutate an active workout target.
- Store warmup multiplier snapshots on generated warmup sets and suggest warmup weights from the first effective set weight.
- Use completed workouts as the source for future references.
- Persist timer timestamps if timer restore is implemented.

## Edge Cases
- No previous reference exists.
- Previous workout used a different set structure.
- Same exercise appears twice in one routine day.
- User edits top set weight after back off suggestions were generated.
- User manually edited a back off weight before top set changed.
- Back off reduction percent is missing or invalid.
- Timer is running when the app reloads.
- User completes sets out of order.
- RIR is disabled in settings.
- Workout is finalized with unfinished back off sets.

## Manual Validation
- Configure an exercise as 1 top set + 2 back off sets.
- Start a workout and confirm generated set types.
- Enter top set weight and confirm suggested back off weight.
- Manually override a back off weight and confirm it is not overwritten unexpectedly.
- Complete a set and confirm rest timer uses the right duration.
- Pause, resume, reset, and skip the timer.
- Complete a workout, repeat the same routine day, and confirm previous references appear.
- Confirm warmups do not count as effective sets.
- Confirm summary volume ignores incomplete or invalid sets.

## Completion Criteria
- Routine exercises can be configured for top set + back off.
- Workout sets show correct set types.
- Back off weight suggestions work and remain editable.
- Previous references appear during training.
- Rest timer behaves adaptively.
- Effective set and volume summaries follow direct-volume rules.
