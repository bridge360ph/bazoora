import type { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "darkGreen";
}

export function DashboardCard({
  children,
  className = "",
  variant = "default",
}: DashboardCardProps) {
  return (
    <div
      className={[
        "rounded-xl overflow-hidden shadow-sm border",
        variant === "darkGreen"
          ? "bg-[#185034] border-[#1a3a2e]"
          : "bg-white border-gray-200",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}