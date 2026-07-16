import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <article className="min-w-0 rounded-xl bg-[#1a3a2e] px-5 py-[18px]">
      <h2 className="mb-4 text-sm font-bold text-white">{title}</h2>

      <div className="min-w-0 rounded-lg bg-[rgba(255,255,255,0.06)] px-2 py-4">
        {children}
      </div>
    </article>
  );
}