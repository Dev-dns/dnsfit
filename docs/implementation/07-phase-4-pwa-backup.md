# Phase 4 - PWA And Backup

## Status
Implemented on 2026-06-11.

Validation:
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser smoke test loaded `#more`, opened Backup, and rendered export/import/delete controls.

Notes:
- PWA is configured through `vite-plugin-pwa` with generated manifest and service worker.
- Backup export includes all MVP stores, including `restTimers` from Dexie v2.
- Import mode is replace-all with confirmation and shape/reference validation before writing.
- Delete local data requires confirmation and reseeds muscle groups/settings.

## Objective
Finalize dnsfit as an installable, offline-capable, local-first PWA with safe JSON export/import and clear local-data management.

## Scope
- Configure PWA manifest.
- Add icons and theme colors.
- Configure service worker/app shell caching.
- Add iPhone install instructions.
- Add settings/data management screen.
- Export complete JSON backup.
- Import JSON backup with validation.
- Replace-all import mode with confirmation.
- Delete local data with confirmation.
- Add privacy message.
- Run production readiness validation using available scripts.

## Out Of Scope
- Cloud sync.
- Remote encrypted backups.
- Merge import.
- User accounts.
- Native app store packaging.
- Push notification workflows.

## Architecture Affected
- `public/manifest.webmanifest`
- `public/icons/*`
- Vite PWA config.
- `src/features/settings`
- `src/features/backup`
- `src/domain/backup`
- `src/db/repositories/backupRepository.ts`
- `src/db/migrations.ts` if backup versioning requires migration support.

## Data Model
Backup envelope:

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

Filename:
- `dnsfit-backup-YYYY-MM-DD.json`

## Screens
- Settings.
- Backup/export section.
- Import preview.
- Import confirmation.
- Danger zone for deleting local data.
- Install instructions.
- Privacy notice.

## Components
- `ExportBackupButton`
- `ImportBackupInput`
- `ImportPreview`
- `ConfirmImportDialog`
- `DangerZone`
- `InstallInstructionsCard`
- `PrivacyNotice`
- `StorageStatusCard`

## Domain Logic
- `createBackupFile(data)`.
- `validateBackupFile(json)`.
- `validateBackupReferences(data)`.
- `getBackupCounts(data)`.
- `getBackupFilename(date)`.
- `replaceAllDataFromBackup(data)` via repository transaction.
- `clearLocalData()` with confirmation.

## Persistence
- Export all required stores consistently.
- Import validation runs before any write.
- Replace-all import clears known app tables and inserts backup records inside one transaction.
- Invalid imports must not partially write data.
- Preserve seeded defaults if import intentionally omits future optional stores only after a versioned migration decision.

## Edge Cases
- Malformed JSON.
- Backup from unsupported newer schema.
- Backup missing required stores.
- Duplicate IDs.
- Broken entity references.
- Import interrupted.
- Storage quota exceeded.
- User selects the wrong file.
- Private browsing blocks persistent storage.
- Service worker serves stale assets.
- iOS does not expose a native install prompt.

## Manual Validation
- Build the app with available package script.
- Verify manifest fields and icons.
- Install app where browser support allows.
- Load app offline after first visit.
- Create sample data and export JSON.
- Clear local data and import the backup.
- Confirm exercises, routines, workouts, sets, settings, and muscles restore.
- Try malformed JSON and confirm safe rejection.
- Try unsupported schema version and confirm safe rejection.
- Confirm replace-all import and local delete require confirmation.
- Confirm privacy text appears in settings.

## Completion Criteria
- App is installable as a PWA where supported.
- App shell works offline after initial load.
- Full JSON backup export works.
- Valid backup import restores data.
- Invalid backup import fails safely.
- Local data deletion is protected by confirmation.
- Settings explain local-only privacy and iPhone installation.
