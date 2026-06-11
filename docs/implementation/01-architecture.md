# Architecture

## Overview
dnsfit is a React, Vite, TypeScript, Tailwind CSS, Dexie, and PWA application. The MVP is fully local-first: IndexedDB is the source of truth, and JSON backups are the portability mechanism.

## Architecture Goals
- Fast workout logging on mobile.
- Clear separation between UI, product flows, domain logic, and persistence.
- Deterministic local behavior with no required network calls.
- Safe IndexedDB schema evolution through Dexie migrations.
- Small modules that can be tested or manually validated independently.

## Source Structure
```txt
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx
  components/
    ui/
    layout/
    feedback/
    muscle-map/
  features/
    dashboard/
    exercises/
    routines/
    training/
    history/
    progress/
    settings/
    backup/
  db/
    db.ts
    schema.ts
    migrations.ts
    seed.ts
    repositories/
      exerciseRepository.ts
      routineRepository.ts
      workoutRepository.ts
      progressRepository.ts
      settingsRepository.ts
      backupRepository.ts
  domain/
    exercises/
    routines/
    workouts/
    muscles/
    volume/
    restTimer/
    backup/
      backupValidation.ts
  hooks/
  lib/
  styles/
  assets/
```

## Layering
Use this flow by default:

```txt
React UI -> feature hook/action -> domain function -> repository -> Dexie
```

Rules:
- Components do not import `db` directly.
- Domain functions should be pure where practical.
- Repositories own Dexie reads/writes and transactions.
- Feature hooks compose domain functions and repositories for screens.
- App shell and routing stay in `src/app`.

## App Layer
`src/app` owns app-wide concerns:
- Router.
- Providers.
- Top-level layout.
- Route guards for active workout resume if needed.
- Bottom navigation configuration.

## Components Layer
`src/components` contains reusable visual building blocks:
- `ui`: Button, Card, Input, Select, Modal, Drawer, Badge.
- `layout`: AppShell, BottomNav, PageHeader, SafeArea.
- `feedback`: EmptyState, ErrorState, LoadingState, ConfirmDialog.
- `muscle-map`: SVG body components that receive already-calculated intensity data.

These components should not know Dexie, workout repositories, or backup internals.

## Features Layer
`src/features` contains product screens and feature-specific components:
- Dashboard.
- Exercises.
- Routines.
- Training.
- History.
- Progress.
- Settings.
- Backup.

Feature folders can contain pages, components, hooks, and small adapters specific to that feature. Shared business rules still belong in `src/domain`.

## Domain Layer
`src/domain` contains core product logic:
- Exercise validation and display helpers.
- Routine structure helpers.
- Workout creation/completion rules.
- Previous reference lookup helpers.
- Top set/back off calculations.
- Rest timer rules.
- Direct muscle volume calculations.
- Backup validation.

Domain code should be independent from React. It can use TypeScript types and plain data objects.

## DB Layer
`src/db` contains local persistence:
- Dexie database instance.
- Schema versions.
- Migrations.
- Seed data.
- Table repositories.
- Import/export transactions.

Dexie schema changes must be versioned. Repository functions should be small and explicit.

## Data Flow Examples
Starting a workout:

```txt
Routine detail page
  -> useStartWorkout action
  -> createWorkoutFromRoutineDay domain function
  -> workoutRepository transaction
  -> navigate to active workout
```

Completing a set:

```txt
WorkoutSetRow
  -> useActiveWorkout action
  -> validate set input / derive rest duration
  -> workoutRepository.updateSet
  -> rest timer state starts from timestamp
```

Showing progress:

```txt
Progress page
  -> workoutRepository.getCompletedWorkoutsInRange
  -> calculateDirectMuscleVolume
  -> MuscleMap receives intensity view model
```

## PWA Architecture
- Keep app shell and assets cacheable.
- Keep muscle SVG assets local.
- Do not require network access for core routes after load.
- Settings should include iPhone install instructions.
- Backup/export must work offline.

## State Management
Start with React state, hooks, and Dexie-backed queries. Add a state library only if repeated cross-feature state becomes a real problem.

Persisted workout data should be saved to Dexie, not kept only in component state. UI-only transient state can stay local.

## Error Handling
- Treat IndexedDB unavailable/blocked as a first-class error state.
- Backup import errors must be user-readable.
- Invalid data should not crash summaries or progress screens.
- Destructive actions require confirmation.

## Implementation Plan Documents
Each phase plan lives in `docs/implementation` and should define objective, scope, out of scope, architecture affected, data model, screens, components, domain logic, persistence, edge cases, validation, and completion criteria.
