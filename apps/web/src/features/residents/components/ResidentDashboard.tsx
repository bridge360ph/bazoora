import { Link } from "react-router-dom";

export function ResidentDashboard() {
  return (
    <div className="min-h-full bg-[#f3f5f4] px-8 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Next Scheduled Collection */}
        <section className="rounded-xl bg-brand-dark px-8 py-8 text-white">
          <p className="text-xs font-medium tracking-wide text-gray-300">
            NEXT SCHEDULED COLLECTION
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-tight">
            Tuesday, June 16 · 7:00 AM
          </h1>

          <p className="mt-2 text-base text-gray-300">
            Barangay Poblacion · Route A
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-200">
              Biodegradable
            </span>

            <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-200">
              Truck #BT-04
            </span>

            <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-200">
              Est. arrival 7:20 AM
            </span>
          </div>

          <Link
            to="/resident/track"
            className="mt-8 inline-flex rounded-md bg-brand-accent px-7 py-3 text-sm font-semibold text-brand-dark transition hover:opacity-90"
          >
            Track Truck →
          </Link>
        </section>

        {/* Lower Dashboard */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <section className="min-h-64 rounded-xl border border-gray-200 bg-white px-7 py-6">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Recent Activity
              </h2>

              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-700">
                PENDING
              </span>
            </div>

            <div className="mt-8">
              <p className="text-base font-semibold text-blue-600">
                Sent Report / Requested Message Preview...
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Sent on June 16 · 10:00 PM
              </p>
            </div>

            <button
              type="button"
              className="mt-10 rounded-md bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View
            </button>
          </section>

          {/* Locations */}
          <div className="space-y-4">
            {/* Your Location */}
            <section className="flex min-h-32 items-center justify-between rounded-xl border border-gray-200 bg-white px-7 py-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Your Location
                </h2>

                <p className="mt-2 max-w-[360px] text-sm leading-5 text-gray-400">
                  Address Line, Barangay, City/Municipality, and Province
                </p>
              </div>

              <button
                type="button"
                className="shrink-0 rounded-md bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Change
              </button>
            </section>

            {/* Truck Location */}
            <section className="min-h-32 rounded-xl border border-gray-200 bg-white px-7 py-6">
              <h2 className="text-lg font-bold text-gray-800">
                Truck Location
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Address Line, Barangay, City/Municipality, and Province
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}