"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Truck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { fetchRoutes } from "@/features/route-management/routeService";
import { exportToCsv, type CsvColumn } from "@/lib/csv";
import type { Route } from "@bazoora/shared";

// COLLECTION RECORD STRUCTURE
export interface CollectionRecord {
  id: string;
  routeNumber: number;
  routeDisplayNumber: string;
  routeName: string;
  barangay: string;
  date: string;
  time: string;
  wasteType: string;
  stopsCount: number;
  completedStops: number;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
  estimatedWeightKg: number;
}

export default function CollectionsLogPage() {
  const user = useAuthStore((s) => s.user);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "COMPLETED" | "IN_PROGRESS"
  >("ALL");

  // FETCH ASSIGNED ROUTES FOR THE AUTHENTICATED ECO-AIDE
  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const allRoutes = await fetchRoutes();

      // SCOPE TO ROUTES ASSIGNED TO CURRENT ECO-AIDE OR SHOW AVAILABLE ROUTES
      const assigned = allRoutes.filter(
        (r) =>
          r.assignedEcoAideId === user?.id ||
          r.assignedEcoAide?.id === user?.id
      );

      setRoutes(assigned.length > 0 ? assigned : allRoutes);
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
      const waypointsCount = r.waypoints
        ? r.waypoints.split(",").filter(Boolean).length
        : r.stops || 1;

      const isCompleted = r.status === "Completed";
      const isInProgress = r.status === "In Progress";

      const status: CollectionRecord["status"] = isCompleted
        ? "COMPLETED"
        : isInProgress
        ? "IN_PROGRESS"
        : "NOT_STARTED";

      const completedStops = isCompleted ? waypointsCount : isInProgress ? 1 : 0;
      // ESTIMATE ROUGH TONNAGE (APPROXIMATELY 120KG PER COLLECTION STOP)
      const estimatedWeightKg = completedStops * 120;

      const formattedDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return {
        id: r.id,
        routeNumber: r.routeNumber,
        routeDisplayNumber: r.routeDisplayNumber || `RT-${r.routeNumber}`,
        routeName: r.name,
        barangay: r.barangay,
        date: formattedDate,
        time: r.startTime || "08:00 AM",
        wasteType: r.wasteType || "Regular",
        stopsCount: waypointsCount,
        completedStops,
        status,
        estimatedWeightKg,
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
    const totalCompleted = collectionRecords.filter(
      (r) => r.status === "COMPLETED"
    ).length;

    const totalActive = collectionRecords.filter(
      (r) => r.status === "IN_PROGRESS"
    ).length;

    const totalKg = collectionRecords.reduce(
      (sum, r) => sum + r.estimatedWeightKg,
      0
    );

    const totalStopsCompleted = collectionRecords.reduce(
      (sum, r) => sum + r.completedStops,
      0
    );

    return {
      completedCount: totalCompleted,
      inProgressCount: totalActive,
      totalTonnage: (totalKg / 1000).toFixed(1),
      totalStopsCompleted,
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
      { header: "Date", accessor: (r) => r.date },
      { header: "Start Time", accessor: (r) => r.time },
      { header: "Waste Classification", accessor: (r) => r.wasteType },
      { header: "Total Stops", accessor: (r) => r.stopsCount },
      { header: "Completed Stops", accessor: (r) => r.completedStops },
      { header: "Status", accessor: (r) => r.status },
      { header: "Est. Weight (kg)", accessor: (r) => r.estimatedWeightKg },
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

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Collections Log & History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review completed hauling routes, verification summaries, and metrics.
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
                Routes Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.completedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Verified routes</div>
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
                Stops Finished
              </span>
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.totalStopsCompleted}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all assignments</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Waste Collected
              </span>
              <Truck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {metrics.totalTonnage}t
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Estimated total payload</div>
          </div>
        </div>

        {/* LOG SECTION & FILTER TABS */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Collection History Records
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredRecords.length}
              </span>
            </div>

            {/* FILTER TOGGLE BUTTONS */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(["ALL", "COMPLETED", "IN_PROGRESS"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activeFilter === filter
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {filter === "ALL"
                    ? "All"
                    : filter === "COMPLETED"
                    ? "Completed"
                    : "In Progress"}
                </button>
              ))}
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
                No collection records found for the selected filter.
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
                      <span>{item.date}</span>
                      <span>•</span>
                      <span>{item.time}</span>
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
                      <span>
                        {item.completedStops} of {item.stopsCount} stops completed
                      </span>
                      <span>•</span>
                      <span>~{item.estimatedWeightKg} kg</span>
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