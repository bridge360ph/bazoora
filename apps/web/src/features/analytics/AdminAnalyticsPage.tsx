import { useEffect, useState } from "react";
import { StatCard } from "@bazoora/ui";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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
      <div className="p-6 text-sm text-gray-500">
        Loading analytics...
      </div>
    );
  }

  if (!overview || errorMessage) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage ?? "Analytics data is unavailable."}
        </div>
      </div>
    );
  }

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
    <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Analytics
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          View real Eco-Aide and fleet data from the database.
        </p>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Eco-Aides"
          value={overview.totals.ecoAides.toLocaleString()}
        />
        <StatCard
          label="Total Trucks"
          value={overview.totals.trucks.toLocaleString()}
        />
        <StatCard
          label="Assigned Trucks"
          value={overview.totals.assignedTrucks.toLocaleString()}
        />
      </section>

      <ChartCard title="Truck Status Distribution">
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

        <p className="-mt-2 text-center text-xs text-white/65">
          <strong className="text-lg text-green-400">
            {assignedPercentage}%
          </strong>{" "}
          of trucks are assigned
        </p>
      </ChartCard>
    </div>
  );
}
