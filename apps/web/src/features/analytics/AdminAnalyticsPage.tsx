import { useEffect, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminNotice, AdminStat } from "@/components/admin/AdminControls";
import {
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
  getAnalyticsOverview,
  type AnalyticsOverview,
} from "./api";
import { ChartCard } from "./components/ChartCard";

const tooltipContentStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
};

const statusColors: Record<string, string> = {
  Active: "#4ade80",
  Idle: "#94a3b8",
  "Under Maintenance": "#f59e0b",
};

function normalizeChartValue(value: unknown): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(normalizedValue ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function AdminAnalyticsPage() {
  const [overview, setOverview] =
    useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        const data = await getAnalyticsOverview();

        if (isMounted) {
          setOverview(data);
          setErrorMessage(null);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Unable to load analytics data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <AdminPage>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-gray-100 bg-white" />
          ))}
        </section>
        <div className="h-80 animate-pulse rounded-xl border border-gray-100 bg-white" />
      </AdminPage>
    );
  }

  if (!overview || errorMessage) {
    return (
      <AdminPage>
        <AdminNotice tone="error">{errorMessage ?? "Analytics data is unavailable."}</AdminNotice>
      </AdminPage>
    );
  }

  const ecoAideStatusData = overview.ecoAideStatus;

  const ecoAideAvailabilityData = overview.ecoAideAvailability;

  const truckStatusData = overview.truckStatus.map((entry) => ({
    ...entry,
    color: statusColors[entry.name] ?? "#64748b",
  }));

  const assignedPercentage =
    overview.totals.trucks > 0
      ? Math.round(
          (overview.totals.assignedTrucks /
            overview.totals.trucks) *
            100,
        )
      : 0;

  return (
    <AdminPage>
      <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStat label="Total Eco-Aides" value={overview.totals.ecoAides.toLocaleString()} />
        <AdminStat label="Total Trucks" value={overview.totals.trucks.toLocaleString()} />
        <AdminStat
          label="Assigned Trucks"
          value={overview.totals.assignedTrucks.toLocaleString()}
          hint={`${assignedPercentage}% of trucks`}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Eco-Aide Status">
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ecoAideStatusData}
                margin={{ top: 15, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  formatter={(value) => [
                    normalizeChartValue(value).toLocaleString(),
                    "Eco-Aides",
                  ]}
                  contentStyle={tooltipContentStyle}
                />

                <Bar
                  dataKey="value"
                  name="Eco-Aides"
                  fill="#22c55e"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Eco-Aide Availability">
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ecoAideAvailabilityData}
                margin={{ top: 15, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  formatter={(value) => [
                    normalizeChartValue(value).toLocaleString(),
                    "Eco-Aides",
                  ]}
                  contentStyle={tooltipContentStyle}
                />

                <Bar
                  dataKey="value"
                  name="Eco-Aides"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Truck Status Distribution">
        {overview.totals.trucks === 0 ? (
          <div className="flex h-64 items-center justify-center text-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                No truck data available yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Register a truck in Fleet Management to populate this chart.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={truckStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius="42%"
                    outerRadius="70%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {truckStatusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      normalizeChartValue(value).toLocaleString(),
                      "Trucks",
                    ]}
                    contentStyle={tooltipContentStyle}
                  />

                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <p className="-mt-2 text-center text-xs text-gray-500">
              <strong className="text-lg text-brand-secondary">
                {assignedPercentage}%
              </strong>{" "}
              of trucks are assigned
            </p>
          </>
        )}
      </ChartCard>
    </AdminPage>
  );
}
