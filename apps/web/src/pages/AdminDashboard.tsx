import {
  Button,
  DashboardCard,
  DataTable,
  StatCard,
  StatusBadge,
  type Column,
} from "@bazoora/ui";

import {
  ecoAides,
  quickStats,
  requestQueue,
  routeStats,
  summaryStats,
  type EcoAide,
  type RequestItem,
} from "./admindashboardmockdata.data";

export function AdminDashboard() {
  const ecoAideColumns: Column<EcoAide>[] = [
    {
      key: "id",
      header: "Eco-Aide ID",
    },
    {
      key: "name",
      header: "Eco-Aide",
    },
    {
      key: "availability",
      header: "Availability",
      render: (row) => (
        <StatusBadge status={row.availability} />
      ),
    },
  ];

  const requestColumns: Column<RequestItem>[] = [
    {
      key: "id",
      header: "Request ID",
    },
    {
      key: "location",
      header: "Location",
    },
    {
      key: "wasteType",
      header: "Waste Type",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: "ecoAide",
      header: "Eco-Aide",
    },
  ];

  return (
    <div className="p-6">
      {/* Summary statistics + Quick Status share a row, roughly 2:1 width */}
      <section className="mb-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Summary statistics
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {summaryStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Quick Status
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {quickStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-bold text-gray-900">
          Overview
        </h2>

        {/* Eco-Aide Availability table + Route Status Today panel, same 2:1 split */}
        <div className="mb-5 grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <DashboardCard>
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                <span className="text-sm font-semibold">
                  Eco-Aide Availability
                </span>

                <Button variant="blackWhiteText" size="sm">
                  View All
                </Button>
              </div>

              <div className="px-5 pb-5">
                <DataTable<EcoAide>
                  columns={ecoAideColumns}
                  data={ecoAides}
                />
              </div>
            </DashboardCard>
          </div>

          <DashboardCard variant="darkGreen">
            <div className="p-3"
            >
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm font-bold text-white">
                  Route Status Today
                </span>

                <Button
                  variant="blackWhiteText"
                  size="sm"
                >
                  View All
                </Button>
              </div>

              <div className="rounded-lg bg-white px-5 py-4">
                <div className="space-y-4">
                  {routeStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3"
                    >
                      <span className="text-gray-500">▦</span>

                      <span className="text-sm text-gray-700">
                        {stat.label}:{" "}
                        <strong className="text-gray-900">{stat.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>

        <DashboardCard>
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <span className="text-sm font-semibold">
              Request Queue (On-Demand Request)
            </span>

            <Button variant="blackWhiteText" size="sm">
              View All
            </Button>
          </div>

          <div className="px-5 pb-5">
            <DataTable<RequestItem>
              columns={requestColumns}
              data={requestQueue}
            />
          </div>
        </DashboardCard>
      </section>
    </div>
  );
}
