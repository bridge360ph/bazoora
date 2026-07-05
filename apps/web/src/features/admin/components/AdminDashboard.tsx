import React from "react";
import DataTable from "../../../components/DataTable";
import type { Column } from "../../../components/DataTable";
import { StatCard } from "../../../components/StatCard";
import type {
  DashboardEcoAide,
  DashboardRequest,
  DashboardStats,
  EcoAideAvailability,
  RequestStatus,
  RouteStatusSummary,
} from "../../../types/admindashboard.types";
import { Button } from "../../../components/Button";

interface AdminDashboardProps {
  // Quick Status
  stats: DashboardStats;

  // Eco-Aide Availability
  ecoAides: DashboardEcoAide[];
  onViewAllEcoAides: () => void;

  // Route Status Today
  routeStatus: RouteStatusSummary;
  onViewAllRoutes: () => void;

  // Request Queue
  requestQueue: DashboardRequest[];
  onViewAllRequests: () => void;

  // (OPTIONAL) Insert should-have could-have features here
}

// Display Maps

const AVAILABILITY_DISPLAY: Record<EcoAideAvailability, string> = {
  available: "Available",
  "on-route": "On Route",
  "off-duty": "Off Duty",
};

const REQUEST_STATUS_DISPLAY: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

// SUB-COMPONENTS

const SectionHeader: React.FC<{
  title: string;
  onViewAll?: () => void;
  light?: boolean;
}> = ({ title, onViewAll, light = false }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className={`text-base font-semibold ${light ? "text-white" : "text-gray-800"}`}>
      {title}
    </h2>
    {onViewAll && (
      <Button
        variant="blackWhiteText"
        onClick={onViewAll}
      >
        View All
      </Button>
    )}
  </div>
);

const RouteStatusCard: React.FC<{
  routeStatus: RouteStatusSummary;
  onViewAll: () => void;
}> = ({ routeStatus, onViewAll }) => {
  const items = [
    { label: "In Progress", value: routeStatus.inProgress },
    { label: "Not Started", value: routeStatus.notStarted },
    { label: "Completed Today", value: routeStatus.completedToday },
    { label: "Total Routes", value: routeStatus.totalRoutes },
  ];

  return (
    <div className="bg-[#1E4D2B] rounded-xl p-4 flex flex-col gap-3">
      
      {/* HEADER INSIDE GREEN CONTAINER */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">
          Route Status Today
        </h2>

        <Button
          variant="blackWhiteText"
          onClick={onViewAll}
        >
          View All
        </Button>
      </div>

      {/* WHITE INNER CONTAINER */}
      <div className="bg-white rounded-lg p-4 flex flex-col gap-3">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gray-100 border flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 3l18 18M21 3L3 21" />
              </svg>
            </div>

            <span className="text-sm text-gray-700">
              {label}:{" "}
              <span className="font-semibold text-gray-900">
                {value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// MAIN

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  ecoAides,
  onViewAllEcoAides,
  routeStatus,
  onViewAllRoutes,
  requestQueue,
  onViewAllRequests,
}) => {

  // Eco-Aide Availability
  const ecoAideColumns: Column<DashboardEcoAide>[] = [
    {
      key: "id",
      header: "Eco-Aide ID",
      render: (row) => <span className="font-medium text-gray-800">{row.id}</span>,
    },
    { key: "name", header: "Eco-Aide" },
    {
      key: "availability",
      header: "Availability",
      render: (row) => (
        <span className="text-gray-700">{AVAILABILITY_DISPLAY[row.availability]}</span>
      ),
    },
  ];

  // Request Queue columns
  const requestColumns: Column<DashboardRequest>[] = [
    {
      key: "id",
      header: "Request ID",
      render: (row) => <span className="font-medium text-gray-800">{row.id}</span>,
    },
    { key: "location", header: "Location" },
    { key: "wasteType", header: "Waste Type" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="text-gray-700">{REQUEST_STATUS_DISPLAY[row.status]}</span>
      ),
    },
    {
      key: "assignedEcoAide",
      header: "Eco-Aide",
      render: (row) => (
        <span className="text-gray-700">{row.assignedEcoAide ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* OPTIONAL / Not Must-Have: Summary Statistics */}

      {/* Quick Status*/}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Status</h2>
        <div className="flex flex-wrap gap-3">
          <StatCard label="Active Pickups" value={stats.activePickups} />
          <StatCard label="Unassigned Requests" value={stats.unassignedRequests} />
        </div>
      </section>

      {/* Overview: Eco-Aide Availability + Route Status Today */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Overview</h2>
        <div className="flex gap-4 items-start">
          {/* Eco-Aide Availability */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <SectionHeader title="Eco-Aide Availability" onViewAll={onViewAllEcoAides} />
              <DataTable<DashboardEcoAide>
                columns={ecoAideColumns}
                data={ecoAides}
                emptyMessage="No eco-aides to display."
              />
            </div>
          </div>

          {/* Route Status Today */}
          <div className="w-[300px] shrink-0 self-stretch">
            <RouteStatusCard routeStatus={routeStatus} onViewAll={onViewAllRoutes} />
          </div>
        </div>
      </section>

      {/* Request Queue*/}
      <section>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <SectionHeader
              title="Request Queue (On-Demand Request)"
              onViewAll={onViewAllRequests}
            />
            <DataTable<DashboardRequest>
              columns={requestColumns}
              data={requestQueue}
              emptyMessage="No pending requests."
            />
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;
