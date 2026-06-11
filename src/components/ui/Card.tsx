import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return <section className={`rounded-[28px] border border-line bg-panel/86 p-5 shadow-2xl shadow-black/20 ${className}`}>{children}</section>;
}
