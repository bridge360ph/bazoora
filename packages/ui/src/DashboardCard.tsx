import type { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
}

export function DashboardCard({
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}