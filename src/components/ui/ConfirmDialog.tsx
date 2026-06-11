import { Button } from "./Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-10 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[32px] border border-line bg-panel p-5 shadow-2xl shadow-black/60" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-danger">Confirmar</p>
        <h2 id="confirm-title" className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "primary" : "secondary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
