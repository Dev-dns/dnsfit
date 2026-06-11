# AGENTS.md

## Repository State
- This repository currently has no tracked source files, manifests, README, CI config, or existing instruction files to derive commands from.
- Do not invent setup, build, lint, typecheck, or test commands until a manifest or tool config is added.
- If files are added later, re-check executable sources first: root manifests, lockfiles, config files, CI workflows, and existing instruction files.

## Product Context
- dnsfit is a mobile-first PWA for personal gym training tracking.
- The MVP is local-first and private: all user data lives in the browser on the device.
- The app belongs conceptually to dnsuite, but the MVP must be implemented as an independent application.
- Primary use case: logging strength/hypertrophy workouts on an iPhone during real training sessions.
- Core training concepts: top set + back off, RIR, per-set weight/reps, adaptive rest timer, previous-session references, and direct muscle volume.

## MVP Boundaries
- Use React, Vite, TypeScript, Tailwind CSS, Dexie.js, IndexedDB, vite-plugin-pwa, and Vercel deployment when the app source is created.
- Do not add Supabase, Firebase, custom backend, login, cloud sync, payments, social features, nutrition, Apple Health, or AI recommendations in the MVP.
- Do not introduce external APIs required for core app usage.
- The app must work offline after it has loaded and must be installable as a PWA.
- JSON export/import is the MVP portability and backup mechanism.

## Architecture Rules
- Keep the app layered as UI -> features -> domain -> db.
- Put route/app shell code in `src/app`.
- Put reusable generic components in `src/components`.
- Put screen-level product flows in `src/features`.
- Put business rules and pure calculations in `src/domain`.
- Put Dexie schema, migrations, seeds, and repositories in `src/db`.
- React components must not import the Dexie database instance directly.
- Components may call feature hooks/actions; hooks/actions may call repositories and domain functions.
- Do not put business calculations inside JSX when they can live in `src/domain`.
- Prefer small, explicit modules over broad utility files.
- Do not add compatibility layers unless persisted data, external consumers, or explicit user requirements require them.

## Data Rules
- IndexedDB via Dexie is the source of truth for MVP data.
- Persisted user-created records should have `id`, `createdAt`, and `updatedAt` unless there is a documented exception.
- Use string IDs generated locally, preferably `crypto.randomUUID()`.
- Dexie schema changes require explicit versioned migrations.
- Do not break existing local data without a migration plan.
- `Settings` uses the fixed id `global`.
- Seed muscles and default settings idempotently.
- Archive user-facing records such as exercises/routines when historical workouts may reference them; do not hard-delete referenced records by default.

## Domain Model Rules
- An `Exercise` has one direct primary muscle via `primaryDirectMuscle`.
- Do not calculate indirect, secondary, stabilizer, or fractional muscle volume in the MVP.
- A `Routine` can have multiple `RoutineDay` records.
- A `RoutineExercise` belongs to a `RoutineDay`, not directly to a routine.
- A `Workout` can originate from a routine/day or be created empty if that flow is implemented.
- A `WorkoutExercise` snapshots exercise execution inside a workout.
- A `WorkoutSet` stores actual performed set data and explicit `setType`.
- Valid set types for MVP are `warmup`, `normal`, `top_set`, `back_off`, and `dropset`.

## Training Logic Rules
- Only one active workout should exist at a time unless a future decision explicitly changes this.
- The global workout timer must be derived from `Date.now() - startedAt`, not only from an in-memory counter.
- Active workout edits must autosave to IndexedDB to survive reloads, app closes, and accidental navigation.
- Finishing a workout with incomplete sets must ask for confirmation.
- Effective direct sets are `normal`, `top_set`, `back_off`, and `dropset`.
- `warmup` sets do not count toward direct volume by default.
- Volume in kg is `weight * reps` and only counts completed effective sets with valid numeric values.
- Missing weight/reps should not crash summaries; omit invalid sets from kg volume while preserving set history.

## Top Set And Back Off Rules
- `RoutineExercise.structureType` controls whether an exercise uses normal structure or top set + back off.
- Back off suggestion formula: `topSetWeight * (1 - backOffReductionPercent / 100)`.
- Suggested back off weight must never block manual user edits.
- If the user manually edits a suggested weight, do not overwrite it without an explicit user action.
- Keep top set/back off calculations in `src/domain`, not inside components.

## Previous Reference Rules
- During active workout logging, each set should show the best available previous reference.
- Lookup order: same exercise in same routine/day, then same exercise in any completed workout, then no reference.
- Prefer matching by same set order and same set type when possible.
- If no reference exists, display a clear empty state such as `Sin referencia previa`.
- Historical completed data must not be mutated when used as a reference.

## Rest Timer Rules
- The rest timer should be usable during the active workout and visible as a persistent element.
- Rest duration priority: `topSetRestSeconds` for `top_set`, `backOffRestSeconds` for `back_off`, then `restSeconds`, then `settings.defaultRestSeconds`.
- Between-exercise rest can use `betweenExercisesRestSeconds` or `settings.defaultBetweenExercisesRestSeconds`.
- Timer controls should support start, pause, resume, reset, and skip.
- Timer state should survive reload when feasible by storing timestamps rather than only intervals.

## UI/UX Rules
- Design mobile-first for iPhone usage in the gym.
- Use dark, minimal, technical visual language: `#050505`, `#111111`, `#262626`, white, `#A1A1A1`, and red accents.
- Use red only for important actions, active states, progress, and worked muscles.
- Training screens must prioritize large inputs, few taps, and fast editing.
- During active training, always keep workout duration, current exercise/set context, previous reference, and rest timer easy to access.
- Do not show long technical setup forms during training; expose setup under demand with a `Ver setup` style action.
- Avoid heavy charts or overloaded dashboards inside the active workout screen.
- Preserve accessibility basics: semantic controls, visible focus, sufficient contrast, and touch-friendly targets.

## Muscle Visualization Rules
- Use simple local SVG front/back body views for the MVP.
- Muscle coloring must use direct volume only.
- Muscles with zero work should be dark gray.
- Suggested intensity scale: 0 sets gray, 1-3 low red, 4-8 medium red, 9+ strong red.
- Keep SVG region mapping separate from workout and volume calculation logic.

## Backup And Import Rules
- Backup is mandatory because there is no backend.
- Export all persisted MVP stores: exercises, muscle groups, routines, routine days, routine exercises, workouts, workout exercises, workout sets, and settings.
- Backup files must include `app`, `schemaVersion`, `exportedAt`, and `data`.
- Suggested filename: `dnsfit-backup-YYYY-MM-DD.json`.
- MVP import mode is replace-all or cancel; do not implement merge until explicitly planned.
- Validate JSON shape and backup version before writing data.
- Confirm before replacing all data or deleting local data.
- Imports must not partially write invalid data.

## PWA Rules
- Configure `manifest.webmanifest` with `name`, `short_name`, `theme_color`, `background_color`, and `display: standalone`.
- Cache app shell/assets for basic offline usage.
- Do not depend on remote runtime assets for core screens.
- Include iPhone install instructions in settings.
- Be careful with service worker updates to avoid stale app shells after deploy.

## Verification
- There is no verified validation command yet.
- After implementing future code, use the nearest executable source of truth to choose focused verification instead of guessing from the language or framework.
- Once `package.json` exists, use only scripts defined there or documented repo commands.
- Prefer focused verification first: typecheck, lint, unit tests, then build when available.
- If no automated validation exists, state that clearly and perform/document manual checks.

## Documentation Rules
- Keep implementation plans in `docs/implementation`.
- Each phase plan should define objective, scope, out of scope, affected architecture, data model, screens, components, domain logic, persistence, edge cases, validation, and completion criteria.
- Update the relevant plan when a product rule or architectural decision changes.

## Do Not Do
- Do not add backend infrastructure in the MVP.
- Do not add authentication or accounts in the MVP.
- Do not add cloud sync in the MVP.
- Do not calculate indirect muscle work in the MVP.
- Do not make the workout logging flow depend on network access.
- Do not store critical active workout state only in memory.
- Do not invent tooling commands before manifests/configs exist.
