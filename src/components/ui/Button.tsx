import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variantClass = {
    primary: "border-danger bg-danger text-white shadow-[0_0_28px_rgba(229,9,20,0.24)]",
    secondary: "border-line bg-panel text-white",
    ghost: "border-transparent bg-transparent text-muted"
  }[variant];

  return (
    <button
      className={`min-h-12 rounded-2xl border px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      type="button"
      {...props}
    />
  );
}
