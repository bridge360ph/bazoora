"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Loader2, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { env } from "@/lib/env";
import { format } from "date-fns";

export default function EcoAideTasks(): React.ReactNode {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error("Failed to fetch eco-aide routes", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, [accessToken]);

  const totalStops = routes.reduce(
    (sum, route) => sum + (route.stops?.filter((s: any) => s.status === "completed").length || 0),
    0,
  );

  return (
    <div className="min-h-full bg-[#F5F5F5] dark:bg-background p-4 lg:p-6 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="px-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-2xl">
            Tasks & Queue
          </h2>
          <p className="text-sm font-medium text-gray-400">
            Monitor route progress and dispatch notifications.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <p className="mb-0.5 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                Stops Completed Today
              </p>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{totalStops}</h3>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <p className="mb-0.5 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                Pending Issues
              </p>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">0</h3>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <p className="mb-0.5 text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                Eco Points Earned
              </p>
              <h3 className="text-xl font-bold tracking-tight text-emerald-600">{(totalStops * 15).toLocaleString()} pts</h3>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <div>
          <div className="mb-5 flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold tracking-widest text-gray-900 dark:text-white uppercase">
              Assigned Queue Logs
            </h3>
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              {routes.length} Route Runs
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 py-20 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#0f2419] dark:text-emerald-500" />
              <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                Loading queue logs...
              </p>
            </div>
          ) : routes.length > 0 ? (
            <div className="space-y-3">
              {routes.map((route, idx) => {
                const stopsCount = route.stops?.length || 0;
                const formattedDate = format(new Date(route.createdAt), "MMM d, yyyy · h:mm a");
                const firstStopName = route.stops?.[0]?.name || "Route stop";

                return (
                  <Card
                    key={route.id || idx}
                    className="overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-200 hover:bg-gray-50/50"
                  >
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                          <p className="text-[9px] font-medium tracking-tight text-gray-400 uppercase">
                            {formattedDate}
                          </p>
                        </div>
                        <h4 className="text-base font-bold tracking-tight text-gray-900 dark:text-white capitalize">
                          {firstStopName} {stopsCount > 1 ? `& ${stopsCount - 1} other stops` : ""}
                        </h4>
                      </div>
                      <div>
                        <Badge className="rounded-full border-0 bg-emerald-55 text-emerald-700 px-3 py-1 text-[9px] font-bold tracking-widest uppercase">
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
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-850 text-gray-300">
                <ClipboardList className="h-8 w-8" />
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white">No assigned tasks yet</p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                All upcoming route stops and queues assigned by dispatch will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
