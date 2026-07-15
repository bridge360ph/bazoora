import { useState } from "react";
import { StatCard } from "@bazoora/ui";
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
import {
  pickupsData,
  revenueData,
  wasteVolumeData,
} from "./analytics.data";
import { ChartCard } from "./components/ChartCard";

const axisTick = {
  fill: "rgba(255,255,255,0.72)",
  fontSize: 12,
};

const tooltipContentStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
};

function normalizeChartValue(value: unknown): number {
  const normalizedValue: unknown = Array.isArray(value)
    ? (value as unknown[])[0]
    : value;

  const parsedValue = Number(normalizedValue ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function AdminAnalyticsPage() {
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
    <div className="space-y-6 p-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Analytics</h1>

          <p className="mt-1 text-sm text-gray-500">
            View hauling performance, waste collection volume, and revenue
            reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg bg-[#1a3a2e] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Export Data
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Completed Pickups" value="32" />
        <StatCard label="Collection Volume" value="82,500 kg" />
        <StatCard label="Revenue" value="₱15,000" />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Completed Pickups (7-Day)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={pickupsData}
              margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.12)"
              />
              <XAxis
                dataKey="day"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [
                  normalizeChartValue(value).toLocaleString(),
                  "Pickups",
                ]}
                contentStyle={tooltipContentStyle}
              />
              <Bar
                dataKey="pickups"
                fill="#4ade80"
                radius={[5, 5, 0, 0]}
              />
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
                formatter={(value) => [
                  `${normalizeChartValue(value).toLocaleString()} kg`,
                  "Volume",
                ]}
                contentStyle={tooltipContentStyle}
              />

              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span className="text-xs text-white/80">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <p className="-mt-2 text-center text-xs text-white/65">
            <strong className="text-lg text-green-400">
              {recyclablePercentage}%
            </strong>{" "}
            recyclable
          </p>
        </ChartCard>
      </section>

      <ChartCard title="Revenue from Paid Services (7-Day)">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={revenueData}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="revenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
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
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                `₱${(Number(value) / 1000).toFixed(1)}k`
              }
            />
            <Tooltip
              formatter={(value) => [
                `₱${normalizeChartValue(value).toLocaleString()}`,
                "Revenue",
              ]}
              contentStyle={tooltipContentStyle}
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

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1a3a2e] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}