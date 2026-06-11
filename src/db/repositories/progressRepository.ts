import { calculateProgressSummary } from "../../domain/volume/progressCalculations";
import type { ProgressRange } from "../../domain/volume/progressTypes";
import { db } from "../db";

export const progressRepository = {
  getSummary: async (range: ProgressRange) => {
    const [workouts, sets, exercises, muscleGroups] = await Promise.all([
      db.workouts.toArray(),
      db.workoutSets.toArray(),
      db.exercises.toArray(),
      db.muscleGroups.toArray()
    ]);

    return calculateProgressSummary(range, workouts, sets, exercises, muscleGroups);
  }
};
