"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  CircleDashed,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { fetchRoutes } from "@/features/route-management/routeService";
import { exportToCsv, type CsvColumn } from "@/lib/csv";
import type { Route } from "@bazoora/shared";

// COLLECTION RECORD STRUCTURE
//
// Every field here is read straight off the Route the API returns. The Route
// model has no completion timestamps, no per-stop progress and no recorded
// weights, so this page reports the assignment and its status and nothing more.
// Adding collected-weight or completed-stop figures needs a real collection
// record on the backend first.
export interface CollectionRecord {
  id: string;
  routeDisplayNumber: string;
  routeName: string;
  barangay: string;
  collectionDay: string;
  startTime: string;
  wasteType: string;
  stopsCount: number;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
}

type StatusFilter = "ALL" | CollectionRecord["status"];

export default function CollectionsLogPage() {
  const user = useAuthStore((s) => s.user);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");

  // FETCH ASSIGNED ROUTES FOR THE AUTHENTICATED ECO-AIDE
  //
  // GET /routes is readable by every operational role and returns every route
  // in the system, so the assignment filter below is what scopes this page to
  // the signed-in eco-aide. An eco-aide with no assignment sees an empty log,
  // never the whole municipality's routes.
  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const allRoutes = await fetchRoutes();

      const assigned = allRoutes.filter(
        (r) =>
          !!user?.id &&
          (r.assignedEcoAideId === user.id || r.assignedEcoAide?.id === user.id),
      );

      setRoutes(assigned);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load collection logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCollections();
  }, [user?.id]);

  // MAP ASSIGNED ROUTES INTO COLLECTION LOG RECORDS
  const collectionRecords: CollectionRecord[] = useMemo(() => {
    return routes.map((r) => {
      const stopsCount =
        r.stops ||
        (r.waypoints ? r.waypoints.split(",").filter(Boolean).length : 0);

      const status: CollectionRecord["status"] =
        r.status === "Completed"
          ? "COMPLETED"
          : r.status === "In Progress"
            ? "IN_PROGRESS"
            : "NOT_STARTED";

      return {
        id: r.id,
        routeDisplayNumber: r.routeDisplayNumber || `RT-${r.routeNumber}`,
        routeName: r.name,
        barangay: r.barangay,
        collectionDay: r.collectionDay,
        startTime: r.startTime,
        wasteType: r.wasteType,
        stopsCount,
        status,
      };
    });
  }, [routes]);

  // FILTERED VIEW
  const filteredRecords = useMemo(() => {
    if (activeFilter === "ALL") return collectionRecords;
    return collectionRecords.filter((rec) => rec.status === activeFilter);
  }, [collectionRecords, activeFilter]);

  // SUMMARY KPIS
  const metrics = useMemo(() => {
    const countBy = (status: CollectionRecord["status"]) =>
      collectionRecords.filter((r) => r.status === status).length;

    return {
      completedCount: countBy("COMPLETED"),
      inProgressCount: countBy("IN_PROGRESS"),
      notStartedCount: countBy("NOT_STARTED"),
      totalStops: collectionRecords.reduce((sum, r) => sum + r.stopsCount, 0),
    };
  }, [collectionRecords]);

  // CSV EXPORT HANDLER
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      toast.error("No collection records available to export.");
      return;
    }

    const columns: CsvColumn<CollectionRecord>[] = [
      { header: "Route ID", accessor: (r) => r.routeDisplayNumber },
      { header: "Route Name", accessor: (r) => r.routeName },
      { header: "Barangay", accessor: (r) => r.barangay },
      { header: "Collection Day", accessor: (r) => r.collectionDay },
      { header: "Start Time", accessor: (r) => r.startTime },
      { header: "Waste Classification", accessor: (r) => r.wasteType },
      { header: "Scheduled Stops", accessor: (r) => r.stopsCount },
      { header: "Status", accessor: (r) => r.status.replace("_", " ") },
    ];

    const timestamp = new Date().toISOString().split("T")[0];
    exportToCsv(`eco-aide-collections-${timestamp}.csv`, filteredRecords, columns);
    toast.success("Collection log exported to CSV.");
  };

  const statusStripColors: Record<CollectionRecord["status"], string> = {
    COMPLETED: "bg-emerald-500",
    IN_PROGRESS: "bg-amber-500",
    NOT_STARTED: "bg-slate-300 dark:bg-slate-700",
  };

  const statusBadgeStyles: Record<CollectionRecord["status"], string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    IN_PROGRESS: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    NOT_STARTED: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  };

  const filterLabels: Record<StatusFilter, string> = {
    ALL: "All",
    COMPLETED: "Completed",
    IN_PROGRESS: "In Progress",
    NOT_STARTED: "Not Started",
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Collections Log
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your assigned hauling routes and their current status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadCollections()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.completedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Routes marked done</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                In Progress
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.inProgressCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Active operations</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Not Started
              </span>
              <CircleDashed className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.notStartedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Awaiting dispatch</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Scheduled Stops
              </span>
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.totalStops}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all assignments</div>
          </div>
        </div>

        {/* LOG SECTION & FILTER TABS */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Assigned Routes
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredRecords.length}
              </span>
            </div>

            {/* FILTER TOGGLE BUTTONS */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(["ALL", "COMPLETED", "IN_PROGRESS", "NOT_STARTED"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      activeFilter === filter
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {filterLabels[filter]}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* LIST CONTAINER */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                Loading collection history...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                {collectionRecords.length === 0
                  ? "You have no routes assigned to you yet."
                  : "No routes match the selected filter."}
              </div>
            ) : (
              filteredRecords.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 flex items-center gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* COLOR STRIP */}
                  <div
                    className={`w-1.5 self-stretch rounded-full shrink-0 ${
                      statusStripColors[item.status]
                    }`}
                  />

                  {/* DETAILS */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.collectionDay}</span>
                      <span>•</span>
                      <span>{item.startTime}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {item.routeDisplayNumber}
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                      {item.routeName}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{item.barangay}</span>
                      <span>•</span>
                      <span>{item.wasteType} Waste</span>
                      <span>•</span>
                      <span>{item.stopsCount} scheduled stops</span>
                    </div>
                  </div>

                  {/* STATUS BADGE */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${
                        statusBadgeStyles[item.status]
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
