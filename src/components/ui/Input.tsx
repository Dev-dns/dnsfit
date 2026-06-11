import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <input
        className={`min-h-12 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-base text-white outline-none transition placeholder:text-muted/60 focus:border-danger focus:ring-2 focus:ring-danger/30 ${className}`}
        {...props}
      />
    </label>
  );
}
