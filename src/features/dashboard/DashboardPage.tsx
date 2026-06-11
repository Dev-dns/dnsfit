import { useEffect, useState } from "react";
import { MuscleMap } from "../../components/muscle-map/MuscleMap";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { progressRepository } from "../../db/repositories/progressRepository";
import type { ProgressSummary } from "../../domain/volume/progressTypes";

const formatHours = (seconds: number) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

export function DashboardPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    progressRepository.getSummary("week").then(setSummary);
  }, []);

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-danger/25 blur-3xl" />
        <div className="relative">
          <Badge tone="danger">Phase 3</Badge>
          <h2 className="mt-4 text-4xl font-black leading-none tracking-[-0.06em]">Semana de entrenamiento.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            Resumen local de entrenos completados, volumen directo y musculos trabajados esta semana.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button onClick={() => { window.location.hash = "training"; }}>Entreno activo</Button>
            <Button variant="secondary" onClick={() => { window.location.hash = "routines"; }}>Rutinas</Button>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Sesiones" value={summary?.workoutsCount ?? 0} />
        <Metric label="Duracion" value={summary ? formatHours(summary.totalDurationSeconds) : "0h 0m"} />
        <Metric label="Sets efectivos" value={summary?.effectiveSets ?? 0} />
        <Metric label="Volumen" value={`${Math.round(summary?.volumeKg ?? 0)} kg`} />
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <Badge>Directo</Badge>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.05em]">Mapa semanal</h3>
          </div>
          <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={() => { window.location.hash = "progress"; }}>Ver progreso</Button>
        </div>
        <MuscleMap muscles={summary?.muscles ?? []} />
      </Card>
      <Card>
        <h3 className="text-xl font-black tracking-[-0.04em]">Musculos trabajados</h3>
        <div className="mt-4 space-y-3">
          {(summary?.muscles.length ? summary.muscles.slice(0, 5) : []).map((muscle) => (
            <div key={muscle.muscleId} className="flex items-center justify-between rounded-2xl border border-line bg-ink px-4 py-3">
              <span className="text-sm font-bold">{muscle.muscleName}</span>
              <span className="font-mono text-xs text-danger">{muscle.effectiveSets} sets · {Math.round(muscle.volumeKg)} kg</span>
            </div>
          ))}
          {summary && summary.muscles.length === 0 ? <p className="text-sm text-muted">Completa un entreno para ver volumen directo semanal.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.05em]">{value}</p>
    </Card>
  );
}
