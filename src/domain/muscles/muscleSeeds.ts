import type { MuscleGroup } from "./muscleTypes";

export const defaultMuscleGroups: MuscleGroup[] = [
  { id: "chest", name: "Pecho", bodyRegion: "chest", bodyView: "front" },
  { id: "upper_chest", name: "Pecho superior", bodyRegion: "chest", bodyView: "front" },
  { id: "lats", name: "Dorsal", bodyRegion: "back", bodyView: "back" },
  { id: "upper_back", name: "Espalda alta", bodyRegion: "back", bodyView: "back" },
  { id: "traps", name: "Trapecio", bodyRegion: "back", bodyView: "back" },
  { id: "front_delts", name: "Deltoide anterior", bodyRegion: "shoulders", bodyView: "front" },
  { id: "side_delts", name: "Deltoide lateral", bodyRegion: "shoulders", bodyView: "both" },
  { id: "rear_delts", name: "Deltoide posterior", bodyRegion: "shoulders", bodyView: "back" },
  { id: "biceps", name: "Biceps", bodyRegion: "arms", bodyView: "front" },
  { id: "triceps", name: "Triceps", bodyRegion: "arms", bodyView: "back" },
  { id: "forearms", name: "Antebrazo", bodyRegion: "arms", bodyView: "both" },
  { id: "abs", name: "Abdomen", bodyRegion: "core", bodyView: "front" },
  { id: "obliques", name: "Oblicuos", bodyRegion: "core", bodyView: "front" },
  { id: "quads", name: "Cuadriceps", bodyRegion: "legs", bodyView: "front" },
  { id: "hamstrings", name: "Isquios", bodyRegion: "legs", bodyView: "back" },
  { id: "glutes", name: "Gluteo", bodyRegion: "glutes", bodyView: "back" },
  { id: "calves", name: "Gemelo", bodyRegion: "calves", bodyView: "back" },
  { id: "adductors", name: "Aductores", bodyRegion: "legs", bodyView: "front" },
  { id: "abductors", name: "Abductores", bodyRegion: "legs", bodyView: "front" }
];
