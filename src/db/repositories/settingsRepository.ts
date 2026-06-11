import type { Settings } from "../../domain/settings/settingsTypes";
import { nowIso } from "../../domain/shared/entity";
import { db } from "../db";

export const settingsRepository = {
  getGlobal: () => db.settings.get("global"),
  putGlobal: (settings: Settings) => db.settings.put({ ...settings, id: "global", updatedAt: nowIso() })
};
