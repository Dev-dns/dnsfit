export type Settings = {
  id: "global";
  weightUnit: "kg" | "lb";
  defaultRestSeconds: number;
  defaultBetweenExercisesRestSeconds: number;
  rirEnabled: boolean;
  theme: "dark";
  backupReminderEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};
