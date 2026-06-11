import { defaultMuscleGroups } from "../domain/muscles/muscleSeeds";
import { createDefaultSettings } from "../domain/settings/defaultSettings";
import { db } from "./db";

export const seedMuscleGroups = async () => {
  await db.transaction("rw", db.muscleGroups, async () => {
    for (const muscleGroup of defaultMuscleGroups) {
      await db.muscleGroups.put(muscleGroup);
    }
  });
};

export const seedSettings = async () => {
  const existing = await db.settings.get("global");
  if (!existing) {
    await db.settings.put(createDefaultSettings());
  }
};

export const initializeLocalData = async () => {
  await db.open();
  await seedMuscleGroups();
  await seedSettings();
};
