import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <select
        className={`min-h-12 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-base text-white outline-none transition focus:border-danger focus:ring-2 focus:ring-danger/30 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
