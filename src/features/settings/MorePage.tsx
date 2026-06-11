import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import type { Exercise, ExerciseCategory, ExerciseType, EquipmentType } from "../../domain/exercises/exerciseTypes";
import type { MuscleGroup, MuscleGroupId } from "../../domain/muscles/muscleTypes";
import { createId, nowIso } from "../../domain/shared/entity";
import { getBackupFilename } from "../../domain/backup/backupValidation";
import { backupRepository } from "../../db/repositories/backupRepository";
import { exerciseRepository } from "../../db/repositories/exerciseRepository";
import { workoutRepository } from "../../db/repositories/workoutRepository";

type MoreTab = "exercises" | "history" | "backup" | "settings";

type ExerciseFormState = {
  id?: string;
  name: string;
  category: ExerciseCategory;
  primaryDirectMuscle: MuscleGroupId;
  equipmentType: EquipmentType;
  exerciseType: ExerciseType;
  isUnilateral: boolean;
  notes: string;
};

const defaultExerciseForm = (muscleId: MuscleGroupId): ExerciseFormState => ({
  name: "",
  category: "strength",
  primaryDirectMuscle: muscleId,
  equipmentType: "machine",
  exerciseType: "compound",
  isUnilateral: false,
  notes: ""
});

const categories: ExerciseCategory[] = ["strength", "cardio", "mobility", "other"];
const equipmentTypes: EquipmentType[] = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "smith", "other"];
const exerciseTypes: ExerciseType[] = ["compound", "isolation", "cardio", "core", "other"];

export function MorePage() {
  const [activeTab, setActiveTab] = useState<MoreTab>("exercises");
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Array<{ workout: { id: string; name: string; startedAt: string; durationSeconds?: number }; completedSets: number; volumeKg: number }>>([]);
  const [form, setForm] = useState<ExerciseFormState | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const refresh = async () => {
    const [muscleData, exerciseData, historyData] = await Promise.all([
      exerciseRepository.listMuscles(),
      exerciseRepository.listActive(),
      workoutRepository.listHistory()
    ]);
    setMuscles(muscleData);
    setExercises(exerciseData);
    setHistory(historyData);
    if (!form && muscleData[0]) setForm(defaultExerciseForm(muscleData[0].id));
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveExercise = async () => {
    if (!form || !form.name.trim()) return;
    const existing = form.id ? await exerciseRepository.get(form.id) : undefined;
    const now = nowIso();
    await exerciseRepository.put({
      id: form.id ?? createId(),
      name: form.name.trim(),
      category: form.category,
      primaryDirectMuscle: form.primaryDirectMuscle,
      equipmentType: form.equipmentType,
      exerciseType: form.exerciseType,
      isUnilateral: form.isUnilateral,
      notes: form.notes.trim() || undefined,
      visualAsset: { type: "none" },
      isArchived: false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });
    setForm(muscles[0] ? defaultExerciseForm(muscles[0].id) : null);
    await refresh();
  };

  const editExercise = (exercise: Exercise) => {
    setActiveTab("exercises");
    setForm({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      primaryDirectMuscle: exercise.primaryDirectMuscle,
      equipmentType: exercise.equipmentType,
      exerciseType: exercise.exerciseType,
      isUnilateral: exercise.isUnilateral,
      notes: exercise.notes ?? ""
    });
  };

  const exportBackup = async () => {
    const backup = await backupRepository.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getBackupFilename();
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage("Backup exportado.");
  };

  const replaceWithBackup = async () => {
    if (!pendingImportFile) return;
    try {
      const text = await pendingImportFile.text();
      await backupRepository.replaceAll(JSON.parse(text));
      setBackupMessage("Backup importado correctamente.");
      setPendingImportFile(null);
      await refresh();
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "No se pudo importar el backup.");
    }
  };

  const clearLocalData = async () => {
    await backupRepository.clearAll();
    setIsClearConfirmOpen(false);
    setBackupMessage("Datos locales borrados. Musculos y ajustes base restaurados.");
    await refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <Badge>Mas</Badge>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Datos locales, sin cuenta.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Gestiona ejercicios, revisa historial basico y prepara los ajustes locales del MVP.
        </p>
      </Card>
      <div className="grid grid-cols-4 gap-2 rounded-3xl border border-line bg-panel p-1">
        {[
          ["exercises", "Ejercicios"],
          ["history", "Historial"],
          ["backup", "Backup"],
          ["settings", "Ajustes"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-2xl px-3 py-3 text-sm font-bold ${activeTab === id ? "bg-danger text-white" : "text-muted"}`}
            onClick={() => setActiveTab(id as MoreTab)}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === "exercises" && form ? (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <Input label="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Press banca" />
              <Select label="Musculo directo" value={form.primaryDirectMuscle} onChange={(event) => setForm({ ...form, primaryDirectMuscle: event.target.value as MuscleGroupId })}>
                {muscles.map((muscle) => (
                  <option key={muscle.id} value={muscle.id}>{muscle.name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Equipo" value={form.equipmentType} onChange={(event) => setForm({ ...form, equipmentType: event.target.value as EquipmentType })}>
                  {equipmentTypes.map((value) => <option key={value} value={value}>{value}</option>)}
                </Select>
                <Select label="Tipo" value={form.exerciseType} onChange={(event) => setForm({ ...form, exerciseType: event.target.value as ExerciseType })}>
                  {exerciseTypes.map((value) => <option key={value} value={value}>{value}</option>)}
                </Select>
              </div>
              <Select label="Categoria" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExerciseCategory })}>
                {categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-white">
                <input type="checkbox" checked={form.isUnilateral} onChange={(event) => setForm({ ...form, isUnilateral: event.target.checked })} />
                Unilateral
              </label>
              <Input label="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Setup breve" />
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={saveExercise}>{form.id ? "Guardar" : "Crear"}</Button>
                <Button variant="secondary" onClick={() => setForm(muscles[0] ? defaultExerciseForm(muscles[0].id) : null)}>Limpiar</Button>
              </div>
            </div>
          </Card>
          <div className="space-y-2">
            {exercises.map((exercise) => {
              const muscle = muscles.find((item) => item.id === exercise.primaryDirectMuscle);
              return (
                <Card key={exercise.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">{exercise.name}</h3>
                      <p className="mt-1 text-xs text-muted">{muscle?.name ?? "Sin musculo"} · {exercise.equipmentType}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="min-h-0 px-3 py-2 text-xs" onClick={() => editExercise(exercise)}>Editar</Button>
                      <Button variant="ghost" className="min-h-0 px-3 py-2 text-xs" onClick={async () => { await exerciseRepository.archive(exercise.id); await refresh(); }}>Archivar</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
      {activeTab === "history" ? (
        <div className="space-y-3">
          {history.length === 0 ? <EmptyState title="Sin historial" description="Finaliza un entreno para verlo aqui." /> : null}
          {history.map(({ workout, completedSets, volumeKg }) => (
            <Card key={workout.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold">{workout.name}</h3>
                  <p className="mt-1 text-xs text-muted">{new Date(workout.startedAt).toLocaleString()}</p>
                </div>
                <Badge tone="danger">{completedSets} sets</Badge>
              </div>
              <p className="mt-3 font-mono text-sm text-muted">{Math.round(volumeKg)} kg volumen</p>
            </Card>
          ))}
        </div>
      ) : null}
      {activeTab === "backup" ? (
        <div className="space-y-4">
          <Card>
            <Badge tone="danger">Backup</Badge>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">Tus datos son locales.</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Exporta un JSON para mover o proteger tus datos. Importar usa modo reemplazar todo, tal como define el MVP.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button onClick={exportBackup}>Exportar JSON</Button>
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-line bg-panel px-4 py-3 text-sm font-bold text-white">
                Importar JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    setPendingImportFile(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {backupMessage ? <p className="mt-4 rounded-2xl border border-line bg-ink p-3 text-sm text-muted">{backupMessage}</p> : null}
          </Card>
          <Card className="border-danger/40">
            <h3 className="text-xl font-black tracking-[-0.04em] text-white">Zona peligrosa</h3>
            <p className="mt-3 text-sm leading-6 text-muted">Borra ejercicios, rutinas, entrenos y series del dispositivo. Conserva solo musculos y ajustes base.</p>
            <Button className="mt-4 w-full" onClick={() => setIsClearConfirmOpen(true)}>Borrar datos locales</Button>
          </Card>
        </div>
      ) : null}
      {activeTab === "settings" ? (
        <div className="space-y-4">
          <Card>
            <h3 className="text-xl font-black tracking-[-0.04em]">Privacidad local</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              dnsfit guarda tus datos localmente en este dispositivo. No se suben a ningun servidor. Si borras los datos del navegador o cambias de dispositivo, puedes perder la informacion salvo que hayas exportado un backup.
            </p>
          </Card>
          <Card>
            <Badge>iPhone</Badge>
            <h3 className="mt-4 text-xl font-black tracking-[-0.04em]">Instalar en pantalla de inicio</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
              <li>Abre dnsfit desde Safari.</li>
              <li>Pulsa el boton de compartir.</li>
              <li>Selecciona Anadir a pantalla de inicio.</li>
              <li>Abre dnsfit desde el icono creado.</li>
            </ol>
          </Card>
        </div>
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(pendingImportFile)}
        title="Reemplazar datos locales"
        description="Importar este backup borrara los datos actuales de este dispositivo y escribira los del archivo seleccionado."
        confirmLabel="Importar"
        onCancel={() => setPendingImportFile(null)}
        onConfirm={replaceWithBackup}
      />
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Borrar datos locales"
        description="Esta accion elimina ejercicios, rutinas, entrenos y series. Exporta un backup antes si quieres conservarlos."
        confirmLabel="Borrar"
        onCancel={() => setIsClearConfirmOpen(false)}
        onConfirm={clearLocalData}
      />
    </div>
  );
}
