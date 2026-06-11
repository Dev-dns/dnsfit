import Body, { type ExtendedBodyPart } from "react-muscle-highlighter";
import type { MuscleGroupId } from "../../domain/muscles/muscleTypes";
import { getMuscleIntensity } from "../../domain/volume/progressCalculations";
import type { MuscleVolumeSummary } from "../../domain/volume/progressTypes";

type MuscleMapProps = {
  muscles: MuscleVolumeSummary[];
};

const colors = ["#8B0000", "#E50914", "#FF1E1E"] as const;

const muscleSlugById: Partial<Record<MuscleGroupId, ExtendedBodyPart["slug"]>> = {
  chest: "chest",
  upper_chest: "chest",
  lats: "upper-back",
  upper_back: "upper-back",
  traps: "trapezius",
  front_delts: "deltoids",
  side_delts: "deltoids",
  rear_delts: "deltoids",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  abs: "abs",
  obliques: "obliques",
  quads: "quadriceps",
  hamstrings: "hamstring",
  glutes: "gluteal",
  calves: "calves",
  adductors: "adductors",
  abductors: "adductors"
};

const intensityToIndex = (effectiveSets: number) => {
  const intensity = getMuscleIntensity(effectiveSets);
  if (intensity === "high") return 3;
  if (intensity === "medium") return 2;
  if (intensity === "low") return 1;
  return 0;
};

const toBodyData = (muscles: MuscleVolumeSummary[]): ExtendedBodyPart[] => {
  const bySlug = new Map<string, number>();

  for (const muscle of muscles) {
    const slug = muscleSlugById[muscle.muscleId];
    if (!slug) continue;
    bySlug.set(slug, Math.max(bySlug.get(slug) ?? 0, intensityToIndex(muscle.effectiveSets)));
  }

  return [...bySlug.entries()]
    .filter(([, intensity]) => intensity > 0)
    .map(([slug, intensity]) => ({
      slug: slug as ExtendedBodyPart["slug"],
      intensity,
      styles: {
        stroke: "#050505",
        strokeWidth: 1.4
      }
    }));
};

export function MuscleMap({ muscles }: MuscleMapProps) {
  const data = toBodyData(muscles);

  return (
    <div className="grid grid-cols-2 gap-3">
      <BodyPanel title="Front" side="front" data={data} />
      <BodyPanel title="Back" side="back" data={data} />
    </div>
  );
}

function BodyPanel({ title, side, data }: { title: string; side: "front" | "back"; data: ExtendedBodyPart[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ink p-3">
      <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{title}</p>
      <div className="flex h-72 items-center justify-center rounded-2xl bg-[#070707]">
        <Body
          data={data}
          side={side}
          gender="male"
          colors={colors}
          scale={0.86}
          border="none"
          defaultFill="#262626"
          defaultStroke="#111111"
          defaultStrokeWidth={0.75}
          disabledParts={["head", "hair", "neck", "hands", "feet", "ankles", "knees", "tibialis", "lower-back"]}
        />
      </div>
    </div>
  );
}
