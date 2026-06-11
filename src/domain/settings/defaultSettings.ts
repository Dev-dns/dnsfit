import { nowIso } from "../shared/entity";
import type { Settings } from "./settingsTypes";

export const createDefaultSettings = (): Settings => {
  const now = nowIso();
  return {
    id: "global",
    weightUnit: "kg",
    defaultRestSeconds: 180,
    defaultBetweenExercisesRestSeconds: 240,
    rirEnabled: true,
    theme: "dark",
    backupReminderEnabled: true,
    createdAt: now,
    updatedAt: now
  };
};
