import type { CSSProperties, ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <article style={chartCardStyle}>
      <h2 style={chartTitleStyle}>{title}</h2>
      <div style={chartContentStyle}>{children}</div>
    </article>
  );
}

const chartCardStyle: CSSProperties = {
  background: "#1a3a2e",
  borderRadius: 12,
  padding: "18px 20px",
  minWidth: 0,
};

const chartTitleStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 14,
};

const chartContentStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 8,
  padding: "16px 8px",
  minWidth: 0,
};
