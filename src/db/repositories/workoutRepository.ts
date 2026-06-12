import { createId, nowIso } from "../../domain/shared/entity";
import { getRestSecondsBetweenExercises, getRestSecondsForSet } from "../../domain/restTimer/restTimerRules";
import type { Workout, WorkoutExercise, WorkoutSet, WorkoutSetType } from "../../domain/workouts/workoutTypes";
import { calculateBackOffWeight } from "../../domain/workouts/backOff";
import { calculateWarmupWeight } from "../../domain/workouts/warmups";
import { calculateKgVolume, isEffectiveSet } from "../../domain/volume/volumeCalculations";
import { db } from "../db";

const getSetTypes = (structureType: "normal" | "top_set_back_off", targetSets: number, topSets = 1, backOffSets = 0): WorkoutSetType[] => {
  if (structureType === "normal") {
    return Array.from({ length: Math.max(targetSets, 1) }, () => "normal");
  }

  return [
    ...Array.from({ length: Math.max(topSets, 0) }, () => "top_set" as const),
    ...Array.from({ length: Math.max(backOffSets, 0) }, () => "back_off" as const)
  ];
};

const getBackOffReductionPercent = (reductionPercents: number[] | undefined, fallbackPercent: number | undefined, backOffIndex: number) => {
  const indexedPercent = reductionPercents?.[backOffIndex];
  return indexedPercent ?? fallbackPercent ?? 10;
};

const getPlannedSetTypes = (routineExercise: { structureType: "normal" | "top_set_back_off"; targetSets: number; topSets?: number; backOffSets?: number; warmupWeightMultipliers?: number[] }) => [
  ...Array.from({ length: routineExercise.warmupWeightMultipliers?.length ?? 0 }, () => "warmup" as const),
  ...getSetTypes(routineExercise.structureType, routineExercise.targetSets, routineExercise.topSets, routineExercise.backOffSets)
];

const findPreviousSet = async (exerciseId: string, routineDayId: string | undefined, setOrder: number, setType: WorkoutSetType) => {
  const completedWorkouts = await db.workouts.where("status").equals("completed").reverse().sortBy("startedAt");
  const sameDayWorkout = completedWorkouts.find((workout) => workout.routineDayId && workout.routineDayId === routineDayId);
  const sourceWorkouts = [...(sameDayWorkout ? [sameDayWorkout] : []), ...completedWorkouts.filter((workout) => workout.id !== sameDayWorkout?.id)];

  for (const workout of sourceWorkouts) {
    const sets = (await db.workoutSets.where("workoutId").equals(workout.id).toArray())
      .filter((set) => set.exerciseId === exerciseId && set.isCompleted)
      .sort((a, b) => a.order - b.order);

    const exact = sets.find((set) => set.order === setOrder && set.setType === setType);
    const sameOrder = sets.find((set) => set.order === setOrder);
    const sameType = sets.find((set) => set.setType === setType);
    const fallback = sets[setOrder - 1] ?? sets[0];
    const reference = exact ?? sameOrder ?? sameType ?? fallback;
    if (reference) return { set: reference, workout };
  }

  return undefined;
};

export const workoutRepository = {
  getActive: () => db.workouts.where("status").equals("active").first(),
  putWorkout: (workout: Workout) => db.workouts.put({ ...workout, updatedAt: nowIso() }),
  putWorkoutExercise: (workoutExercise: WorkoutExercise) => db.workoutExercises.put({ ...workoutExercise, updatedAt: nowIso() }),
  putSet: (set: WorkoutSet) => db.workoutSets.put({ ...set, updatedAt: nowIso() }),
  listCompleted: () => db.workouts.where("status").equals("completed").reverse().sortBy("startedAt"),
  getActiveBundle: async () => {
    const workout = await db.workouts.where("status").equals("active").first();
    if (!workout) return null;

    const workoutExercises = await db.workoutExercises.where("workoutId").equals(workout.id).sortBy("order");
    const sets = await db.workoutSets.where("workoutId").equals(workout.id).sortBy("order");
    const exercises = await db.exercises.bulkGet(workoutExercises.map((entry) => entry.exerciseId));
    const routineExercises = await db.routineExercises.bulkGet(workoutExercises.map((entry) => entry.routineExerciseId ?? ""));
    const restTimer = await db.restTimers.where("workoutId").equals(workout.id).first();

    return { workout, workoutExercises, sets, exercises, routineExercises, restTimer };
  },
  startFromRoutineDay: async (routineDayId: string) => {
    const active = await db.workouts.where("status").equals("active").first();
    if (active) return active.id;

    const day = await db.routineDays.get(routineDayId);
    if (!day) throw new Error("No se encontro el dia de rutina.");

    const routine = await db.routines.get(day.routineId);
    const routineExercises = await db.routineExercises.where("routineDayId").equals(routineDayId).sortBy("order");
    if (routineExercises.length === 0) throw new Error("Anade ejercicios antes de iniciar el entreno.");

    const now = nowIso();
    const workoutId = createId();
    const workout: Workout = {
      id: workoutId,
      routineId: day.routineId,
      routineDayId,
      name: routine ? `${routine.name} - ${day.name}` : day.name,
      startedAt: now,
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    await db.transaction("rw", db.workouts, db.workoutExercises, db.workoutSets, async () => {
      await db.workouts.add(workout);

      for (const [exerciseIndex, routineExercise] of routineExercises.entries()) {
        const workoutExerciseId = createId();
        const workoutExercise: WorkoutExercise = {
          id: workoutExerciseId,
          workoutId,
          exerciseId: routineExercise.exerciseId,
          routineExerciseId: routineExercise.id,
          order: exerciseIndex + 1,
          createdAt: now,
          updatedAt: now
        };
        await db.workoutExercises.add(workoutExercise);

        const setTypes = getPlannedSetTypes(routineExercise);

        let workingSetIndex = 0;
        for (const [setIndex, setType] of setTypes.entries()) {
          const isWorkingSet = setType !== "warmup";
          const previous = await findPreviousSet(routineExercise.exerciseId, routineDayId, setIndex + 1, setType);
          await db.workoutSets.add({
            id: createId(),
            workoutId,
            workoutExerciseId,
            exerciseId: routineExercise.exerciseId,
            order: setIndex + 1,
            setType,
            targetRir: isWorkingSet ? routineExercise.targetRirs?.[workingSetIndex] : undefined,
            isCompleted: false,
            suggestedWeightMultiplier: setType === "warmup" ? routineExercise.warmupWeightMultipliers?.[setIndex] : undefined,
            previousWeight: previous?.set.weight,
            previousReps: previous?.set.reps,
            previousRir: previous?.set.rir,
            previousWorkoutDate: previous?.workout.startedAt,
            createdAt: now,
            updatedAt: now
          });
          if (isWorkingSet) workingSetIndex += 1;
        }
      }
    });

    return workoutId;
  },
  updateSet: async (setId: string, patch: Partial<WorkoutSet>) => {
    const current = await db.workoutSets.get(setId);
    if (!current) return;

    const next = { ...current, ...patch };
    const isCompleted = typeof next.weight === "number" && next.weight >= 0 && typeof next.reps === "number" && next.reps > 0;
    const completedAt = isCompleted ? (current.completedAt ?? nowIso()) : undefined;
    await db.transaction("rw", [db.workoutSets, db.workoutExercises, db.routineExercises, db.settings, db.restTimers], async () => {
      await db.workoutSets.update(setId, {
        ...patch,
        isCompleted,
        completedAt,
        updatedAt: nowIso()
      });

      if ((current.setType === "top_set" || current.setType === "normal") && typeof next.weight === "number") {
        const workoutExercise = await db.workoutExercises.get(current.workoutExerciseId);
        const routineExercise = workoutExercise?.routineExerciseId ? await db.routineExercises.get(workoutExercise.routineExerciseId) : undefined;
        const workoutSets = await db.workoutSets.where("workoutExerciseId").equals(current.workoutExerciseId).sortBy("order");
        const firstWorkingSet = workoutSets.find((set) => set.setType !== "warmup");
        const shouldSuggestFromCurrent = firstWorkingSet?.id === current.id;
        if (routineExercise) {
          if (shouldSuggestFromCurrent) {
            const warmupSets = workoutSets.filter((set) => set.setType === "warmup");
            for (const [warmupIndex, warmupSet] of warmupSets.entries()) {
              const multiplier = routineExercise.warmupWeightMultipliers?.[warmupIndex] ?? warmupSet.suggestedWeightMultiplier;
              if (!multiplier) continue;
              const suggestedWeight = calculateWarmupWeight(next.weight, multiplier);
              const shouldUpdateWeight = warmupSet.weight === undefined || warmupSet.weight === warmupSet.suggestedWeight;
              await db.workoutSets.update(warmupSet.id, {
                suggestedWeight,
                weight: shouldUpdateWeight ? suggestedWeight : warmupSet.weight,
                updatedAt: nowIso()
              });
            }
          }

          const backOffSets = workoutSets.filter((set) => set.setType === "back_off");

          for (const [backOffIndex, backOffSet] of backOffSets.sort((a, b) => a.order - b.order).entries()) {
            const reductionPercent = getBackOffReductionPercent(routineExercise.backOffReductionPercents, routineExercise.backOffReductionPercent, backOffIndex);
            const suggestedWeight = calculateBackOffWeight(next.weight, reductionPercent);
            const shouldUpdateWeight = backOffSet.weight === undefined || backOffSet.weight === backOffSet.suggestedWeight;
            await db.workoutSets.update(backOffSet.id, {
              suggestedWeight,
              weight: shouldUpdateWeight ? suggestedWeight : backOffSet.weight,
              updatedAt: nowIso()
            });
          }
        }
      }

      if (isCompleted && !current.isCompleted) {
        const workoutExercise = await db.workoutExercises.get(current.workoutExerciseId);
        const routineExercise = workoutExercise?.routineExerciseId ? await db.routineExercises.get(workoutExercise.routineExerciseId) : undefined;
        const settings = await db.settings.get("global");
        const durationSeconds = getRestSecondsForSet(next, routineExercise, settings);
        const now = nowIso();
        await db.restTimers.put({
          id: current.workoutId,
          workoutId: current.workoutId,
          durationSeconds,
          startedAt: now,
          status: "running",
          createdAt: now,
          updatedAt: now
        });
      }
    });
  },
  startRestTimerForSet: async (setId: string) => {
    const set = await db.workoutSets.get(setId);
    if (!set) return;

    const workoutExercise = await db.workoutExercises.get(set.workoutExerciseId);
    const routineExercise = workoutExercise?.routineExerciseId ? await db.routineExercises.get(workoutExercise.routineExerciseId) : undefined;
    const settings = await db.settings.get("global");
    const durationSeconds = getRestSecondsForSet(set, routineExercise, settings);
    const now = nowIso();
    await db.restTimers.put({
      id: set.workoutId,
      workoutId: set.workoutId,
      durationSeconds,
      startedAt: now,
      status: "running",
      createdAt: now,
      updatedAt: now
    });
  },
  startRestTimerForExercise: async (workoutExerciseId: string) => {
    const workoutExercise = await db.workoutExercises.get(workoutExerciseId);
    if (!workoutExercise) return;

    const routineExercise = workoutExercise.routineExerciseId ? await db.routineExercises.get(workoutExercise.routineExerciseId) : undefined;
    const settings = await db.settings.get("global");
    const durationSeconds = getRestSecondsBetweenExercises(routineExercise, settings);
    const now = nowIso();
    await db.restTimers.put({
      id: workoutExercise.workoutId,
      workoutId: workoutExercise.workoutId,
      durationSeconds,
      startedAt: now,
      status: "running",
      createdAt: now,
      updatedAt: now
    });
  },
  pauseRestTimer: async (workoutId: string, remainingSeconds: number) => {
    await db.restTimers.update(workoutId, { status: "paused", pausedAt: nowIso(), remainingSeconds, updatedAt: nowIso() });
  },
  resumeRestTimer: async (workoutId: string, remainingSeconds: number) => {
    await db.restTimers.update(workoutId, { status: "running", startedAt: nowIso(), pausedAt: undefined, remainingSeconds, durationSeconds: remainingSeconds, updatedAt: nowIso() });
  },
  resetRestTimer: async (workoutId: string) => {
    const timer = await db.restTimers.get(workoutId);
    if (!timer) return;
    await db.restTimers.update(workoutId, { status: "running", startedAt: nowIso(), remainingSeconds: undefined, updatedAt: nowIso() });
  },
  skipRestTimer: async (workoutId: string) => {
    await db.restTimers.update(workoutId, { status: "idle", remainingSeconds: 0, updatedAt: nowIso() });
  },
  finishActive: async () => {
    const workout = await db.workouts.where("status").equals("active").first();
    if (!workout) return;

    const endedAt = nowIso();
    const durationSeconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(workout.startedAt).getTime()) / 1000));
    await db.workouts.update(workout.id, { status: "completed", endedAt, durationSeconds, updatedAt: endedAt });
  },
  cancelActive: async () => {
    const workout = await db.workouts.where("status").equals("active").first();
    if (!workout) return;
    await db.workouts.update(workout.id, { status: "cancelled", updatedAt: nowIso() });
  },
  listHistory: async () => {
    const workouts = await db.workouts.where("status").equals("completed").reverse().sortBy("startedAt");
    const sets = (await db.workoutSets.toArray()).filter(isEffectiveSet);
    return workouts.map((workout) => ({
      workout,
      completedSets: sets.filter((set) => set.workoutId === workout.id).length,
      volumeKg: calculateKgVolume(sets.filter((set) => set.workoutId === workout.id))
    }));
  }
};
