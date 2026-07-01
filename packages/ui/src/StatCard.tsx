import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  helperText?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  helperText,
  className,
}: StatCardProps) {
  return (
    <article
      className={[
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold leading-none text-gray-900">
            {value}
          </p>
        </div>

        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            {icon}
          </div>
        ) : null}
      </div>

      {helperText ? (
        <p className="mt-3 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </article>
  );
}