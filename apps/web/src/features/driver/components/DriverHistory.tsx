"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarCheck,
  AlertCircle,
  Scale,
  ChevronRight,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { env } from "@/lib/env";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

export default function DriverHistory(): React.ReactNode {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const fetchRoutes = async () => {
      try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/collection-routes`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const json = await res.json();
        if (json.success) {
          setRoutes(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch driver completed routes", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, [accessToken]);

  const todayStr = new Date().toDateString();
  const collectionsToday = routes.reduce((sum, route) => {
    const routeDate = new Date(route.createdAt).toDateString();
    if (routeDate === todayStr) {
      return sum + (route.stops?.filter((s: any) => s.status === "completed").length || 0);
    }
    return sum;
  }, 0);

  const totalCompletedStops = routes.reduce(
    (sum, route) => sum + (route.stops?.filter((s: any) => s.status === "completed").length || 0),
    0,
  );

  const issuesReported = routes.reduce(
    (sum, route) =>
      sum +
      (route.stops?.filter((s: any) => s.status === "reported" || s.status === "issue").length ||
        0),
    0,
  );

  const estimatedTonnage = (totalCompletedStops * 0.15).toFixed(1);

  const stats = [
    {
      label: "Collections Today",
      value: collectionsToday.toString(),
      sub: "COMPLETED",
      icon: CalendarCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Issues Reported",
      value: issuesReported.toString(),
      sub: "TOTAL LOGGED",
      icon: AlertCircle,
      color: "text-orange-650",
      bg: "bg-orange-50",
    },
    {
      label: "Waste Collected",
      value: `${estimatedTonnage}t`,
      sub: "ESTIMATED TOTAL",
      icon: Scale,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-full bg-[#F5F5F5] dark:bg-background p-4 lg:p-6 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} dark:bg-slate-850`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="mb-0.5 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                    {stat.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</h3>
                    <Badge
                      className={`rounded-full border-0 text-[8px] font-bold tracking-widest uppercase ${stat.bg} ${stat.color}`}
                    >
                      {stat.sub}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold tracking-widest text-gray-900 dark:text-white uppercase">
              Completed Route Logs
            </h3>
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              {routes.length} Route{routes.length === 1 ? "" : "s"} Run
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 py-20 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#0f2419] dark:text-emerald-500" />
              <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                Loading collection logs...
              </p>
            </div>
          ) : routes.length > 0 ? (
            <div className="space-y-3">
              {routes.map((route, idx) => {
                const totalStops = route.stops?.length || 0;
                const completedStops =
                  route.stops?.filter((s: any) => s.status === "completed").length || 0;
                const formattedDate = format(new Date(route.createdAt), "MMM d, yyyy · h:mm a");

                const firstStopName = route.stops?.[0]?.name || "Unnamed Stop";
                const locationSummary =
                  totalStops > 1
                    ? `${firstStopName} & ${totalStops - 1} other stop${totalStops - 1 > 1 ? "s" : ""}`
                    : firstStopName;

                return (
                  <Card
                    key={route.id || idx}
                    className="group overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-200 hover:bg-gray-50/50"
                  >
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-1 rounded-full bg-emerald-500" />
                          <p className="text-[9px] font-medium tracking-tight text-gray-400 uppercase">
                            {formattedDate}
                          </p>
                        </div>
                        <h4 className="text-base font-bold tracking-tight text-gray-900 dark:text-white capitalize">
                          {locationSummary}
                        </h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-450">
                            {completedStops}/{totalStops} Stops Completed ·{" "}
                            {route.stops?.[0]?.detail || "Residential Area"}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedRoute(route);
                            }}
                            className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-emerald-600 uppercase hover:underline cursor-pointer"
                          >
                            Details <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <Badge className="rounded-full border-0 bg-emerald-50 text-emerald-600 px-3 py-1 text-[9px] font-bold tracking-widest uppercase">
                          COMPLETED
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-gray-300">
                <CalendarCheck className="h-8 w-8" />
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white">No completed routes yet</p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Your completed routes and collections will show up here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Route Details Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800 relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
            {/* Modal Header */}
            <div className="dark:bg-slate-950/50 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Route Run Log Details
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                  Route Completed {format(new Date(selectedRoute.createdAt), "MMM d, yyyy")}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedRoute(null);
                }}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 rounded-2xl bg-gray-50 dark:bg-slate-850 p-4 text-center">
                <div>
                  <span className="block text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                    Total Stops
                  </span>
                  <span className="text-lg font-black text-gray-950 dark:text-white">
                    {selectedRoute.stops?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                    Completed
                  </span>
                  <span className="text-lg font-black text-emerald-600">
                    {selectedRoute.stops?.filter((s: any) => s.status === "completed").length || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                    Est. Weight
                  </span>
                  <span className="text-lg font-black text-blue-600">
                    {(
                      (selectedRoute.stops?.filter((s: any) => s.status === "completed").length ||
                        0) * 0.15
                    ).toFixed(2)}
                    t
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-black tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                  Stops & Proof of Pickup
                </h4>
                <div className="space-y-3.5">
                  {selectedRoute.stops?.map((stop: any, idx: number) => (
                    <div
                      key={stop.id || idx}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm sm:flex-row"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-150 dark:bg-slate-800 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{stop.name}</span>
                        </div>
                        <p className="pl-7 text-xs font-semibold text-gray-500">
                          {stop.detail || "Residential Address"}
                        </p>
                        {stop.completedAt && (
                          <p className="pl-7 text-[10px] font-semibold text-gray-400">
                            Collected at: {format(new Date(stop.completedAt), "h:mm a")}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col justify-between gap-2 sm:items-end">
                        <Badge
                          className={`self-start rounded-full border-0 px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase sm:self-auto ${
                            stop.status === "completed"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400"
                              : stop.status === "reported" || stop.status === "issue"
                                ? "bg-red-50 text-red-600 dark:bg-slate-800 dark:text-red-400"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {stop.status}
                        </Badge>

                        {stop.proofPhotoUrl && (
                          <div
                            onClick={() => window.open(getImageUrl(stop.proofPhotoUrl), "_blank")}
                            className="flex cursor-pointer items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>Proof Image</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dark:bg-slate-950/50 flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-slate-800">
              <Button
                onClick={() => {
                  setSelectedRoute(null);
                }}
                className="rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 font-bold text-white cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
