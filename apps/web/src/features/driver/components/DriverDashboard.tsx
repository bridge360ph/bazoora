"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Truck, MapPin, ChevronRight, Loader2, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useNavigate } from "react-router-dom";

export default function DriverDashboard(): React.ReactNode {
  const navigate = useNavigate();
  const [activeTruck, setActiveTruck] = useState<any | null>(null);
  const [completedRoutes, setCompletedRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        try {
          const truckRes = await apiClient.get<{ success: boolean; data: any }>("/trucks/me");
          if (truckRes.data.success) {
            setActiveTruck(truckRes.data.data);
          }
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error("Failed to fetch assigned truck", error);
          }
        }

        try {
          const routesRes = await apiClient.get<{ success: boolean; data: any[] }>(
            "/collection-routes",
          );
          if (routesRes.data.success) {
            setCompletedRoutes(routesRes.data.data || []);
          }
        } catch (error) {
          console.error("Failed to fetch completed routes", error);
        }
      } catch (error) {
        console.error("Failed to load Driver dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const isRouteActive = activeTruck?.status === "active";
  const plannedStops = activeTruck?.plannedRoute || [];
  const activeStop = plannedStops.find((s: any) => s.status === "active");
  const completedStopsCount = plannedStops.filter((s: any) => s.status === "completed").length;
  const totalStopsCount = plannedStops.length;
  const progressPercent =
    totalStopsCount > 0 ? Math.round((completedStopsCount / totalStopsCount) * 100) : 0;

  const totalCompletedLifetime = completedRoutes.reduce(
    (sum, r) => sum + (r.stops?.filter((s: any) => s.status === "completed").length || 0),
    0,
  );

  const stats = [
    {
      label: "Today's Route",
      value: isRouteActive ? `Active (${totalStopsCount} stops)` : "No Active Route",
      sub: isRouteActive ? "IN COLLECTION" : "IDLE",
      subColor: isRouteActive ? "text-orange-650 bg-orange-50" : "text-gray-500 bg-gray-50",
      icon: MapPin,
    },
    {
      label: "Stops Completed",
      value: isRouteActive
        ? `${completedStopsCount}/${totalStopsCount}`
        : `${totalCompletedLifetime} Total`,
      sub: isRouteActive ? "IN PROGRESS" : "LIFETIME",
      subColor: isRouteActive ? "text-orange-655 bg-orange-50" : "text-emerald-600 bg-emerald-50",
      icon: CheckCircle2,
    },
    {
      label: "Assigned Truck",
      value: activeTruck?.plateNumber || "No Truck",
      sub:
        activeTruck?.status === "active"
          ? "ACTIVE - GPS ON"
          : activeTruck
            ? "ASSIGNED"
            : "UNASSIGNED",
      subColor:
        activeTruck?.status === "active"
          ? "text-emerald-600 bg-emerald-50"
          : activeTruck
            ? "text-blue-600 bg-blue-50"
            : "text-red-650 bg-red-50",
      icon: Truck,
    },
  ];

  const queue = plannedStops.map((s: any) => ({
    id: s.id,
    name: s.name,
    details: s.detail || "Residential Area",
    status: s.status.toUpperCase(),
    time: s.completedAt ? `COMPLETED AT ${s.completedAt}` : "UPCOMING",
  }));

  const payloadLoaded = isRouteActive ? Math.min(completedStopsCount * 0.15, 5).toFixed(1) : "0.0";

  return (
    <div className="min-h-full bg-[#F5F5F5] dark:bg-background p-4 lg:p-6 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-5">
                <p className="mb-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  {stat.label}
                </p>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</h3>
                  {stat.sub ? (
                    <Badge
                      className={`${stat.subColor ?? ""} rounded-full border-0 px-2.5 py-0.5 text-[10px] font-bold tracking-widest`}
                    >
                      {stat.sub}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 py-20 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#0f2419] dark:text-emerald-500" />
            <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
              Loading dashboard...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* Main Action Area */}
            <div className="space-y-5 lg:col-span-3">
              {isRouteActive ? (
                <Card className="overflow-hidden rounded-2xl border-0 bg-[#0f2419] dark:bg-[#11241a] text-white shadow-lg">
                  <CardContent className="p-6 lg:p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                          CURRENT COLLECTION STOP
                        </span>
                        <div className="h-1 w-6 rounded-full bg-emerald-500" />
                      </div>
                      <Badge className="rounded-full border-0 bg-orange-500 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                        IN PROGRESS
                      </Badge>
                    </div>

                    <div className="mb-8">
                      <h2 className="mb-1 text-2xl font-bold tracking-tight lg:text-3xl">
                        {activeStop ? activeStop.name : "Moving to next stop..."}
                      </h2>
                      <p className="text-sm font-medium tracking-tight text-white/50">
                        {activeStop
                          ? activeStop.detail || "Residential Pickup"
                          : "No active stop in progress"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Button
                        onClick={() => {
                          navigate("/driver/route");
                        }}
                        className="h-12 rounded-xl border-0 bg-[#52D88B] text-xs font-bold tracking-tight text-[#0f2419] shadow-md transition-all hover:bg-[#45c07a] cursor-pointer"
                      >
                        <Navigation className="mr-2 h-4 w-4 fill-[#0f2419]" />
                        Open Route Navigation
                      </Button>
                      <Button
                        onClick={() => {
                          navigate("/driver/route");
                        }}
                        variant="ghost"
                        className="h-12 rounded-xl border border-white/20 bg-white/5 text-xs font-bold tracking-tight text-white shadow-md transition-all hover:bg-white/10 cursor-pointer"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm Collection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden rounded-2xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 p-6 text-center shadow-sm lg:p-8">
                  <CardContent className="flex flex-col items-center justify-center p-0 py-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                      <MapPin className="h-8 w-8" />
                    </div>
                    <h3 className="mb-1 text-lg font-black text-gray-900 dark:text-white">Ready to Collect?</h3>
                    <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                      You do not have an active route collection running right now. Go to the route
                      builder to start collecting.
                    </p>
                    <Button
                      onClick={() => {
                        navigate("/driver/route");
                      }}
                      className="h-12 rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 text-xs font-bold tracking-widest text-white uppercase cursor-pointer"
                    >
                      Start New Collection Route
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Sub Info Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      Location Hub
                    </p>
                    <p className="text-sm leading-none font-bold text-gray-900 dark:text-white">
                      {activeTruck ? "LGU Assigned Route" : "No Assignment"}
                    </p>
                  </div>
                </Card>
                <Card className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      Payload Status
                    </p>
                    <p className="text-sm leading-none font-bold text-gray-900 dark:text-white">
                      {payloadLoaded} / 5.0 Tons Loaded
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Sidebar Area: Route Progress */}
            <div className="lg:col-span-2">
              <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-850 p-5">
                  <h3 className="text-[10px] font-bold tracking-widest text-gray-900 dark:text-white uppercase">
                    Route Progress
                  </h3>
                  <Badge className="rounded-full border-0 bg-gray-50 dark:bg-slate-850 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {progressPercent}% DONE
                  </Badge>
                </div>
                <CardContent className="space-y-5 p-5">
                  {/* Visual Progress */}
                  <div className="space-y-1.5">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#0f2419] dark:bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                      <span>{completedStopsCount} Completed</span>
                      <span>{totalStopsCount - completedStopsCount} Remaining</span>
                    </div>
                  </div>

                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {queue.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                        <MapPin className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-[10px] font-bold tracking-widest uppercase">
                          No active stops
                        </p>
                      </div>
                    ) : (
                      queue.map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="group relative flex flex-col gap-2 rounded-xl border border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transition-all hover:bg-gray-50/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-medium tracking-tight text-gray-400 uppercase">
                                {item.time}
                              </p>
                              <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white transition-colors group-hover:text-[#0f2419]">
                                {item.name}
                              </h4>
                              <p className="text-[10px] leading-tight font-medium text-gray-400">
                                {item.details}
                              </p>
                            </div>
                            <Badge
                              className={`rounded-full border-0 px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase ${
                                item.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400"
                                  : item.status === "REPORTED" || item.status === "ISSUE"
                                    ? "bg-red-50 text-red-600 dark:bg-slate-800 dark:text-red-400"
                                    : item.status === "ACTIVE"
                                      ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                                      : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      navigate("/driver/route");
                    }}
                    variant="ghost"
                    className="h-10 w-full rounded-xl text-[10px] font-bold tracking-widest text-gray-400 uppercase hover:bg-gray-50 dark:hover:bg-slate-850 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  >
                    View Full Schedule
                    <ChevronRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
