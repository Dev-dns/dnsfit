# dnsfit

dnsfit is a local-first, mobile-first PWA for personal gym training tracking.

## MVP Stack
- React
- Vite
- TypeScript
- Tailwind CSS
- Dexie / IndexedDB
- vite-plugin-pwa
- react-muscle-highlighter

## Scripts
- `npm run dev` starts the Vite dev server.
- `npm run typecheck` runs TypeScript validation.
- `npm run build` runs TypeScript validation and production build.
- `npm run preview` serves the production build locally.

## Implementation Source
- Product and architecture rules: `AGENTS.md`.
- MVP implementation plans: `docs/implementation`.
- Phase plans and completion status: `docs/implementation/03-phase-0-foundation.md` through `docs/implementation/07-phase-4-pwa-backup.md`.

## MVP Constraints
- No backend.
- No login.
- No cloud sync.
- IndexedDB is the source of truth.
- JSON export/import is the backup mechanism.
