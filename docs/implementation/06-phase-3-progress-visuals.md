# Phase 3 - Progress And Visuals

## Status
Implemented on 2026-06-11.

Validation:
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser smoke test loaded `#progress` and rendered filters, stats, front/back SVG maps, and empty state.

Notes:
- Progress derives from raw completed workouts, workout sets, exercises, and muscle groups.
- Muscle map uses `react-muscle-highlighter` through a local `MuscleMap` adapter.
- dnsfit muscle IDs are mapped to the library body part slugs, still using direct volume only.
- Dashboard now shows weekly summary and muscle map.
- Progress supports this week, last week, last 30 days, and all time.

## Objective
Add progress views and visual feedback: direct muscle volume, dashboard summaries, workout summaries, history details, and a simple front/back muscle SVG heatmap.

## Scope
- Direct muscle volume by selected time range.
- Weekly dashboard summary.
- Progress page with filters.
- Workout detail summary.
- Exercise detail history.
- Muscle SVG front/back component.
- Heatmap intensity based on direct effective sets.
- Simple bars/lists for muscles with series and kg volume.

## Out Of Scope
- Backup/import.
- Advanced charting library unless clearly needed.
- Indirect muscle calculation.
- Body weight tracking.
- Nutrition/recovery analytics.
- AI recommendations.

## Architecture Affected
- `src/features/dashboard`
- `src/features/progress`
- `src/features/history`
- `src/features/exercises`
- `src/components/muscle-map`
- `src/domain/volume`
- `src/domain/muscles`
- `src/db/repositories/progressRepository.ts`
- `src/db/repositories/workoutRepository.ts`

## Data Model
No new source-of-truth entities are required by default. Derive progress from:
- Completed `Workout` records.
- Completed `WorkoutSet` records.
- `WorkoutExercise` records.
- `Exercise.primaryDirectMuscle`.
- `MuscleGroup` seed data.

Optional future cache:
- `ProgressSnapshot`, only if derivation becomes slow.

## Screens
- Dashboard with suggested routine/active workout, last workout, weekly sessions, weekly duration, weekly direct volume, and muscle map.
- Progress page with filters: this week, last week, last 30 days, all.
- Workout detail with duration, exercises, effective sets, total kg volume, direct volume by muscle, and muscle map.
- Exercise detail with recent history and best set/volume basics.

## Components
- `MuscleMap`
- `MuscleMapLegend`
- `MuscleVolumeList`
- `VolumeBar`
- `TimeRangeFilter`
- `DashboardSummaryCard`
- `WorkoutSummaryCard`
- `ExerciseHistoryList`
- `MetricCard`

## Domain Logic
- `getCompletedSetsInRange(workouts, sets, range)`.
- `calculateDirectVolumeByMuscle()`.
- `calculateWorkoutSummary()`.
- `calculateWeeklyTrainingStats()`.
- `getMuscleIntensity(effectiveSets)`.
- `mapMuscleIdToSvgRegions()`.
- `getExerciseBestSet()`.
- `getExerciseRecentHistory()`.

## Persistence
- Prefer derived calculations over stored summaries.
- Query completed workouts by date range.
- Keep SVG mapping in source code, not IndexedDB.
- Do not store calculated muscle intensity unless performance requires it later.

## Edge Cases
- No completed workouts.
- Exercise has archived or missing muscle reference.
- Muscle has zero direct work.
- Very high volume on one muscle skews intensity.
- Warmup-only workout.
- Incomplete sets in completed workout.
- User changes exercise primary muscle after historical workouts exist.
- SVG labels/touch targets on narrow mobile screens.

## Manual Validation
- Open dashboard with no data and confirm empty states.
- Complete workouts for multiple direct muscles.
- Confirm dashboard weekly stats update.
- Confirm progress filters change the displayed volume.
- Confirm warmups are excluded from volume.
- Confirm muscle map uses gray for zero sets and red intensities for worked muscles.
- Open workout detail and confirm totals match logged sets.
- Open exercise detail and confirm history is readable.

## Completion Criteria
- Dashboard shows useful training summary.
- Progress page calculates direct muscle volume by range.
- Workout detail summarizes completed training.
- Muscle SVG appears in dashboard, workout summary, and progress.
- Empty/sparse data states are handled cleanly.
- Progress views remain mobile-friendly.
