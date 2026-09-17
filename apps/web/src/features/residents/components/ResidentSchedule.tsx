"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarDay = {
  day: number;
  muted?: boolean;
  scheduled?: boolean;
  selected?: boolean;
};

export default function ResidentSchedule(): React.ReactNode {
  const weeks: CalendarDay[][] = [
    [
      { day: 31, muted: true },
      { day: 1 },
      { day: 2, scheduled: true },
      { day: 3 },
      { day: 4 },
      { day: 5 },
      { day: 6, scheduled: true },
    ],
    [
      { day: 7 },
      { day: 8 },
      { day: 9, scheduled: true },
      { day: 10 },
      { day: 11 },
      { day: 12 },
      { day: 13, selected: true },
    ],
    [
      { day: 14 },
      { day: 15 },
      { day: 16, scheduled: true },
      { day: 17 },
      { day: 18 },
      { day: 19 },
      { day: 20, scheduled: true },
    ],
    [
      { day: 21 },
      { day: 22 },
      { day: 23, scheduled: true },
      { day: 24 },
      { day: 25 },
      { day: 26 },
      { day: 27, scheduled: true },
    ],
    [
      { day: 28 },
      { day: 29 },
      { day: 30, scheduled: true },
      { day: 1, muted: true },
      { day: 2, muted: true },
      { day: 3, muted: true },
      { day: 4, muted: true },
    ],
  ];

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f5f6f5] p-5">
      <div className="mx-auto w-full max-w-350">
        {/* Next scheduled collection */}
        <section className="rounded-xl bg-brand-dark px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/70">
            NEXT SCHEDULED COLLECTION
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Tuesday, June 16 · 7:00 AM
          </h1>

          <p className="mt-1 text-sm text-white/80">
            Barangay Poblacion · Route A
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
              Biodegradable
            </span>

            <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
              Truck #BT-04
            </span>

            <span className="rounded-full border border-white/70 px-3 py-1.5 text-[10px] font-medium">
              Est. arrival 7:20 AM
            </span>
          </div>
        </section>

        {/* Calendar */}
        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex flex-1 justify-center gap-4">
              <select
                defaultValue="June"
                className="h-11 w-full max-w-100 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none"
              >
                <option>June</option>
              </select>

              <select
                defaultValue="2026"
                className="h-11 w-full max-w-100 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none"
              >
                <option>2026</option>
              </select>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mt-5 grid grid-cols-7 border-b border-gray-100 pb-3 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <span
                  key={day}
                  className="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {day}
                </span>
              ),
            )}
          </div>

          {/* Calendar */}
          <div className="grid grid-cols-7">
            {weeks.flatMap((week, weekIndex) =>
              week.map((date, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="flex h-20 items-center justify-center"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm ${
                      date.selected
                        ? "bg-gray-800 font-semibold text-white"
                        : date.scheduled
                          ? "bg-gray-200 font-medium text-gray-700"
                          : date.muted
                            ? "text-gray-300"
                            : "text-gray-700"
                    }`}
                  >
                    {date.day}
                  </div>
                </div>
              )),
            )}
          </div>

          {/* Calendar legend */}
          <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-100 pt-4">
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