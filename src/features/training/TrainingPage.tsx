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
import { formatSecondsAsRestMinutes } from "../../domain/restTimer/restTimeFormat";
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
  bestWeightsByExercise: Record<string, number | undefined>;
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

const formatRoutineExerciseDetails = (routineExercise: RoutineExercise | undefined) => {
  if (!routineExercise) return [];

  const details = [
    routineExercise.structureType === "top_set_back_off" ? "Top set + back off" : "Estructura normal",
    `${routineExercise.targetSets} series efectivas`,
    `Rest serie ${formatSecondsAsRestMinutes(routineExercise.restSeconds)} min`
  ];

  if (routineExercise.plannedTopSetWeight) details.push(`Top estimado ${routineExercise.plannedTopSetWeight} kg`);
  if (routineExercise.topSetRestSeconds) details.push(`Rest top ${formatSecondsAsRestMinutes(routineExercise.topSetRestSeconds)} min`);
  if (routineExercise.backOffRestSeconds) details.push(`Rest back ${formatSecondsAsRestMinutes(routineExercise.backOffRestSeconds)} min`);
  if (routineExercise.betweenExercisesRestSeconds) details.push(`Sig. ejercicio ${formatSecondsAsRestMinutes(routineExercise.betweenExercisesRestSeconds)} min`);
  if (routineExercise.unilateralBetweenSidesRestSeconds) details.push(`Entre lados ${formatSecondsAsRestMinutes(routineExercise.unilateralBetweenSidesRestSeconds)} min`);
  if (routineExercise.targetRirs?.some((rir) => typeof rir === "number")) {
    details.push(`RIR obj ${routineExercise.targetRirs.map((rir, index) => `S${index + 1}:${typeof rir === "number" ? rir : "-"}`).join(" ")}`);
  }
  if (routineExercise.targetToFailure?.some(Boolean)) {
    details.push(`Fallo obj ${routineExercise.targetToFailure.map((toFailure, index) => toFailure ? `S${index + 1}` : undefined).filter(Boolean).join(" ")}`);
  }
  if (routineExercise.targetReps?.some((reps) => typeof reps === "number")) {
    details.push(`Reps obj ${routineExercise.targetReps.map((reps, index) => `S${index + 1}:${typeof reps === "number" ? reps : "-"}`).join(" ")}`);
  }
  if (routineExercise.targetRepRanges?.some((range) => typeof range.min === "number" || typeof range.max === "number")) {
    details.push(`Rango reps ${routineExercise.targetRepRanges.map((range, index) => `S${index + 1}:${range.min ?? "-"}-${range.max ?? "-"}`).join(" ")}`);
  }
  if (routineExercise.backOffReductionPercents?.length) {
    details.push(`Back off ${routineExercise.backOffReductionPercents.map((percent) => `-${percent}%`).join(" / ")}`);
  } else if (routineExercise.backOffReductionPercent) {
    details.push(`Back off -${routineExercise.backOffReductionPercent}%`);
  }
  if (routineExercise.warmupWeightMultipliers?.length) {
    details.push(`Aprox ${routineExercise.warmupWeightMultipliers.map((percent, index) => `${percent}x ${routineExercise.warmupTargetReps?.[index] ?? "-"} reps`).join(" / ")}`);
  }

  return details;
};

export function TrainingPage() {
  const [bundle, setBundle] = useState<ActiveBundle | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingRestSeconds, setRemainingRestSeconds] = useState(0);
  const [confirmAction, setConfirmAction] = useState<"finish" | "cancel" | null>(null);
  const [notifiedTimerKey, setNotifiedTimerKey] = useState<string | null>(null);

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

  const showRestTimer = bundle?.restTimer && bundle.restTimer.status !== "idle";
  const timerFinished = Boolean(showRestTimer && bundle?.restTimer?.status === "running" && remainingRestSeconds === 0);
  const timerKey = bundle?.restTimer ? `${bundle.restTimer.startedAt ?? "paused"}-${bundle.restTimer.durationSeconds}` : null;

  useEffect(() => {
    if (!timerFinished || !timerKey || notifiedTimerKey === timerKey) return;
    setNotifiedTimerKey(timerKey);
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.75);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.8);
  }, [notifiedTimerKey, timerFinished, timerKey]);

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

  const startRestForExercise = async (workoutExerciseId: string) => {
    await workoutRepository.startRestTimerForExercise(workoutExerciseId);
    await refresh();
  };

  const startSideRestForSet = async (setId: string) => {
    await workoutRepository.startRestTimerBetweenSides(setId);
    await refresh();
  };

  const updateWarmupTopWeight = async (workoutExerciseId: string, value: string) => {
    const weight = parseOptionalNumber(value);
    if (weight === undefined) return;
    await workoutRepository.updateWarmupSuggestionsFromTopWeight(workoutExerciseId, weight);
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

  return (
    <div className="space-y-4 pt-40">
      <Card className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+92px)] z-30 w-[calc(100%-2.5rem)] max-w-[24rem] -translate-x-1/2 border-danger/50 bg-ink/95 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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
        <div className={`fixed inset-0 ${timerFinished ? "z-50 bg-black/82" : "pointer-events-none z-40 bg-black/10"} flex items-center justify-center px-5`}>
          <Card className={`${timerFinished ? "w-full max-w-md border-danger bg-danger/20 text-center shadow-[0_0_70px_rgba(229,9,20,0.45)]" : "pointer-events-auto w-full max-w-xs border-danger bg-danger/25 text-center shadow-[0_0_55px_rgba(229,9,20,0.36)]"}`}>
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-danger">{timerFinished ? "Descanso terminado" : "Descanso activo"}</p>
                <p className={`${timerFinished ? "mt-3 font-mono text-8xl" : "mt-2 font-mono text-6xl"} font-black`}>{formatDuration(remainingRestSeconds).slice(3)}</p>
                <p className="mt-1 text-xs text-muted">Objetivo {formatSecondsAsRestMinutes(bundle.restTimer?.durationSeconds)} min</p>
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
        </div>
      ) : null}

      {bundle.workoutExercises.map((workoutExercise, index) => {
        const exercise = bundle.exercises[index];
        const routineExercise = bundle.routineExercises[index];
        const sets = bundle.sets.filter((set) => set.workoutExerciseId === workoutExercise.id);
        const routineDetails = formatRoutineExerciseDetails(routineExercise);
        const hasWarmups = sets.some((set) => set.setType === "warmup");
        const bestPreviousWeight = bundle.bestWeightsByExercise[workoutExercise.exerciseId];
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
              <div className="grid gap-2 text-right">
                <Badge>{sets.filter((set) => set.isCompleted).length}/{sets.length}</Badge>
                <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={() => startRestForExercise(workoutExercise.id)}>Reloj sig. ej</Button>
              </div>
            </div>

            {routineDetails.length > 0 ? (
              <div className="mb-4 rounded-3xl border border-line bg-panel p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Detalles del ejercicio</p>
                <div className="flex flex-wrap gap-2">
                  {routineDetails.map((detail) => (
                    <span key={detail} className="rounded-full border border-line bg-ink px-3 py-1 text-[11px] font-bold text-muted">
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {exercise?.notes ? (
              <div className="mb-4 rounded-3xl border border-danger/30 bg-danger/10 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-danger">Notas del ejercicio</p>
                <p className="text-sm leading-6 text-white">{exercise.notes}</p>
              </div>
            ) : null}

            {hasWarmups ? (
              <div className="mb-4 rounded-3xl border border-line bg-panel p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Calcular aproximaciones</p>
                <Input
                  label="Peso top en este entreno"
                  inputMode="decimal"
                  placeholder={bestPreviousWeight ? `Max anterior ${bestPreviousWeight} kg` : "Ej. 100"}
                  onBlur={(event) => updateWarmupTopWeight(workoutExercise.id, event.currentTarget.value)}
                />
                <p className="mt-2 text-xs text-muted">Se usa para recalcular las series de aproximacion si no las has editado manualmente.</p>
              </div>
            ) : null}

            <div className="space-y-3">
              {sets.map((set) => (
                <div key={set.id} className={`rounded-3xl border p-3 ${set.isCompleted ? "border-danger/60 bg-danger/10" : "border-line bg-ink"}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Serie {set.order}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                        {set.setType}{typeof set.targetRepsMin === "number" || typeof set.targetRepsMax === "number" ? ` · obj ${set.targetRepsMin ?? "-"}-${set.targetRepsMax ?? "-"} reps` : typeof set.targetReps === "number" ? ` · obj ${set.targetReps} reps` : ""}{set.targetToFailure ? " · fallo" : typeof set.targetRir === "number" ? ` · RIR ${set.targetRir}` : ""}
                      </p>
                      {set.suggestedWeightMultiplier ? (
                        <p className="mt-1 text-xs text-muted">
                          Aprox. x{set.suggestedWeightMultiplier}{set.targetReps ? ` · ${set.targetReps} reps` : ""}{set.plannedRestSeconds ? ` · rest ${formatSecondsAsRestMinutes(set.plannedRestSeconds)} min` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {exercise?.isUnilateral ? (
                        <Button variant="secondary" className="min-h-0 px-3 py-2 text-xs" aria-label={`Iniciar descanso entre lados serie ${set.order}`} onClick={() => startSideRestForSet(set.id)}>Entre lados</Button>
                      ) : null}
                      <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" aria-label={`Iniciar descanso serie ${set.order}`} onClick={() => startRestForSet(set.id)}>Temporizador</Button>
                      <Badge tone={set.isCompleted ? "danger" : "neutral"}>{set.isCompleted ? "OK" : "Pendiente"}</Badge>
                    </div>
                  </div>
                  <div className="mb-3 rounded-2xl border border-line bg-panel px-3 py-2 text-xs text-muted">
                    {set.previousWeight || set.previousReps || set.previousRir ? (
                      <span>Referencia{set.previousReferenceLabel ? ` (${set.previousReferenceLabel})` : formatReferenceDate(set.previousWorkoutDate) ? ` (${formatReferenceDate(set.previousWorkoutDate)})` : ""}: {set.previousWeight ?? "-"} kg x {set.previousReps ?? "-"} @ {set.previousRir ?? "-"}</span>
                    ) : (
                      <span>Sin referencia previa</span>
                    )}
                    {set.suggestedWeight ? <span className="mt-1 block text-danger">Sugerido {set.setType === "warmup" ? "aprox." : "back off"}: {set.suggestedWeight} kg</span> : null}
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
                      label="RIR hecho"
                      inputMode="numeric"
                      value={set.rir ?? ""}
                      onChange={(event) => updateSet(set.id, { rir: parseOptionalNumber(event.target.value) })}
                    />
                  </div>
                  <Button variant={set.wentToFailure || set.rir === 0 ? "primary" : "secondary"} className="mt-2 w-full min-h-0 px-3 py-2 text-xs" onClick={() => updateSet(set.id, { rir: 0, wentToFailure: true })}>Fallo</Button>
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
