"use client";

import { ArrowRight, Clock, Truck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useAuthStore } from "@/stores/auth-store";
import { useReports } from "@/features/reports/hooks";
import { useHaulingRequests } from "@/features/hauling-requests/hooks";
import { useSchedules } from "@/features/schedules/hooks";
import { type Schedule, toTitleCase } from "@/features/schedules/schemas";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface NextCollection {
  date: Date;
  time: string;
  wasteType: string;
  route: string;
  barangay: string;
}

function getNextCollection(schedules: Schedule[]): NextCollection | null {
  if (schedules.length === 0) return null;

  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    const matching = schedules.filter((s) => s.day.toLowerCase() === dayName);
    if (matching.length > 0) {
      const parseTime = (timeStr: string) => {
        const [time, modifier] = timeStr.split(" ");
        if (!time || !modifier) return 0;
        const [hoursStr, minutesStr] = time.split(":");
        let hours = Number.parseInt(hoursStr || "0", 10);
        const minutes = Number.parseInt(minutesStr || "0", 10);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const sorted = [...matching].toSorted((a, b) => parseTime(a.time) - parseTime(b.time));
      const nextSched = sorted[0];

      return {
        date: checkDate,
        time: nextSched.time,
        wasteType: nextSched.waste_type,
        route: nextSched.route,
        barangay: nextSched.barangay,
      };
    }
  }

  return null;
}

function formatAddress(
  address: { line1: string; barangay: string; city: string; province: string } | null | undefined,
): string {
  if (!address) return "";
  return [address.line1, address.barangay, address.city, address.province]
    .filter(Boolean)
    .join(", ");
}

export default function ResidentDashboard(): React.ReactNode {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: reports, isLoading: isLoadingReports } = useReports();
  const { data: haulingRequests, isLoading: isLoadingHauling } = useHaulingRequests();

  const barangayFilter = user?.address?.barangay || "";
  const { data: schedulesResult, isLoading: isLoadingSchedules } = useSchedules({
    barangay: barangayFilter,
    page: 1,
    limit: 100,
  });

  const schedules = schedulesResult?.data ?? [];
  const nextCollection = getNextCollection(schedules);

  const latestReport = reports?.[0];
  const latestHauling = haulingRequests?.[0];

  const recentActivity =
    latestReport && latestHauling
      ? new Date(latestReport.createdAt) > new Date(latestHauling.createdAt)
        ? { type: "report", data: latestReport }
        : { type: "hauling", data: latestHauling }
      : latestReport
        ? { type: "report", data: latestReport }
        : latestHauling
          ? { type: "hauling", data: latestHauling }
          : null;

  return (
    <div className="dark:bg-background mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6 overflow-y-auto h-full">
      {/* Next Scheduled Collection */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-[#0f2419] text-white shadow-lg">
        <CardContent className="p-5 lg:p-6">
          <p className="mb-2 text-[10px] font-bold tracking-widest text-white/60 uppercase">
            NEXT SCHEDULED COLLECTION
          </p>
          <div className="mb-3 h-0.5 w-6 rounded-full bg-emerald-500" />

          {isLoadingSchedules ? (
            <div className="flex items-center gap-2 py-2 text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading collection schedules...</span>
            </div>
          ) : nextCollection ? (
            <>
              <h2 className="text-xl font-bold lg:text-2xl">
                {format(nextCollection.date, "EEEE, MMMM d")} · {nextCollection.time}
              </h2>
              <p className="mt-1 text-sm font-medium text-white/70">
                Barangay {toTitleCase(nextCollection.barangay)} · Route{" "}
                {nextCollection.route.toUpperCase()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="rounded-full border border-white/20 bg-transparent px-3 py-1 text-xs font-normal text-white capitalize hover:bg-white/10">
                  {nextCollection.wasteType}
                </Badge>
                <Badge className="rounded-full border border-white/20 bg-transparent px-3 py-1 text-xs font-normal text-white hover:bg-white/10">
                  <Truck className="mr-1.5 h-3 w-3" />
                  Route {nextCollection.route.toUpperCase()}
                </Badge>
                <Badge className="rounded-full border border-white/20 bg-transparent px-3 py-1 text-xs font-normal text-white hover:bg-white/10">
                  <Clock className="mr-1.5 h-3 w-3" />
                  Est. arrival {nextCollection.time}
                </Badge>
              </div>
              <div className="mt-5">
                <Button
                  onClick={() => navigate("/resident/track")}
                  className="rounded-full bg-[#52b788] px-6 font-bold text-[#0f2419] transition-colors hover:bg-[#40916c] cursor-pointer"
                >
                  Track Truck
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold lg:text-2xl">No Scheduled Collections</h2>
              <p className="mt-1 text-sm font-medium text-white/70">
                {barangayFilter
                  ? `No active schedules for Barangay ${toTitleCase(barangayFilter)}`
                  : "Update your address in settings to view schedules for your barangay."}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cards grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-xl border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Activity</h3>
              {recentActivity && (
                <Badge className="rounded-full border-0 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                  {recentActivity.type === "report"
                    ? (recentActivity.data as any).status
                    : (recentActivity.data as any).status}
                </Badge>
              )}
            </div>

            {isLoadingReports || isLoadingHauling ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : recentActivity ? (
              <div className="mt-3">
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  {recentActivity.type === "report"
                    ? `Report: ${(recentActivity.data as any).type}`
                    : `Hauling: ${(recentActivity.data as any).wasteType}`}
                </p>
                <p className="mt-1 max-w-[280px] truncate text-xs text-gray-600 dark:text-gray-400">
                  {recentActivity.type === "report"
                    ? (recentActivity.data as any).description
                    : (recentActivity.data as any).notes || "No additional notes"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  {format(new Date(recentActivity.data.createdAt), "MMMM d · h:mm a")}
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() =>
                      navigate(recentActivity.type === "report" ? "/resident/reports" : "/resident/hauling")
                    }
                    size="sm"
                    className="h-8 rounded-lg bg-[#111] dark:bg-slate-800 px-4 text-xs font-medium text-white hover:bg-black cursor-pointer"
                  >
                    View All
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 py-4 text-center">
                <p className="text-xs font-medium text-gray-400">No recent activity found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Your Location */}
          <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-xl border border-gray-100 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Your Location</h3>
                <p className="mt-1 truncate pr-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {formatAddress(user?.address) || "Please set your address in Settings"}
                </p>
              </div>
              <Button
                onClick={() => navigate("/resident/settings")}
                size="sm"
                className="h-8 shrink-0 rounded-lg bg-[#111] dark:bg-slate-800 px-4 text-xs font-medium text-white hover:bg-black cursor-pointer"
              >
                Change
              </Button>
            </CardContent>
          </Card>

          {/* Truck Location */}
          <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-xl border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Truck Location</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Poblacion Barangay Hall, San Juan, Batangas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
