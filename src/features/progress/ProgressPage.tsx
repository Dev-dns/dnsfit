import { useEffect, useState } from "react";
import { MuscleMap } from "../../components/muscle-map/MuscleMap";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { progressRepository } from "../../db/repositories/progressRepository";
import type { ProgressRange, ProgressSummary } from "../../domain/volume/progressTypes";

const ranges: Array<{ id: ProgressRange; label: string }> = [
  { id: "week", label: "Semana" },
  { id: "last_week", label: "Anterior" },
  { id: "30d", label: "30 dias" },
  { id: "all", label: "Todo" }
];

export function ProgressPage() {
  const [range, setRange] = useState<ProgressRange>("week");
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    progressRepository.getSummary(range).then(setSummary);
  }, [range]);

  const maxSets = Math.max(1, ...(summary?.muscles.map((muscle) => muscle.effectiveSets) ?? [0]));

  return (
    <div className="space-y-4">
      <Card>
        <Badge tone="danger">Progreso</Badge>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Volumen directo.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Solo cuenta trabajo directo: normal, top set, back off y dropset completados.</p>
      </Card>

      <div className="grid grid-cols-4 gap-2 rounded-3xl border border-line bg-panel p-1">
        {ranges.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-2xl px-2 py-3 text-xs font-bold ${range === item.id ? "bg-danger text-white" : "text-muted"}`}
            onClick={() => setRange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Entrenos" value={summary?.workoutsCount ?? 0} />
        <Stat label="Sets" value={summary?.effectiveSets ?? 0} />
        <Stat label="Kg" value={Math.round(summary?.volumeKg ?? 0)} />
      </div>

      <Card>
        <MuscleMap muscles={summary?.muscles ?? []} />
      </Card>

      <Card>
        <h3 className="text-xl font-black tracking-[-0.04em]">Musculos</h3>
        <div className="mt-4 space-y-3">
          {summary?.muscles.map((muscle) => (
            <div key={muscle.muscleId}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold text-white">{muscle.muscleName}</span>
                <span className="font-mono text-xs text-muted">{muscle.effectiveSets} sets · {Math.round(muscle.volumeKg)} kg</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-danger" style={{ width: `${Math.max(8, (muscle.effectiveSets / maxSets) * 100)}%` }} />
              </div>
            </div>
          ))}
          {summary && summary.muscles.length === 0 ? <p className="text-sm text-muted">No hay volumen directo en este rango.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.05em]">{value}</p>
    </Card>
  );
}
