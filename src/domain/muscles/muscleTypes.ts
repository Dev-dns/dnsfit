export type MuscleGroupId =
  | "chest"
  | "upper_chest"
  | "lats"
  | "upper_back"
  | "traps"
  | "front_delts"
  | "side_delts"
  | "rear_delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "adductors"
  | "abductors";

export type BodyRegion = "chest" | "back" | "shoulders" | "arms" | "legs" | "core" | "glutes" | "calves" | "other";

export type MuscleGroup = {
  id: MuscleGroupId;
  name: string;
  bodyRegion: BodyRegion;
  bodyView: "front" | "back" | "both";
};
