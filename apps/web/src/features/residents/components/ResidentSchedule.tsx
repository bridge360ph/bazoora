"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listMyHaulingRequests } from "@/features/hauling-requests/api";
import type { HaulingRequest } from "@bazoora/shared";

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

function formatSelectedDate(
  date: Date,
): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResidentSchedule(): React.ReactNode {
  const today = new Date();

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
    async function loadRequests() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await listMyHaulingRequests();

        setRequests(data);
      } catch (requestError) {
        console.error(
          "Failed to load hauling requests:",
          requestError,
        );

        setError(
          "Failed to load your hauling schedule.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRequests();
  }, []);

  const scheduledRequests = useMemo(() => {
    return requests.filter((request) => {
      const date = new Date(request.pickupDate);

      return !Number.isNaN(date.getTime());
    });
  }, [requests]);

  const selectedRequest = useMemo(() => {
    return scheduledRequests.find((request) =>
      isSameDate(
        new Date(request.pickupDate),
        selectedDate,
      ),
    );
  }, [scheduledRequests, selectedDate]);

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
  }

  function getRequestForDate(
    date: Date,
  ): HaulingRequest | undefined {
    return scheduledRequests.find((request) =>
      isSameDate(
        new Date(request.pickupDate),
        date,
      ),
    );
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
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto w-full max-w-350">

        {/* Selected date schedule */}
        <section className="rounded-xl bg-brand-dark px-6 py-5 text-white shadow-sm">
          {loading ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-white/70">
                SCHEDULE
              </p>

              <h1 className="mt-2 text-2xl font-bold">
                Loading schedule...
              </h1>
            </>
          ) : selectedRequest ? (
            <>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-white/70">
                SCHEDULED COLLECTION
              </p>

              <h1 className="mt-2 text-2xl font-bold">
                {formatSelectedDate(
                  new Date(
                    selectedRequest.pickupDate,
                  ),
                )}
              </h1>

              <p className="mt-1 text-sm text-white/80">
                {selectedRequest.requestAddress}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
                  {wasteTypeLabels[
                    selectedRequest.wasteType
                  ] ?? selectedRequest.wasteType}
                </span>

                <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
                  {selectedRequest.status}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-white/70">
                SCHEDULE
              </p>

              <h1 className="mt-2 text-2xl font-bold">
                No scheduled collection
              </h1>

              <p className="mt-1 text-sm text-white/80">
                No hauling request is scheduled for{" "}
                {selectedDate.toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  },
                )}
                .
              </p>
            </>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Calendar */}
        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex flex-1 justify-center gap-4">
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
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
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

          {/* Calendar */}
          <div className="grid grid-cols-7">
            {calendarDays.map(
              (calendarDay, index) => {
                const request =
                  getRequestForDate(
                    calendarDay.date,
                  );

                const isSelected =
                  isSameDate(
                    selectedDate,
                    calendarDay.date,
                  );

                const isScheduled =
                  request !== undefined;

                return (
                  <button
                    key={`${calendarDay.date.toISOString()}-${index}`}
                    type="button"
                    onClick={() =>
                      handleDateClick(
                        calendarDay.date,
                      )
                    }
                    className="flex h-20 items-center justify-center"
                    aria-label={
                      isScheduled
                        ? `${calendarDay.date.toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            },
                          )}, scheduled collection`
                        : calendarDay.date.toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            },
                          )
                    }
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm transition ${
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
          </div>
        </section>
      </div>
    </main>
  );
}