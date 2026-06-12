import { Button } from "./Button";
import { Card } from "./Card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <div className="flex min-h-40 flex-col justify-between gap-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-danger">Pendiente</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        </div>
        {actionLabel ? <Button variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </Card>
  );
}
