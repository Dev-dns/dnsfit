import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "danger";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
        tone === "danger" ? "border-danger/50 bg-danger/10 text-white" : "border-line bg-panel text-muted"
      }`}
    >
      {children}
    </span>
  );
}
