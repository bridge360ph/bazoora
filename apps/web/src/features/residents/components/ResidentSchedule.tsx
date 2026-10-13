"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listMyHaulingRequests } from "@/features/hauling-requests/api";
import type {
  HaulingRequest,
  HaulingRequestStatus,
} from "@bazoora/shared";

type CalendarDay = {
  date: Date;
  day: number;
  muted?: boolean;
};

const wasteTypeLabels: Record<string, string> = {
  RESIDUAL: "Residual Waste",
  NON_BIODEGRADABLE: "Non-Biodegradable Waste",
  HAZARDOUS: "Hazardous Waste",
  BIODEGRADABLE: "Biodegradable Waste",
};

const statusLabels: Record<HaulingRequestStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  DENIED: "Denied",
};

// Requests with these statuses are not shown on the schedule.
const HIDDEN_STATUSES: HaulingRequestStatus[] = ["DENIED"];

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarDays(
  year: number,
  month: number,
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: CalendarDay[] = [];

  const firstDayOfWeek = firstDay.getDay();

  if (firstDayOfWeek > 0) {
    const previousMonthLastDay = new Date(
      year,
      month,
      0,
    ).getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(
        year,
        month - 1,
        previousMonthLastDay - i,
      );

      days.push({
        date,
        day: date.getDate(),
        muted: true,
      });
    }
  }

  for (
    let day = 1;
    day <= lastDay.getDate();
    day++
  ) {
    days.push({
      date: new Date(year, month, day),
      day,
    });
  }

  const remainingDays = 7 - (days.length % 7);

  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(
        year,
        month + 1,
        day,
      );

      days.push({
        date,
        day,
        muted: true,
      });
    }
  }

  return days;
}

function isSameDate(
  first: Date,
  second: Date,
): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

// Local-time key for grouping requests by calendar day.
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResidentSchedule(): React.ReactNode {
  const [today] = useState(() => new Date());

  const [currentMonth, setCurrentMonth] =
    useState(today.getMonth());

  const [currentYear, setCurrentYear] =
    useState(today.getFullYear());

  const [selectedDate, setSelectedDate] =
    useState<Date>(today);

  const [requests, setRequests] =
    useState<HaulingRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await listMyHaulingRequests();

        if (!cancelled) {
          setRequests(data);
        }
      } catch (requestError) {
        console.error(
          "Failed to load hauling requests:",
          requestError,
        );

        if (!cancelled) {
          setError(
            "Failed to load your hauling schedule.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  // Groups visible requests by day, sorted by pickup time.
  const requestsByDate = useMemo(() => {
    const grouped = new Map<string, HaulingRequest[]>();

    for (const request of requests) {
      const date = new Date(request.pickupDate);

      if (
        Number.isNaN(date.getTime()) ||
        request.archived ||
        HIDDEN_STATUSES.includes(request.status)
      ) {
        continue;
      }

      const key = getDateKey(date);
      const dayRequests = grouped.get(key) ?? [];

      dayRequests.push(request);
      grouped.set(key, dayRequests);
    }

    for (const dayRequests of grouped.values()) {
      dayRequests.sort(
        (first, second) =>
          new Date(first.pickupDate).getTime() -
          new Date(second.pickupDate).getTime(),
      );
    }

    return grouped;
  }, [requests]);

  function getRequestsForDate(
    date: Date,
  ): HaulingRequest[] {
    return requestsByDate.get(getDateKey(date)) ?? [];
  }

  const selectedRequests =
    getRequestsForDate(selectedDate);

  const calendarDays = useMemo(() => {
    return getCalendarDays(
      currentYear,
      currentMonth,
    );
  }, [currentYear, currentMonth]);

  function goToPreviousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  }

  function handleMonthChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setCurrentMonth(Number(event.target.value));
  }

  function handleYearChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setCurrentYear(Number(event.target.value));
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date);

    // Clicking a greyed-out day jumps to that day's month.
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
  }

  const years = useMemo(() => {
    const startYear = today.getFullYear() - 2;
    const endYear = today.getFullYear() + 5;

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index,
    );
  }, [today]);

  return (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface p-5">
      <div className="mx-auto w-full max-w-350">

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">

          {/* Calendar */}
          <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-1">

            {/* Calendar header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 flex-1 justify-center gap-4">
                <select
                  value={currentMonth}
                  onChange={handleMonthChange}
                  className="h-11 w-full max-w-100 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none"
                >
                  {MONTHS.map((month, index) => (
                    <option
                      key={month}
                      value={index}
                    >
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={handleYearChange}
                  className="h-11 w-full max-w-100 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none"
                >
                  {years.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="mt-5 grid grid-cols-7 border-b border-gray-100 pb-3 text-center">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map(
                (calendarDay, index) => {
                  const dayRequests =
                    getRequestsForDate(
                      calendarDay.date,
                    );

                  const isSelected =
                    isSameDate(
                      selectedDate,
                      calendarDay.date,
                    );

                  const count = dayRequests.length;
                  const isScheduled = count > 0;
                  const dateLabel = formatLongDate(
                    calendarDay.date,
                  );

                  return (
                    <button
                      key={`${calendarDay.date.toISOString()}-${index}`}
                      type="button"
                      onClick={() =>
                        handleDateClick(
                          calendarDay.date,
                        )
                      }
                      className="flex h-16 items-center justify-center sm:h-20"
                      aria-label={
                        isScheduled
                          ? `${dateLabel}, ${count} scheduled ${
                              count === 1
                                ? "collection"
                                : "collections"
                            }`
                          : dateLabel
                      }
                    >
                      <div
                        className={`relative flex h-11 w-11 items-center justify-center rounded-lg text-sm transition ${
                          isSelected
                            ? "bg-gray-800 font-semibold text-white"
                            : isScheduled
                              ? "bg-gray-200 font-medium text-gray-700 hover:bg-gray-300"
                              : calendarDay.muted
                                ? "text-gray-300 hover:bg-gray-50"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {calendarDay.day}

                        {count > 1 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-dark px-1 text-[9px] font-semibold text-white">
                            {count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {/* Calendar legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-gray-200" />

                <span className="text-xs text-gray-500">
                  Scheduled collection
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-gray-800" />

                <span className="text-xs text-gray-500">
                  Selected date
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-dark px-1 text-[9px] font-semibold text-white">
                  2
                </span>

                <span className="text-xs text-gray-500">
                  Multiple pickups
                </span>
              </div>
            </div>
          </section>

          {/*
            Selected date details.
            On large screens the outer aside stretches to the calendar's
            height and the inner panel is pinned inside it, so the list
            scrolls instead of making the page taller than the calendar.
          */}
          <aside className="relative min-w-0 lg:w-96 lg:shrink-0">
            <div className="flex max-h-120 flex-col overflow-hidden rounded-xl bg-brand-dark text-white shadow-sm lg:absolute lg:inset-0 lg:max-h-none">

              {/* Panel header */}
              <div className="shrink-0 border-b border-white/15 px-6 py-5">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-white/70">
                  {loading || error || selectedRequests.length === 0
                    ? "SCHEDULE"
                    : selectedRequests.length === 1
                      ? "SCHEDULED COLLECTION"
                      : `${selectedRequests.length} SCHEDULED COLLECTIONS`}
                </p>

                <h1 className="mt-2 text-2xl font-bold">
                  {loading
                    ? "Loading schedule..."
                    : error
                      ? "Schedule unavailable"
                      : formatLongDate(selectedDate)}
                </h1>
              </div>

              {/* Panel body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {loading ? null : error ? (
                  <p className="text-sm text-white/80">
                    We couldn't load your collections. Please try again later.
                  </p>
                ) : selectedRequests.length === 0 ? (
                  <p className="text-sm text-white/80">
                    No hauling request is scheduled for this day.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {selectedRequests.map((request) => (
                      <li
                        key={request.requestId}
                        className="rounded-lg bg-white/10 p-4"
                      >
                        <p className="text-sm font-semibold">
                          {formatTime(
                            new Date(request.pickupDate),
                          )}
                        </p>

                        <p className="mt-1 break-words text-sm text-white/80">
                          {request.requestAddress}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
                            {wasteTypeLabels[
                              request.wasteType
                            ] ?? request.wasteType}
                          </span>

                          <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
                            {statusLabels[request.status] ??
                              request.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
