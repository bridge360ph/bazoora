import { useState } from "react";
import { StatCard } from "@bazoora/ui";
import { ChartCard } from "./components/ChartCard";
import { ChartPlaceholder } from "./components/ChartPlaceholder";

export function AdminAnalyticsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
          <h1 className="text-2xl font-extrabold text-gray-900">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View hauling performance, waste collection volume, and revenue
            reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg bg-[#1a3a2e] px-5 py-2.5 text-sm font-bold text-white"
        >
          Export Data
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Completed Pickups"
          value="32"
        />

        <StatCard
          label="Collection Volume"
          value="82,500 kg"
        />

        <StatCard
          label="Revenue"
          value="₱15,000"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Completed Pickups (7-Day)">
          <ChartPlaceholder />
        </ChartCard>

        <ChartCard title="Recyclable vs Non-Recyclable Volume">
          {/* TODO: Replace mock chart with actual chart library if approved */}
          <ChartPlaceholder />
        </ChartCard>
      </section>

      <ChartCard title="Revenue from Paid Services (7-Day)">
        {/* TODO: Replace mock chart with actual chart library if approved */}
        <ChartPlaceholder />
      </ChartCard>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1a3a2e] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}