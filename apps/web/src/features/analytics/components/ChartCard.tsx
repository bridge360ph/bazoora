import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl bg-brand p-4 sm:px-5 sm:py-[18px]">
      <h2 className="mb-3 break-words text-sm font-bold text-white sm:mb-4">
        {title}
      </h2>

      <div className="min-w-0 overflow-hidden rounded-lg bg-white/10 p-2 sm:px-3 sm:py-4">
        {children}
      </div>
    </article>
  );
}
