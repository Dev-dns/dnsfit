# Phase 0 - Foundation

## Status
Implemented on 2026-06-11.

Validation:
- `npm run typecheck` passed.
- `npm run build` passed.

## Objective
Create the technical foundation for dnsfit: React/Vite/TypeScript/Tailwind/Dexie/PWA-ready structure, documented architecture, base domain types, database skeleton, seed data, and mobile app shell.

## Scope
- Initialize the frontend project when approved.
- Configure TypeScript, React, Vite, and Tailwind.
- Add Dexie and create the v1 database skeleton.
- Add the folder structure defined in `01-architecture.md`.
- Add base domain types for all MVP entities.
- Add idempotent seed logic for muscle groups and global settings.
- Add mobile-first app shell and bottom navigation placeholders.
- Add placeholder routes for dashboard, routines, training, progress, and more/settings.
- Add PWA plugin dependency/config placeholder if the project setup includes it, but defer complete offline behavior to Phase 4.

## Out Of Scope
- Real exercise/routine CRUD.
- Active workout implementation.
- Top set/back off behavior.
- Previous references.
- Rest timer.
- Progress analytics.
- Muscle SVG heatmap.
- JSON import/export.

## Architecture Affected
- `src/app`
- `src/components/ui`
- `src/components/layout`
- `src/features/*` placeholder pages
- `src/domain/*` type files
- `src/db/db.ts`
- `src/db/schema.ts`
- `src/db/migrations.ts`
- `src/db/seed.ts`
- Project config files created by the selected tooling

## Data Model
Define TypeScript types from `02-data-model.md` without implementing all flows yet:
- `Exercise`
- `MuscleGroup`
- `Routine`
- `RoutineDay`
- `RoutineExercise`
- `Workout`
- `WorkoutExercise`
- `WorkoutSet`
- `Settings`

Initial Dexie stores should match the v1 schema in `02-data-model.md`.

## Screens
- Dashboard placeholder.
- Routines placeholder.
- Training placeholder.
- Progress placeholder.
- More/settings placeholder.

## Components
- `AppShell`
- `BottomNav`
- `PageHeader`
- `Button`
- `Card`
- `Input`
- `Select`
- `Badge`
- `EmptyState`
- `ConfirmDialog` placeholder if needed

## Domain Logic
- `createId()` helper using `crypto.randomUUID()`.
- Date helper for ISO timestamps.
- Muscle seed definitions.
- Default settings definition.
- Basic set type constants.

## Persistence
- Dexie database opens successfully.
- Seed default muscle groups idempotently.
- Seed global settings idempotently.
- No React component imports `db` directly.

## Edge Cases
- IndexedDB unavailable or blocked.
- Seed process runs more than once.
- Mobile safe-area issues.
- Narrow viewport horizontal overflow.
- App reload on a nested route.

## Manual Validation
- App loads in desktop and mobile viewport.
- Bottom navigation switches placeholder screens.
- Dexie initializes without console errors.
- Muscle groups and settings seed once.
- Reload keeps seeded data.
- No horizontal overflow at 375px width.

## Completion Criteria
- Project has a working app shell.
- Architecture folders exist.
- MVP entity types exist.
- Dexie v1 schema exists.
- Muscle/settings seeds exist.
- No product feature is hardcoded prematurely.
- Available validation command from `package.json` passes if scripts exist.
