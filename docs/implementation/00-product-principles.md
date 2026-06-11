# Product Principles

## Purpose
dnsfit is a private, local-first PWA for tracking real gym training from a phone. The MVP should make workout logging fast, preserve useful training context, and show direct muscle volume without requiring accounts or backend infrastructure.

## Non-Negotiables
- All MVP data is stored locally in IndexedDB using Dexie.
- The MVP has no backend, login, Supabase, Firebase, cloud sync, payments, social features, nutrition, or AI recommendations.
- The app must be mobile-first and optimized for iPhone usage during training.
- The active workout screen is the most important product surface.
- JSON backup/export is mandatory because data is local-only.
- The app should work offline after initial load.

## Product Focus
- Create and manage custom exercises.
- Assign each exercise one direct primary muscle.
- Create routines with days/sessions.
- Start workouts from routine days.
- Register weight, reps, RIR, and set type per set.
- Support top set + back off with suggested back off weight.
- Show previous references while training.
- Run a global workout timer and adaptive rest timer.
- Summarize completed workouts.
- Calculate direct muscle volume.
- Show simple muscle-body visualizations.
- Export/import complete local data as JSON.

## Training Philosophy
dnsfit tracks what happened in the gym, not what a coaching engine guesses. The core value is remembering how a movement was performed, what load/reps/RIR were achieved, and which muscle was directly trained.

## Direct Muscle Volume
- Volume is attributed only to `Exercise.primaryDirectMuscle`.
- Do not estimate indirect muscles.
- Do not apply fractional volume.
- `warmup` sets do not count by default.
- Effective sets are `normal`, `top_set`, `back_off`, and `dropset`.
- Kg volume is `weight * reps` for completed effective sets with valid numeric values.

## Workout UX Principles
- Few taps beat perfect forms.
- Large controls beat dense controls.
- Autosave beats explicit save during workouts.
- Show setup details on demand, not by default.
- Keep charts and deep analytics out of the active workout flow.
- The user should always be able to see duration, current set context, previous reference, and rest timer.

## Visual Principles
- Dark, minimal, technical, and sports-oriented.
- Use cards, thin borders, simple inputs, and strong mobile buttons.
- Use red sparingly for active states, important actions, progress, and worked muscles.
- Muscle visualization should be clear and useful, not anatomically over-complex.

## MVP Boundaries
Included in MVP:
- Exercises
- Muscle groups
- Routines
- Routine days
- Routine exercises
- Active workouts
- Workout exercises
- Workout sets
- Settings
- Direct volume summaries
- Muscle SVG heatmap
- PWA install/offline basics
- JSON backup/import

Excluded from MVP:
- Login
- Supabase
- Firebase
- Backend APIs
- Cloud synchronization
- App Store packaging
- Community/social feed
- Subscription/payments
- Apple Health
- Push notifications beyond basic future-ready PWA support
- Nutrition, macros, sleep, or recovery modules
- Automatic deloads or AI-generated routines
