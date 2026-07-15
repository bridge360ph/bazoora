import { Button, StatCard, StatusBadge } from "@bazoora/ui";

type EcoAideAvailability = "Available" | "On Route" | "Off Duty";
type RequestStatus = "Pending" | "Assigned" | "Completed";

interface EcoAide {
  id: string;
  name: string;
  availability: EcoAideAvailability;
}

interface RequestItem {
  id: string;
  location: string;
  wasteType: string;
  status: RequestStatus;
  ecoAide: string;
}

const ecoAides: EcoAide[] = [
  { id: "EA-001", name: "John Mendoza", availability: "Available" },
  { id: "EA-002", name: "Emil Perez", availability: "On Route" },
  { id: "EA-003", name: "Ferdinand Ramos", availability: "Available" },
  { id: "EA-004", name: "Mark Santiago", availability: "Off Duty" },
  { id: "EA-005", name: "Romy Rosario", availability: "On Route" },
];

const requestQueue: RequestItem[] = [
  {
    id: "Req-001",
    location: "San Juan",
    wasteType: "Recyclable",
    status: "Pending",
    ecoAide: "-",
  },
  {
    id: "Req-002",
    location: "San Pedro",
    wasteType: "Regular/Non-Recyclable",
    status: "Pending",
    ecoAide: "John Mendoza",
  },
  {
    id: "Req-003",
    location: "San Mateo",
    wasteType: "Regular/Non-Recyclable",
    status: "Pending",
    ecoAide: "Emil Flores",
  },
  {
    id: "Req-004",
    location: "Poblacion",
    wasteType: "Recyclable",
    status: "Pending",
    ecoAide: "-",
  },
];

const summaryStats = [
  { label: "Total Eco-Aides", value: "200" },
  { label: "Completed Pickups", value: "32" },
  { label: "Pending Requests", value: "12" },
  { label: "Revenue (Paid Services)", value: "200" },
];

const quickStats = [
  { label: "Active Pickups", value: "8" },
  { label: "Unassigned Requests", value: "5" },
];

const routeStats = [
  { label: "In Progress", value: 3 },
  { label: "Not Started", value: 4 },
  { label: "Completed Today", value: 10 },
  { label: "Total Routes", value: 17 },
];

const tableHeadClass =
  "px-3.5 py-2.5 text-left text-xs font-semibold text-white";
const tableCellClass = "px-3.5 py-2.5 text-[13px] text-gray-700";

export function EcoAideDashboard() {
  return (
    <div className="p-6">
      <section className="mb-6">
        <h1 className="mb-1 text-2xl font-extrabold text-neutral-950">
          Dashboard
        </h1>
        <p className="mb-5 text-sm text-gray-500">
          Overview of hauling operations and Eco-Aide activity.
        </p>

        <h2 className="mb-3.5 text-base font-bold text-neutral-950">
          Summary statistics
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {summaryStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <div>
          <h2 className="mb-3.5 text-base font-bold text-neutral-950">
            Quick Status
          </h2>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {quickStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>

        <div className="xl:pt-[42px]">
          <div className="flex flex-col rounded-[10px] bg-brand px-5 py-[18px] text-white">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <span className="text-sm font-bold">Route Status Today</span>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            {routeStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 border-b border-white/10 py-1.5 last:border-b-0"
              >
                <span aria-hidden="true">▦</span>
                <span className="text-[13px] text-white/85">
                  {stat.label}: <strong>{stat.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3.5 text-base font-bold text-neutral-950">
          Overview
        </h2>

        <div className="mb-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
          <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-[18px] py-3.5">
              <span className="text-sm font-semibold">
                Eco-Aide Availability
              </span>
              <Button size="sm">View All</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="bg-brand">
                    {["Eco-Aide ID", "Eco-Aide", "Availability"].map(
                      (heading) => (
                        <th key={heading} className={tableHeadClass}>
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {ecoAides.map((ecoAide, index) => (
                    <tr
                      key={ecoAide.id}
                      className={[
                        "border-b border-gray-100",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50",
                      ].join(" ")}
                    >
                      <td className={tableCellClass}>{ecoAide.id}</td>
                      <td className={tableCellClass}>{ecoAide.name}</td>
                      <td className="px-3.5 py-2.5">
                        <StatusBadge status={ecoAide.availability} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex min-h-64 items-center justify-center rounded-[10px] border border-gray-200 bg-white shadow-sm">
            <div className="text-center text-gray-400">
              <div className="text-2xl" aria-hidden="true">
                ▥
              </div>
              <p className="mt-2 text-[13px]">Analytics chart coming soon</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-[18px] py-3.5">
            <span className="text-sm font-semibold">
              Request Queue (On-Demand Request)
            </span>
            <Button size="sm">View All</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-brand">
                  {[
                    "Request ID",
                    "Location",
                    "Waste Type",
                    "Status",
                    "Eco-Aide",
                  ].map((heading) => (
                    <th key={heading} className={tableHeadClass}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {requestQueue.map((request, index) => (
                  <tr
                    key={request.id}
                    className={[
                      "border-b border-gray-100",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50",
                    ].join(" ")}
                  >
                    <td className={tableCellClass}>{request.id}</td>
                    <td className={tableCellClass}>{request.location}</td>
                    <td className={tableCellClass}>{request.wasteType}</td>
                    <td className="px-3.5 py-2.5">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className={tableCellClass}>{request.ecoAide}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
