import { useEffect, useState, type SetStateAction } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { exerciseRepository } from "../../db/repositories/exerciseRepository";
import { routineRepository } from "../../db/repositories/routineRepository";
import { workoutRepository } from "../../db/repositories/workoutRepository";
import type { Exercise } from "../../domain/exercises/exerciseTypes";
import { formatSecondsAsRestMinutes, parseRestMinutesToSeconds } from "../../domain/restTimer/restTimeFormat";
import type { Routine, RoutineDay, RoutineExercise } from "../../domain/routines/routineTypes";
import { createId, nowIso } from "../../domain/shared/entity";

type RoutineDetail = {
  day: RoutineDay;
  exercises: RoutineExercise[];
};

export function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [routineDetails, setRoutineDetails] = useState<RoutineDetail[]>([]);
  const [routineName, setRoutineName] = useState("");
  const [dayName, setDayName] = useState("");
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [editingRoutineExerciseId, setEditingRoutineExerciseId] = useState<string | null>(null);
  const [targetSets, setTargetSets] = useState("3");
  const [restMinutes, setRestMinutes] = useState("3");
  const [backOffReductionPercent, setBackOffReductionPercent] = useState("10");
  const [backOffReductionPercents, setBackOffReductionPercents] = useState<string[]>(["10", "12.5"]);
  const [plannedTopSetWeight, setPlannedTopSetWeight] = useState("");
  const [targetRepsMin, setTargetRepsMin] = useState<string[]>(["8", "8", "8"]);
  const [targetRepsMax, setTargetRepsMax] = useState<string[]>(["10", "10", "10"]);
  const [targetRirs, setTargetRirs] = useState<string[]>(["2", "2", "2"]);
  const [topSetRestMinutes, setTopSetRestMinutes] = useState("4");
  const [backOffRestMinutes, setBackOffRestMinutes] = useState("3");
  const [betweenExercisesRestMinutes, setBetweenExercisesRestMinutes] = useState("4");
  const [unilateralBetweenSidesRestMinutes, setUnilateralBetweenSidesRestMinutes] = useState("0.45");
  const [warmupCount, setWarmupCount] = useState("0");
  const [warmupPercents, setWarmupPercents] = useState<string[]>(["0.5", "0.7", "0.8"]);
  const [warmupReps, setWarmupReps] = useState<string[]>(["8", "5", "3"]);
  const [warmupRestMinutes, setWarmupRestMinutes] = useState<string[]>(["1.30", "2", "2.30"]);
  const [structureType, setStructureType] = useState<"normal" | "top_set_back_off">("normal");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refresh = async (nextRoutineId = selectedRoutineId) => {
    const [routineData, exerciseData] = await Promise.all([routineRepository.list(), exerciseRepository.listActive()]);
    setRoutines(routineData);
    setExercises(exerciseData);

    const routineId = nextRoutineId ?? routineData[0]?.id ?? null;
    setSelectedRoutineId(routineId);
    if (routineId) {
      const detail = await routineRepository.getRoutineDetail(routineId);
      setRoutineDetails(detail.days);
      if (!selectedDayId && detail.days[0]) setSelectedDayId(detail.days[0].day.id);
    } else {
      setRoutineDetails([]);
    }
    if (!selectedExerciseId && exerciseData[0]) setSelectedExerciseId(exerciseData[0].id);
  };

  useEffect(() => {
    refresh();
  }, []);

  const selectedRoutine = routines.find((routine) => routine.id === selectedRoutineId);
  const selectedDay = routineDetails.find((detail) => detail.day.id === selectedDayId)?.day;
  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId);
  const targetSetCount = Math.max(1, Number(targetSets) || 1);
  const backOffSetCount = structureType === "top_set_back_off" ? Math.max(1, (Number(targetSets) || 3) - 1) : 0;
  const warmupSetCount = Math.max(0, Number(warmupCount) || 0);

  const getBackOffReductionPercents = () => Array.from({ length: backOffSetCount }, (_, index) => {
    const value = Number(backOffReductionPercents[index] ?? backOffReductionPercent);
    return Math.max(0, Number.isFinite(value) ? value : 10);
  });

  const updateBackOffReductionPercent = (index: number, value: string) => {
    setBackOffReductionPercents((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const getTargetRirs = () => Array.from({ length: targetSetCount }, (_, index) => {
    const value = targetRirs[index];
    if (value === undefined || value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  });

  const parseTargetRepValue = (value: string | undefined) => {
    if (value === undefined || value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, parsed) : undefined;
  };

  const getTargetRepRanges = () => Array.from({ length: targetSetCount }, (_, index) => ({
    min: parseTargetRepValue(targetRepsMin[index]),
    max: parseTargetRepValue(targetRepsMax[index])
  }));

  const updateTargetRepMin = (index: number, value: string) => {
    setTargetRepsMin((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const updateTargetRepMax = (index: number, value: string) => {
    setTargetRepsMax((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const updateTargetRir = (index: number, value: string) => {
    setTargetRirs((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const updateWarmupField = (setter: (value: SetStateAction<string[]>) => void, index: number, value: string) => {
    setter((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const getWarmupPercents = () => Array.from({ length: warmupSetCount }, (_, index) => {
    const parsed = Number((warmupPercents[index] ?? "").replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.5;
  });

  const getWarmupTargetReps = () => Array.from({ length: warmupSetCount }, (_, index) => {
    const parsed = Number(warmupReps[index]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  });

  const getWarmupRestSeconds = () => Array.from({ length: warmupSetCount }, (_, index) => parseRestMinutesToSeconds(warmupRestMinutes[index] ?? "2", 120));

  const resetExerciseForm = () => {
    setEditingRoutineExerciseId(null);
    setTargetSets("3");
    setRestMinutes("3");
    setBackOffReductionPercent("10");
    setBackOffReductionPercents(["10", "12.5"]);
    setPlannedTopSetWeight("");
    setTargetRepsMin(["8", "8", "8"]);
    setTargetRepsMax(["10", "10", "10"]);
    setTargetRirs(["2", "2", "2"]);
    setTopSetRestMinutes("4");
    setBackOffRestMinutes("3");
    setBetweenExercisesRestMinutes("4");
    setUnilateralBetweenSidesRestMinutes("0.45");
    setWarmupCount("0");
    setWarmupPercents(["0.5", "0.7", "0.8"]);
    setWarmupReps(["8", "5", "3"]);
    setWarmupRestMinutes(["1.30", "2", "2.30"]);
    setStructureType("normal");
  };

  const editRoutineExercise = (routineExercise: RoutineExercise) => {
    setEditingRoutineExerciseId(routineExercise.id);
    setSelectedDayId(routineExercise.routineDayId);
    setSelectedExerciseId(routineExercise.exerciseId);
    setTargetSets(String(routineExercise.targetSets));
    setRestMinutes(formatSecondsAsRestMinutes(routineExercise.restSeconds));
    setBackOffReductionPercent(String(routineExercise.backOffReductionPercent ?? 10));
    setBackOffReductionPercents((routineExercise.backOffReductionPercents?.length ? routineExercise.backOffReductionPercents : [routineExercise.backOffReductionPercent ?? 10]).map(String));
    setPlannedTopSetWeight(routineExercise.plannedTopSetWeight ? String(routineExercise.plannedTopSetWeight) : "");
    setTargetRepsMin((routineExercise.targetRepRanges?.length ? routineExercise.targetRepRanges.map((range) => range.min) : (routineExercise.targetReps?.map((reps) => reps) ?? [])).map((value) => value === undefined ? "" : String(value)));
    setTargetRepsMax((routineExercise.targetRepRanges?.length ? routineExercise.targetRepRanges.map((range) => range.max) : (routineExercise.targetReps?.map((reps) => reps) ?? [])).map((value) => value === undefined ? "" : String(value)));
    setTargetRirs((routineExercise.targetRirs?.length ? routineExercise.targetRirs : []).map((value) => value === undefined ? "" : String(value)));
    setTopSetRestMinutes(formatSecondsAsRestMinutes(routineExercise.topSetRestSeconds ?? 240));
    setBackOffRestMinutes(formatSecondsAsRestMinutes(routineExercise.backOffRestSeconds ?? 180));
    setBetweenExercisesRestMinutes(formatSecondsAsRestMinutes(routineExercise.betweenExercisesRestSeconds ?? 240));
    setUnilateralBetweenSidesRestMinutes(formatSecondsAsRestMinutes(routineExercise.unilateralBetweenSidesRestSeconds ?? 45));
    setWarmupCount(String(routineExercise.warmupWeightMultipliers?.length ?? 0));
    setWarmupPercents((routineExercise.warmupWeightMultipliers?.length ? routineExercise.warmupWeightMultipliers : [0.5, 0.7, 0.8]).map(String));
    setWarmupReps((routineExercise.warmupTargetReps?.length ? routineExercise.warmupTargetReps : [8, 5, 3]).map((value) => value === undefined ? "" : String(value)));
    setWarmupRestMinutes((routineExercise.warmupRestSeconds?.length ? routineExercise.warmupRestSeconds : [90, 120, 150]).map(formatSecondsAsRestMinutes));
    setStructureType(routineExercise.structureType);
  };

  const createRoutine = async () => {
    if (!routineName.trim()) return;
    const now = nowIso();
    const routine: Routine = {
      id: createId(),
      name: routineName.trim(),
      goal: "hypertrophy",
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    await routineRepository.putRoutine(routine);
    setRoutineName("");
    await refresh(routine.id);
  };

  const createDay = async () => {
    if (!selectedRoutineId || !dayName.trim()) return;
    const now = nowIso();
    const day: RoutineDay = {
      id: createId(),
      routineId: selectedRoutineId,
      name: dayName.trim(),
      order: routineDetails.length + 1,
      createdAt: now,
      updatedAt: now
    };
    await routineRepository.putDay(day);
    setDayName("");
    setSelectedDayId(day.id);
    await refresh(selectedRoutineId);
  };

  const addRoutineExercise = async () => {
    if (!selectedDayId || !selectedExerciseId) return;
    const existing = editingRoutineExerciseId
      ? routineDetails.flatMap((detailItem) => detailItem.exercises).find((exercise) => exercise.id === editingRoutineExerciseId)
      : undefined;
    const detail = routineDetails.find((item) => item.day.id === selectedDayId);
    const now = nowIso();
    await routineRepository.putExercise({
      id: existing?.id ?? createId(),
      routineDayId: existing?.routineDayId ?? selectedDayId,
      exerciseId: selectedExerciseId,
      order: existing?.order ?? ((detail?.exercises.length ?? 0) + 1),
      structureType,
      targetSets: targetSetCount,
      topSets: structureType === "top_set_back_off" ? 1 : undefined,
      backOffSets: structureType === "top_set_back_off" ? backOffSetCount : undefined,
      backOffReductionPercent: structureType === "top_set_back_off" ? Math.max(0, Number(backOffReductionPercent) || 10) : undefined,
      backOffReductionPercents: structureType === "top_set_back_off" ? getBackOffReductionPercents() : undefined,
      plannedTopSetWeight: Number(plannedTopSetWeight) > 0 ? Number(plannedTopSetWeight) : undefined,
      restSeconds: parseRestMinutesToSeconds(restMinutes, 180),
      targetRepRanges: getTargetRepRanges(),
      targetRirs: getTargetRirs(),
      warmupWeightMultipliers: getWarmupPercents(),
      warmupTargetReps: getWarmupTargetReps(),
      warmupRestSeconds: getWarmupRestSeconds(),
      topSetRestSeconds: structureType === "top_set_back_off" ? parseRestMinutesToSeconds(topSetRestMinutes, 240) : undefined,
      backOffRestSeconds: structureType === "top_set_back_off" ? parseRestMinutesToSeconds(backOffRestMinutes, 180) : undefined,
      betweenExercisesRestSeconds: parseRestMinutesToSeconds(betweenExercisesRestMinutes, 240),
      unilateralBetweenSidesRestSeconds: selectedExercise?.isUnilateral ? parseRestMinutesToSeconds(unilateralBetweenSidesRestMinutes, 45) : undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });
    resetExerciseForm();
    await refresh(selectedRoutineId);
  };

  const startWorkout = async (routineDayId: string) => {
    try {
      await workoutRepository.startFromRoutineDay(routineDayId);
      window.location.hash = "training";
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo iniciar el entreno.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <Badge tone="danger">Rutinas</Badge>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Planifica y arranca.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Crea rutinas, divide por dias y genera entrenos locales desde cada sesion.</p>
        {statusMessage ? <p className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-white">{statusMessage}</p> : null}
      </Card>

      <Card>
        <div className="space-y-3">
          <Input label="Nueva rutina" value={routineName} onChange={(event) => setRoutineName(event.target.value)} placeholder="Push Pull Legs" />
          <Button className="w-full" onClick={createRoutine}>Crear rutina</Button>
        </div>
      </Card>

      {routines.length === 0 ? <EmptyState title="Sin rutinas" description="Crea una rutina y despues anade dias y ejercicios." /> : null}

      {routines.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {routines.map((routine) => (
            <button
              key={routine.id}
              type="button"
              className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-bold ${routine.id === selectedRoutineId ? "border-danger bg-danger text-white" : "border-line bg-panel text-muted"}`}
              onClick={() => refresh(routine.id)}
            >
              {routine.name}
            </button>
          ))}
        </div>
      ) : null}

      {selectedRoutine ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-[-0.05em]">{selectedRoutine.name}</h3>
                <p className="mt-1 text-sm text-muted">Objetivo: {selectedRoutine.goal}</p>
              </div>
              <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={async () => { await routineRepository.archiveRoutine(selectedRoutine.id); await refresh(null); }}>Archivar</Button>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <Input label="Nuevo dia" value={dayName} onChange={(event) => setDayName(event.target.value)} placeholder="Push A" />
              <Button variant="secondary" className="w-full" onClick={createDay}>Anadir dia</Button>
            </div>
          </Card>

          {routineDetails.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {routineDetails.map(({ day }) => (
                <button
                  key={day.id}
                  type="button"
                  className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-bold ${day.id === selectedDayId ? "border-danger bg-danger text-white" : "border-line bg-panel text-muted"}`}
                  onClick={() => setSelectedDayId(day.id)}
                >
                  {day.name}
                </button>
              ))}
            </div>
          ) : null}

          {selectedDay ? (
            <Card>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Badge>{selectedDay.name}</Badge>
                    <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{editingRoutineExerciseId ? "Editar ejercicio" : "Ejercicios del dia"}</h3>
                  </div>
                  <Button className="min-h-0 px-3 py-2 text-xs" onClick={() => startWorkout(selectedDay.id)}>Iniciar</Button>
                </div>
                {exercises.length === 0 ? (
                  <p className="rounded-2xl border border-line bg-ink p-4 text-sm text-muted">Crea ejercicios en Mas antes de anadirlos a una rutina.</p>
                ) : (
                  <>
                    <Select label="Ejercicio" value={selectedExerciseId} onChange={(event) => setSelectedExerciseId(event.target.value)}>
                      {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Series" type="number" min="1" value={targetSets} onChange={(event) => setTargetSets(event.target.value)} />
                      <Select label="Estructura" value={structureType} onChange={(event) => setStructureType(event.target.value as "normal" | "top_set_back_off")}>
                        <option value="normal">normal</option>
                        <option value="top_set_back_off">top + back off</option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Descanso serie (min)" inputMode="decimal" value={restMinutes} onChange={(event) => setRestMinutes(event.target.value)} placeholder="3 o 3.30" />
                      <Input label="Descanso sig. ej (min)" inputMode="decimal" value={betweenExercisesRestMinutes} onChange={(event) => setBetweenExercisesRestMinutes(event.target.value)} placeholder="4 o 4.30" />
                    </div>
                    {selectedExercise?.isUnilateral ? (
                      <Input label="Descanso entre lados (min)" inputMode="decimal" value={unilateralBetweenSidesRestMinutes} onChange={(event) => setUnilateralBetweenSidesRestMinutes(event.target.value)} placeholder="0.45" />
                    ) : null}
                    <Input label="Peso top estimado" inputMode="decimal" value={plannedTopSetWeight} onChange={(event) => setPlannedTopSetWeight(event.target.value)} placeholder="100" />
                    <div className="rounded-3xl border border-line bg-ink p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Aproximaciones</p>
                          <p className="mt-1 text-xs text-muted">% del peso de top set, reps objetivo y descanso.</p>
                        </div>
                        <Input label="Series" className="w-20" type="number" min="0" value={warmupCount} onChange={(event) => setWarmupCount(event.target.value)} />
                      </div>
                      <div className="space-y-3">
                        {Array.from({ length: warmupSetCount }, (_, index) => (
                          <div key={index} className="rounded-2xl border border-line bg-panel p-3">
                            <p className="mb-3 text-sm font-black">Aproximacion {index + 1}</p>
                            <div className="grid grid-cols-3 gap-2">
                              <Input label="% top" inputMode="decimal" value={warmupPercents[index] ?? ""} onChange={(event) => updateWarmupField(setWarmupPercents, index, event.target.value)} placeholder="0.7" />
                              <Input label="Reps" inputMode="numeric" value={warmupReps[index] ?? ""} onChange={(event) => updateWarmupField(setWarmupReps, index, event.target.value)} placeholder="5" />
                              <Input label="Rest" inputMode="decimal" value={warmupRestMinutes[index] ?? ""} onChange={(event) => updateWarmupField(setWarmupRestMinutes, index, event.target.value)} placeholder="2.30" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-line bg-ink p-3">
                      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-muted">Objetivo por serie</p>
                      <div className="space-y-3">
                        {Array.from({ length: targetSetCount }, (_, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-panel p-3">
                            <Input
                              label={`S${index + 1} min`}
                              inputMode="numeric"
                              value={targetRepsMin[index] ?? ""}
                              onChange={(event) => updateTargetRepMin(index, event.target.value)}
                            />
                            <Input
                              label={`S${index + 1} max`}
                              inputMode="numeric"
                              value={targetRepsMax[index] ?? ""}
                              onChange={(event) => updateTargetRepMax(index, event.target.value)}
                            />
                            <Input
                              label={`S${index + 1} RIR`}
                              type="number"
                              min="0"
                              step="0.5"
                              value={targetRirs[index] ?? ""}
                              onChange={(event) => updateTargetRir(index, event.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {structureType === "top_set_back_off" ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: backOffSetCount }, (_, index) => (
                            <Input
                              key={index}
                              label={`Back off ${index + 1} %`}
                              type="number"
                              min="0"
                              step="0.5"
                              value={backOffReductionPercents[index] ?? backOffReductionPercent}
                              onChange={(event) => updateBackOffReductionPercent(index, event.target.value)}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="Rest top (min)" inputMode="decimal" value={topSetRestMinutes} onChange={(event) => setTopSetRestMinutes(event.target.value)} />
                          <Input label="Rest back (min)" inputMode="decimal" value={backOffRestMinutes} onChange={(event) => setBackOffRestMinutes(event.target.value)} />
                        </div>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="secondary" className="w-full" onClick={addRoutineExercise}>{editingRoutineExerciseId ? "Guardar cambios" : "Anadir ejercicio"}</Button>
                      <Button variant="ghost" className="w-full" onClick={resetExerciseForm}>{editingRoutineExerciseId ? "Cancelar" : "Limpiar"}</Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ) : null}

          <div className="space-y-3">
            {routineDetails.find((detail) => detail.day.id === selectedDayId)?.exercises.map((routineExercise, index, dayExercises) => {
              const exercise = exercises.find((item) => item.id === routineExercise.exerciseId);
              const reductionSummary = routineExercise.backOffReductionPercents?.length
                ? routineExercise.backOffReductionPercents.map((percent) => `-${percent}%`).join(" / ")
                : routineExercise.backOffReductionPercent ? `-${routineExercise.backOffReductionPercent}%` : "";
              const rirSummary = routineExercise.targetRirs?.some((rir) => typeof rir === "number")
                ? routineExercise.targetRirs.map((rir, rirIndex) => `S${rirIndex + 1}: ${typeof rir === "number" ? rir : "-"}`).join(" · ")
                : "";
              const repsSummary = routineExercise.targetRepRanges?.some((range) => typeof range.min === "number" || typeof range.max === "number")
                ? routineExercise.targetRepRanges.map((range, repsIndex) => `S${repsIndex + 1}: ${range.min ?? "-"}-${range.max ?? "-"}`).join(" · ")
                : routineExercise.targetReps?.some((reps) => typeof reps === "number")
                  ? routineExercise.targetReps.map((reps, repsIndex) => `S${repsIndex + 1}: ${typeof reps === "number" ? reps : "-"}`).join(" · ")
                  : "";
              const warmupSummary = routineExercise.warmupWeightMultipliers?.length
                ? routineExercise.warmupWeightMultipliers.map((percent, warmupIndex) => `${percent}x · ${routineExercise.warmupTargetReps?.[warmupIndex] ?? "-"} reps`).join(" / ")
                : "";
              return (
                <Card key={routineExercise.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold">{exercise?.name ?? "Ejercicio archivado"}</h4>
                      <p className="mt-1 text-xs text-muted">
                        {routineExercise.targetSets} series · {routineExercise.structureType}
                        {reductionSummary ? ` · ${reductionSummary}` : ""}
                      </p>
                      {routineExercise.plannedTopSetWeight ? <p className="mt-1 text-xs text-muted">Top estimado · {routineExercise.plannedTopSetWeight} kg</p> : null}
                      {routineExercise.unilateralBetweenSidesRestSeconds ? <p className="mt-1 text-xs text-muted">Entre lados · {routineExercise.unilateralBetweenSidesRestSeconds}s</p> : null}
                      {repsSummary ? <p className="mt-1 text-xs text-muted">Reps objetivo · {repsSummary}</p> : null}
                      {rirSummary ? <p className="mt-1 text-xs text-muted">RIR objetivo · {rirSummary}</p> : null}
                      {warmupSummary ? <p className="mt-1 text-xs text-muted">Aproximaciones · {warmupSummary}</p> : null}
                    </div>
                    <div className="grid gap-1">
                      <div className="flex gap-1">
                        <Button variant="ghost" className="min-h-0 px-2 py-1 text-sm" disabled={index === 0} aria-label="Subir ejercicio" onClick={async () => { await routineRepository.moveExercise(routineExercise.id, "up"); await refresh(selectedRoutineId); }}>↑</Button>
                        <Button variant="ghost" className="min-h-0 px-2 py-1 text-sm" disabled={index === dayExercises.length - 1} aria-label="Bajar ejercicio" onClick={async () => { await routineRepository.moveExercise(routineExercise.id, "down"); await refresh(selectedRoutineId); }}>↓</Button>
                      </div>
                      <Button variant="secondary" className="min-h-0 px-3 py-2 text-xs" onClick={() => editRoutineExercise(routineExercise)}>Editar</Button>
                      <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={async () => { await routineRepository.deleteExercise(routineExercise.id); await refresh(selectedRoutineId); }}>Quitar</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
