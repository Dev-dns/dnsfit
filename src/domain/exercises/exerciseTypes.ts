import type { EntityBase } from "../shared/entity";
import type { MuscleGroupId } from "../muscles/muscleTypes";

export type ExerciseCategory = "strength" | "cardio" | "mobility" | "other";
export type EquipmentType = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "smith" | "other";
export type ExerciseType = "compound" | "isolation" | "cardio" | "core" | "other";

export type ExerciseTechnicalConfig = {
  resistanceProfile?: "constant" | "ascending" | "descending" | "bell" | "variable" | "custom";
  resistanceProfileNotes?: string;
  machineSettings?: Record<string, string | undefined>;
  benchSettings?: Record<string, string | undefined>;
  setupNotes?: string;
  techniqueCues?: string[];
};

export type ExerciseManualPerformance = {
  maxSet?: {
    weightKg?: number;
    reps?: number;
    rir?: number;
  };
  prWeightKg?: number;
  rms?: Partial<Record<1 | 3 | 5 | 8 | 10, number>>;
};

export type Exercise = EntityBase & {
  name: string;
  category: ExerciseCategory;
  primaryDirectMuscle: MuscleGroupId;
  equipmentType: EquipmentType;
  exerciseType: ExerciseType;
  isUnilateral: boolean;
  technicalConfig?: ExerciseTechnicalConfig;
  manualPerformance?: ExerciseManualPerformance;
  notes?: string;
  visualAsset?: { type: "none" | "icon" | "image"; url?: string };
  isArchived?: boolean;
};
