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
    <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-gray-900">Analytics</h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            View hauling performance, waste collection volume, and revenue
            reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark sm:w-auto"
        >
          Export Data
        </button>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Completed Pickups" value="32" />
        <StatCard label="Collection Volume" value="82,500 kg" />
        <StatCard label="Revenue" value="₱15,000" />
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <ChartCard title="Completed Pickups (7-Day)">
          <div className="h-52 min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pickupsData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
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
                <YAxis
                  width={36}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
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
          </div>
        </ChartCard>

        <ChartCard title="Recyclable vs Non-Recyclable Volume">
          <div className="h-60 min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteVolumeData}
                  cx="50%"
                  cy="43%"
                  innerRadius="42%"
                  outerRadius="68%"
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
                  iconSize={9}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => (
                    <span className="text-[11px] text-white/80 sm:text-xs">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <p className="-mt-2 text-center text-xs text-white/65">
            <strong className="text-lg text-green-400">
              {recyclablePercentage}%
            </strong>{" "}
            recyclable
          </p>
        </ChartCard>
      </section>

      <ChartCard title="Revenue from Paid Services (7-Day)">
        <div className="h-56 min-w-0 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={revenueData}
              margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
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
                width={48}
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
                dot={{ fill: "#4ade80", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg bg-brand px-5 py-3 text-center text-sm font-semibold text-white shadow-lg sm:bottom-6 sm:w-auto">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
