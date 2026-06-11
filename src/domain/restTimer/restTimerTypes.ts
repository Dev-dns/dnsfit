import type { EntityBase } from "../shared/entity";

export type RestTimerState = EntityBase & {
  workoutId: string;
  durationSeconds: number;
  startedAt?: string;
  pausedAt?: string;
  remainingSeconds?: number;
  status: "idle" | "running" | "paused";
};
