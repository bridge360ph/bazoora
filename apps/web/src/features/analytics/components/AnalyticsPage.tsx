import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@bazoora/ui";
import {
  pickupsData,
  revenueData,
  wasteVolumeData,
} from "../analytics.data";

export function AnalyticsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalRecyclable = wasteVolumeData[0]?.value ?? 0;
  const totalNonRecyclable = wasteVolumeData[1]?.value ?? 0;
  const totalVolume = totalRecyclable + totalNonRecyclable;
  const recyclablePercentage =
    totalVolume > 0 ? Math.round((totalRecyclable / totalVolume) * 100) : 0;

  function handleExport() {
    setToastMessage("Data exported successfully.");

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }

  return (
    <main style={pageStyle}>
      <section style={topBarStyle}>
        <div>
          <h1 style={pageTitleStyle}>Analytics</h1>
          <p style={pageSubtitleStyle}>
            View hauling performance, waste collection volume, and revenue
            reports.
          </p>
        </div>

        <button type="button" onClick={handleExport} style={exportButtonStyle}>
          Export Data
        </button>
      </section>

      <section style={statsGridStyle}>
        <StatCard label="Completed Pickups" value="32" />
        <StatCard label="Collection Volume" value="82,500 kg" />
        <StatCard label="Revenue" value="₱15,000" />
      </section>

      <section style={chartGridStyle}>
        <ChartCard title="Completed Pickups (7-Day)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pickupsData} margin={chartMargin}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.12)"
              />
              <XAxis
                dataKey="day"
                tick={axisTickStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: ValueType | undefined) => [
                  Number(value ?? 0).toLocaleString(),
                  "Pickups",
                ]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="pickups" fill="#4ade80" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recyclable vs Non-Recyclable Volume">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={wasteVolumeData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {wasteVolumeData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: ValueType | undefined) => [
                  `${Number(value ?? 0).toLocaleString()} kg`,
                  "Volume",
                ]}
                contentStyle={tooltipStyle}
              />

              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value: string | number) => (
                  <span style={legendTextStyle}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <p style={pieSummaryStyle}>
            <strong style={pieSummaryNumberStyle}>
              {recyclablePercentage}%
            </strong>{" "}
            recyclable
          </p>
        </ChartCard>
      </section>

      <ChartCard title="Revenue from Paid Services (7-Day)">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData} margin={revenueChartMargin}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.12)"
            />
            <XAxis
              dataKey="day"
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                `₱${(Number(value) / 1000).toFixed(1)}k`
              }
            />
            <Tooltip
              formatter={(value: ValueType | undefined) => [
                `₱${Number(value ?? 0).toLocaleString()}`,
                "Revenue",
              ]}
              contentStyle={tooltipStyle}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4ade80"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={{ fill: "#4ade80", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {toastMessage && <div style={toastStyle}>{toastMessage}</div>}
    </main>
  );
}

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <article style={chartCardStyle}>
      <h2 style={chartTitleStyle}>{title}</h2>
      <div style={chartContentStyle}>{children}</div>
    </article>
  );
}

const pageStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "24px",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
  flexWrap: "wrap",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#111827",
};

const pageSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  color: "#6b7280",
};

const exportButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 9,
  background: "#1a3a2e",
  color: "#ffffff",
  padding: "10px 20px",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 22,
};

const chartGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
  marginBottom: 18,
};

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

const axisTickStyle = {
  fill: "rgba(255,255,255,0.72)",
  fontSize: 12,
};

const tooltipStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
};

const legendTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.82)",
  fontSize: 12,
};

const pieSummaryStyle: CSSProperties = {
  margin: "-8px 0 0",
  textAlign: "center",
  color: "rgba(255,255,255,0.65)",
  fontSize: 12,
};

const pieSummaryNumberStyle: CSSProperties = {
  color: "#4ade80",
  fontSize: 18,
};

const toastStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#1a3a2e",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 600,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  zIndex: 2000,
  whiteSpace: "nowrap",
};

const chartMargin = {
  top: 4,
  right: 10,
  left: -10,
  bottom: 0,
};

const revenueChartMargin = {
  top: 4,
  right: 16,
  left: 0,
  bottom: 0,
};