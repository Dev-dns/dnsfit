import type { EntityBase } from "../shared/entity";

export type Routine = EntityBase & {
  name: string;
  description?: string;
  goal: "hypertrophy" | "strength" | "maintenance" | "cutting" | "custom";
  isActive: boolean;
};

export type RoutineDay = EntityBase & {
  routineId: string;
  name: string;
  order: number;
  notes?: string;
};

export type RoutineExercise = EntityBase & {
  routineDayId: string;
  exerciseId: string;
  order: number;
  structureType: "normal" | "top_set_back_off";
  targetSets: number;
  topSets?: number;
  backOffSets?: number;
  backOffReductionPercent?: number;
  backOffReductionPercents?: number[];
  plannedTopSetWeight?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  topSetRepsMin?: number;
  topSetRepsMax?: number;
  backOffRepsMin?: number;
  backOffRepsMax?: number;
  targetRirMin?: number;
  targetRirMax?: number;
  targetRirs?: Array<number | undefined>;
  warmupWeightMultipliers?: number[];
  warmupTargetReps?: Array<number | undefined>;
  warmupRestSeconds?: Array<number | undefined>;
  restSeconds?: number;
  topSetRestSeconds?: number;
  backOffRestSeconds?: number;
  betweenExercisesRestSeconds?: number;
  unilateralBetweenSidesRestSeconds?: number;
  notes?: string;
};
