"use client";

import { ChevronLeft, ChevronRight, Clock, Truck, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useSchedules } from "@/features/schedules/hooks";
import { type Schedule } from "@/features/schedules/schemas";
import { format } from "date-fns";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

export default function ResidentSchedule(): React.ReactNode {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const user = useAuthStore((s) => s.user);
  const barangayFilter = user?.address?.barangay || "";

  const { data: schedulesResult, isLoading } = useSchedules({
    barangay: barangayFilter,
    page: 1,
    limit: 100,
  });

  const schedules = schedulesResult?.data ?? [];

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const activeCollectionDays = (() => {
    const days = new Set<number>();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const hasSchedule = schedules.some((s) => s.day.toLowerCase() === dayName);
      if (hasSchedule) {
        days.add(day);
      }
    }
    return days;
  })();

  const nextCollection = getNextCollection(schedules);
  const nextCollectionDay =
    nextCollection?.date.getFullYear() === year && nextCollection.date.getMonth() === month
      ? nextCollection.date.getDate()
      : null;

  const daySchedules = selectedDay
    ? schedules.filter((s) => {
        const d = new Date(year, month, selectedDay);
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        return s.day.toLowerCase() === dayName;
      })
    : [];

  const hasOverlay = selectedDay !== null && daySchedules.length > 0;

  if (!isMounted) {
    return <div className="min-h-full bg-[#F8F9FA] dark:bg-background" />;
  }

  return (
    <div className="dark:bg-background min-h-full bg-[#F8F9FA] p-4 lg:p-5 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Next Scheduled Collection Card */}
        <Card className="overflow-hidden rounded-[20px] border-0 bg-[#0f2419] text-white shadow-lg ring-1 ring-white/5">
          <CardContent className="p-5 lg:p-6">
            <div className="mb-3">
              <span className="text-[9px] font-black tracking-[0.2em] text-emerald-400/80 uppercase">
                Next Scheduled Collection
              </span>
              <div className="mt-1 h-0.5 w-6 rounded-full bg-emerald-500" />
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-2 text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading collection schedules...</span>
              </div>
            ) : nextCollection ? (
              <>
                <h2 className="text-xl font-bold tracking-tight lg:text-2xl">
                  {format(nextCollection.date, "EEEE, MMMM d")} · {nextCollection.time}
                </h2>
                <p className="mt-1 text-xs font-medium text-white/50">
                  Barangay {toTitleCase(nextCollection.barangay)} · Route{" "}
                  {nextCollection.route.toUpperCase()}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] font-semibold text-white capitalize backdrop-blur-sm transition-colors hover:bg-white/10">
                    {nextCollection.wasteType}
                  </Badge>
                  <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
                    <Truck className="mr-1.5 h-3 w-3 text-emerald-400" />
                    Route {nextCollection.route.toUpperCase()}
                  </Badge>
                  <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10">
                    <Clock className="mr-1.5 h-3 w-3 text-emerald-400" />
                    Est. arrival {nextCollection.time}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold tracking-tight lg:text-2xl">
                  No Scheduled Collections
                </h2>
                <p className="mt-1 text-xs font-medium text-white/50">
                  {barangayFilter
                    ? `No active schedules for Barangay ${toTitleCase(barangayFilter)}`
                    : "Update your address in settings to view schedules for your barangay."}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Main Calendar Section */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 relative overflow-hidden rounded-[20px] border-0 bg-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
          <CardContent
            className={`p-4 transition-all duration-300 lg:p-6 ${hasOverlay ? "scale-[0.99] opacity-40 blur-[2px]" : ""}`}
          >
            {/* Header / Month Selector */}
            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1">
                <Select
                  value={MONTHS[month]}
                  onValueChange={(val: string | null) => {
                    if (val) {
                      const newMonth = MONTHS.indexOf(val);
                      if (newMonth !== -1) {
                        setCurrentDate(new Date(year, newMonth, 1));
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[120px] border-0 bg-transparent text-base font-bold tracking-tight text-gray-900 focus:ring-0 focus:ring-offset-0 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl dark:bg-slate-900 dark:border-slate-800">
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m} className="rounded-lg text-xs font-medium cursor-pointer">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(year)}
                  onValueChange={(val: string | null) => {
                    if (val) {
                      setCurrentDate(new Date(Number(val), month, 1));
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[80px] border-0 bg-transparent text-base font-bold tracking-tight text-gray-400 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl dark:bg-slate-900 dark:border-slate-800">
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem
                        key={String(y)}
                        value={String(y)}
                        className="rounded-lg text-xs font-medium cursor-pointer"
                      >
                        {String(y)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="dark:bg-slate-950 dark:ring-border flex items-center gap-1 rounded-lg bg-gray-50/80 p-0.5 ring-1 ring-gray-100">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevMonth}
                  className="h-7 w-7 rounded-md text-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  className="h-7 w-7 rounded-md text-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-7 border-b border-gray-50 dark:border-slate-850 pb-3">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[9px] font-black tracking-widest text-gray-300 dark:text-gray-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <div key={`empty-${String(i)}`} className="aspect-square" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isCollection = activeCollectionDays.has(day);
                  const isToday = isCurrentMonth && today.getDate() === day;
                  const isNextCollection = isCollection && day === nextCollectionDay;
                  const isSelected = selectedDay === day;

                  return (
                    <div key={day} className="flex aspect-square items-center justify-center">
                      <button
                        onClick={() => {
                          setSelectedDay(isSelected ? null : day);
                        }}
                        disabled={isLoading || (hasOverlay && !isSelected)}
                        className={`group relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                          isNextCollection
                            ? "bg-[#0f2419] dark:bg-emerald-600 text-white shadow-md shadow-[#0f2419]/20"
                            : isCollection
                              ? "bg-[#D1D5DB] dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-[#C1C5CB] dark:hover:bg-slate-650"
                              : isToday
                                ? "text-emerald-600 ring-2 ring-emerald-500/10"
                                : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                        } ${isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}
                      >
                        {String(day)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>

          {/* Selected Day Details Overlay */}
          {hasOverlay && (
            <div className="animate-in fade-in absolute inset-0 z-50 flex items-center justify-center p-4 duration-200">
              <div
                className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]"
                onClick={() => {
                  setSelectedDay(null);
                }}
              />
              <Card className="animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800 relative w-full max-w-[340px] overflow-hidden border-0 bg-white shadow-[0_15px_45px_rgba(0,0,0,0.15)] ring-1 ring-black/5 duration-200">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start justify-between">
                     <div className="space-y-1">
                      <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">
                        Collection Details
                      </span>
                      <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                        {format(new Date(year, month, selectedDay), "EEEE, MMMM d")}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-500">
                        Barangay {toTitleCase(barangayFilter || "Poblacion")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedDay(null);
                      }}
                      className="h-7 w-7 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                  </div>

                  {/* List of schedules on this day */}
                  <div className="mb-6 max-h-[220px] space-y-3 overflow-y-auto pr-1">
                    {daySchedules.map((sched) => (
                      <div
                        key={sched._id}
                        className="dark:bg-slate-950 space-y-2 rounded-xl border border-gray-100/50 bg-gray-50/80 p-3 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                            {sched.time}
                          </span>
                          <Badge className="rounded-full border-0 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 uppercase hover:bg-emerald-50">
                            {sched.waste_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                          <Truck className="h-3.5 w-3.5 text-gray-400" />
                          <span>Route: {sched.route.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                    {daySchedules.length === 0 && (
                      <p className="py-4 text-center text-xs text-gray-400">
                        No collections scheduled.
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedDay(null);
                    }}
                    className="h-11 w-full rounded-lg bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-[10px] font-bold tracking-[0.1em] text-white uppercase shadow-md shadow-[#0f2419]/20 transition-all cursor-pointer"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Close
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </Card>

        {/* Legend / Info */}
        {!hasOverlay && (
          <div className="flex items-center justify-center gap-6 px-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#0f2419] dark:bg-emerald-500" />
              <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                Next Pickup
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-sm bg-[#D1D5DB] dark:bg-slate-700" />
              <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                Collection Day
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
