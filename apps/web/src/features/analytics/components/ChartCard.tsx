import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** A white panel with a small heading, holding one chart. */
export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 pb-3 pt-4">
        <h2 className="break-words text-sm font-bold text-gray-800">{title}</h2>
        {description && <p className="mt-0.5 text-[11px] text-gray-500">{description}</p>}
      </div>

      <div className="min-w-0 overflow-hidden px-3 py-4">{children}</div>
    </article>
  );
}
