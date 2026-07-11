import { useState } from "react";
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
  { id: "Req-001", location: "San Juan", wasteType: "Recyclable", status: "Pending", ecoAide: "-" },
  { id: "Req-002", location: "San Pedro", wasteType: "Regular/Non-Recyclable", status: "Pending", ecoAide: "John Mendoza" },
  { id: "Req-003", location: "San Mateo", wasteType: "Regular/Non-Recyclable", status: "Pending", ecoAide: "Emil Flores" },
  { id: "Req-004", location: "Poblacion", wasteType: "Recyclable", status: "Pending", ecoAide: "-" },
];

const navItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "Eco-Aide Management", icon: "◉" },
  { label: "Fleet Management", icon: "▣" },
  { label: "Route Management", icon: "◇" },
  { label: "Hauling Request Management", icon: "▤" },
  { label: "Analytics", icon: "▥" },
  { label: "Notifications", icon: "●" },
  { label: "Settings and System Configuration", icon: "⚙" },
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

const tableHeadClass = "px-3.5 py-2.5 text-left text-xs font-semibold text-white";
const tableCellClass = "px-3.5 py-2.5 text-[13px] text-gray-700";

export function EcoAideDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 font-sans text-neutral-900">
      <aside className="flex w-[190px] shrink-0 flex-col bg-brand">
        <div className="border-b border-white/10 px-4 pb-4 pt-5">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl" aria-hidden="true">▣</span>
            <div>
              <div className="text-[15px] font-extrabold leading-none tracking-[1px]">BAZOORA</div>
              <div className="mt-1 text-[9px] uppercase tracking-[1.5px] text-white/55">Hauling Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-2.5">
          {navItems.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveNav(item.label)}
                className={[
                  "flex w-full items-center gap-2.5 border-l-[3px] px-4 py-2.5 text-left text-[12.5px] transition-colors",
                  isActive
                    ? "border-green-400 bg-white/10 font-semibold text-white"
                    : "border-transparent font-normal text-white/60 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <span className="w-[18px] shrink-0" aria-hidden="true">{item.icon}</span>
                <span className="leading-[1.3]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 border-t border-white/10 px-3.5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-400 text-[13px] font-bold text-brand">JD</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold text-white">John Doe</div>
            <div className="text-[10.5px] text-white/45">Unit #4029</div>
          </div>
          <Button variant="ghost" size="sm" className="p-0.5 text-white/50">⚙</Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="p-0 text-lg">≡</Button>
            <span className="text-[15px] font-semibold">{activeNav}</span>
          </div>
          <div className="flex items-center gap-3.5">
            <Button variant="ghost" size="sm" className="relative p-0 text-base" aria-label="Notifications">
              ●
              <span className="absolute -right-[3px] -top-[3px] h-2 w-2 rounded-full border-[1.5px] border-white bg-red-500" />
            </Button>
            <div className="h-8 w-8 rounded-full border-2 border-gray-200 bg-gradient-to-br from-green-400 to-green-600" aria-hidden="true" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <section className="mb-6">
            <h2 className="mb-3.5 text-base font-bold text-neutral-950">Summary statistics</h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {summaryStats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-3.5 xl:grid-cols-2">
            <div>
              <h2 className="mb-3.5 text-base font-bold text-neutral-950">Quick Status</h2>
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
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                {routeStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2.5 border-b border-white/10 py-1.5 last:border-b-0">
                    <span aria-hidden="true">▦</span>
                    <span className="text-[13px] text-white/85">{stat.label}: <strong>{stat.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3.5 text-base font-bold text-neutral-950">Overview</h2>
            <div className="mb-[18px] grid grid-cols-1 gap-[18px] xl:grid-cols-2">
              <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-[18px] py-3.5">
                  <span className="text-sm font-semibold">Eco-Aide Availability</span>
                  <Button size="sm">View All</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse">
                    <thead>
                      <tr className="bg-brand">
                        {["Eco-Aide ID", "Eco-Aide", "Availability"].map((heading) => (
                          <th key={heading} className={tableHeadClass}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ecoAides.map((ecoAide, index) => (
                        <tr key={ecoAide.id} className={["border-b border-gray-100", index % 2 === 0 ? "bg-white" : "bg-gray-50"].join(" ")}>
                          <td className={tableCellClass}>{ecoAide.id}</td>
                          <td className={tableCellClass}>{ecoAide.name}</td>
                          <td className="px-3.5 py-2.5"><StatusBadge status={ecoAide.availability} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex min-h-64 items-center justify-center rounded-[10px] border border-gray-200 bg-white shadow-sm">
                <div className="text-center text-gray-400">
                  <div className="text-2xl" aria-hidden="true">▥</div>
                  <p className="mt-2 text-[13px]">Analytics chart coming soon</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-[18px] py-3.5">
                <span className="text-sm font-semibold">Request Queue (On-Demand Request)</span>
                <Button size="sm">View All</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="bg-brand">
                      {["Request ID", "Location", "Waste Type", "Status", "Eco-Aide"].map((heading) => (
                        <th key={heading} className={tableHeadClass}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requestQueue.map((request, index) => (
                      <tr key={request.id} className={["border-b border-gray-100", index % 2 === 0 ? "bg-white" : "bg-gray-50"].join(" ")}>
                        <td className={tableCellClass}>{request.id}</td>
                        <td className={tableCellClass}>{request.location}</td>
                        <td className={tableCellClass}>{request.wasteType}</td>
                        <td className="px-3.5 py-2.5"><StatusBadge status={request.status} /></td>
                        <td className={tableCellClass}>{request.ecoAide}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
