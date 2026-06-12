import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { workoutRepository } from "../../db/repositories/workoutRepository";
import type { Exercise } from "../../domain/exercises/exerciseTypes";
import { getRemainingRestSeconds } from "../../domain/restTimer/restTimerRules";
import type { RestTimerState } from "../../domain/restTimer/restTimerTypes";
import type { RoutineExercise } from "../../domain/routines/routineTypes";
import { calculateEffectiveSetCount, calculateKgVolume } from "../../domain/volume/volumeCalculations";
import type { Workout, WorkoutExercise, WorkoutSet } from "../../domain/workouts/workoutTypes";

type ActiveBundle = {
  workout: Workout;
  workoutExercises: WorkoutExercise[];
  sets: WorkoutSet[];
  exercises: Array<Exercise | undefined>;
  routineExercises: Array<RoutineExercise | undefined>;
  restTimer?: RestTimerState;
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
};

const parseOptionalNumber = (value: string) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatReferenceDate = (value: string | undefined) => {
  if (!value) return undefined;
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(value));
};

export function TrainingPage() {
  const [bundle, setBundle] = useState<ActiveBundle | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingRestSeconds, setRemainingRestSeconds] = useState(0);
  const [confirmAction, setConfirmAction] = useState<"finish" | "cancel" | null>(null);

  const refresh = async () => {
    const activeBundle = await workoutRepository.getActiveBundle();
    setBundle(activeBundle);
    if (activeBundle) {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(activeBundle.workout.startedAt).getTime()) / 1000)));
      setRemainingRestSeconds(activeBundle.restTimer ? getRemainingRestSeconds(activeBundle.restTimer) : 0);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!bundle) return undefined;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(bundle.workout.startedAt).getTime()) / 1000)));
      setRemainingRestSeconds(bundle.restTimer ? getRemainingRestSeconds(bundle.restTimer) : 0);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [bundle]);

  const completedExerciseCount = useMemo(() => {
    if (!bundle) return 0;
    return bundle.workoutExercises.filter((workoutExercise) => {
      const sets = bundle.sets.filter((set) => set.workoutExerciseId === workoutExercise.id);
      return sets.length > 0 && sets.every((set) => set.isCompleted);
    }).length;
  }, [bundle]);

  const updateSet = async (setId: string, patch: Partial<WorkoutSet>) => {
    if (!bundle) return;
    setBundle({
      ...bundle,
      sets: bundle.sets.map((set) => {
        if (set.id !== setId) return set;
        const next = { ...set, ...patch };
        return {
          ...next,
          isCompleted: typeof next.weight === "number" && next.weight >= 0 && typeof next.reps === "number" && next.reps > 0,
          completedAt: typeof next.weight === "number" && next.weight >= 0 && typeof next.reps === "number" && next.reps > 0 ? (next.completedAt ?? new Date().toISOString()) : undefined
        };
      })
    });
    await workoutRepository.updateSet(setId, patch);
    await refresh();
  };

  const pauseRest = async () => {
    if (!bundle?.restTimer) return;
    await workoutRepository.pauseRestTimer(bundle.workout.id, remainingRestSeconds);
    await refresh();
  };

  const resumeRest = async () => {
    if (!bundle?.restTimer) return;
    await workoutRepository.resumeRestTimer(bundle.workout.id, remainingRestSeconds || bundle.restTimer.durationSeconds);
    await refresh();
  };

  const resetRest = async () => {
    if (!bundle?.restTimer) return;
    await workoutRepository.resetRestTimer(bundle.workout.id);
    await refresh();
  };

  const skipRest = async () => {
    if (!bundle?.restTimer) return;
    await workoutRepository.skipRestTimer(bundle.workout.id);
    await refresh();
  };

  const startRestForSet = async (setId: string) => {
    await workoutRepository.startRestTimerForSet(setId);
    await refresh();
  };

  const finishWorkout = async () => {
    if (!bundle) return;
    const hasIncompleteSets = bundle.sets.some((set) => !set.isCompleted);
    if (hasIncompleteSets) {
      setConfirmAction("finish");
      return;
    }
    await completeWorkout();
  };

  const completeWorkout = async () => {
    await workoutRepository.finishActive();
    setConfirmAction(null);
    await refresh();
    window.location.hash = "more";
  };

  const cancelWorkout = async () => {
    await workoutRepository.cancelActive();
    setConfirmAction(null);
    await refresh();
  };

  if (!bundle) {
    return (
      <EmptyState
        title="No hay entreno activo"
        description="Inicia una sesion desde Rutinas. Si cierras la app durante un entreno, aparecera aqui al volver."
        actionLabel="Ir a rutinas"
        onAction={() => { window.location.hash = "routines"; }}
      />
    );
  }

  const effectiveSets = calculateEffectiveSetCount(bundle.sets);
  const volumeKg = calculateKgVolume(bundle.sets);
  const showRestTimer = bundle.restTimer && bundle.restTimer.status !== "idle";

  return (
    <div className="space-y-4">
      <Card className="sticky top-0 z-20 border-danger/50 bg-ink/95 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="danger">Activo</Badge>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">{bundle.workout.name}</h2>
            <p className="mt-2 font-mono text-3xl font-black text-white">{formatDuration(elapsedSeconds)}</p>
            <p className="mt-1 text-xs text-muted">{completedExerciseCount}/{bundle.workoutExercises.length} ejercicios</p>
            <p className="mt-2 font-mono text-xs text-muted">{effectiveSets} sets efectivos · {Math.round(volumeKg)} kg</p>
          </div>
          <div className="space-y-2">
            <Button className="min-h-0 px-3 py-2 text-xs" onClick={finishWorkout}>Finalizar</Button>
            <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={() => setConfirmAction("cancel")}>Cancelar</Button>
          </div>
        </div>
      </Card>

      {showRestTimer ? (
        <Card className="border-danger/40 bg-danger/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-danger">Descanso</p>
              <p className="mt-1 font-mono text-4xl font-black">{formatDuration(remainingRestSeconds).slice(3)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {bundle.restTimer?.status === "running" ? (
                <Button variant="secondary" className="min-h-0 px-3 py-2 text-xs" onClick={pauseRest}>Pausar</Button>
              ) : (
                <Button variant="secondary" className="min-h-0 px-3 py-2 text-xs" onClick={resumeRest}>Reanudar</Button>
              )}
              <Button variant="secondary" className="min-h-0 px-3 py-2 text-xs" onClick={resetRest}>Reset</Button>
              <Button variant="ghost" className="col-span-2 min-h-0 px-3 py-2 text-xs" onClick={skipRest}>Saltar</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {bundle.workoutExercises.map((workoutExercise, index) => {
        const exercise = bundle.exercises[index];
        const routineExercise = bundle.routineExercises[index];
        const sets = bundle.sets.filter((set) => set.workoutExerciseId === workoutExercise.id);
        return (
          <Card key={workoutExercise.id}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-danger">Ejercicio {index + 1}</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">{exercise?.name ?? "Ejercicio archivado"}</h3>
                <p className="mt-1 text-sm text-muted">
                  {routineExercise?.structureType === "top_set_back_off" ? "Top set + back off" : "Estructura normal"}
                </p>
              </div>
              <Badge>{sets.filter((set) => set.isCompleted).length}/{sets.length}</Badge>
            </div>

            <div className="space-y-3">
              {sets.map((set) => (
                <div key={set.id} className={`rounded-3xl border p-3 ${set.isCompleted ? "border-danger/60 bg-danger/10" : "border-line bg-ink"}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Serie {set.order}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                        {set.setType}{typeof set.targetRir === "number" ? ` · objetivo RIR ${set.targetRir}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={() => startRestForSet(set.id)}>Descanso</Button>
                      <Badge tone={set.isCompleted ? "danger" : "neutral"}>{set.isCompleted ? "OK" : "Pendiente"}</Badge>
                    </div>
                  </div>
                  <div className="mb-3 rounded-2xl border border-line bg-panel px-3 py-2 text-xs text-muted">
                    {set.previousWeight || set.previousReps || set.previousRir ? (
                      <span>Anterior{formatReferenceDate(set.previousWorkoutDate) ? ` (${formatReferenceDate(set.previousWorkoutDate)})` : ""}: {set.previousWeight ?? "-"} kg x {set.previousReps ?? "-"} @ {set.previousRir ?? "-"}</span>
                    ) : (
                      <span>Sin referencia previa</span>
                    )}
                    {set.suggestedWeight ? <span className="mt-1 block text-danger">Sugerido back off: {set.suggestedWeight} kg</span> : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Kg"
                      inputMode="decimal"
                      value={set.weight ?? ""}
                      onChange={(event) => updateSet(set.id, { weight: parseOptionalNumber(event.target.value) })}
                    />
                    <Input
                      label="Reps"
                      inputMode="numeric"
                      value={set.reps ?? ""}
                      onChange={(event) => updateSet(set.id, { reps: parseOptionalNumber(event.target.value) })}
                    />
                    <Input
                      label="RIR"
                      inputMode="numeric"
                      value={set.rir ?? ""}
                      onChange={(event) => updateSet(set.id, { rir: parseOptionalNumber(event.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      <ConfirmDialog
        isOpen={confirmAction === "finish"}
        title="Finalizar con series pendientes"
        description="Hay series sin completar. Se guardara el entreno con el historial actual y las series incompletas no contaran como volumen efectivo."
        confirmLabel="Finalizar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={completeWorkout}
      />
      <ConfirmDialog
        isOpen={confirmAction === "cancel"}
        title="Cancelar entreno activo"
        description="El entreno pasara a cancelado y no aparecera como entrenamiento completado en historial/progreso."
        confirmLabel="Cancelar entreno"
        onCancel={() => setConfirmAction(null)}
        onConfirm={cancelWorkout}
      />
    </div>
  );
}
