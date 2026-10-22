import SmartMap from "@/components/map/smart-map";

import {
  useDriverRouteMap,
} from "../hooks/useDriverRouteMap";

import type { Stop } from "../types";

interface Props {
  gpsPos: [number, number] | null;
  heading: number;
  stops: Stop[];
  isPlanning: boolean;
  isCollecting: boolean;
  routePath?: [number, number][];
  locationPermissionGranted: boolean;
  onMarkComplete?: () => void;
  onReportIssue?: () => void;
}

export default function RouteMapSection({
  gpsPos,
  heading,
  stops,
  isPlanning,
  isCollecting,
  routePath = [],
  locationPermissionGranted,
  onMarkComplete,
  onReportIssue,
}: Props) {
  const {
    mapCenter,
    mapMarkers,
    mapRoutes,
    navigationSteps,
    routeSummary,
  } = useDriverRouteMap({
    gpsPos,
    heading,
    stops,
    isPlanning,
    isCollecting,
    routePath,
  });

  if (!locationPermissionGranted) {
    return (
      <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-[580px] lg:h-[740px]">
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-2xl">
              📍
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Location Access Required
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-5 text-slate-500">
            The route map is unavailable until you allow Bazoora to
            access your location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-[580px] lg:h-[740px]">
      <div className="relative h-full w-full">
        <SmartMap
          center={mapCenter}
          zoom={15}
          markers={mapMarkers}
          routes={mapRoutes}
          isCollecting={
            isCollecting
          }
          navigationSteps={
            navigationSteps
          }
          routeSummary={
            routeSummary
          }
          className="absolute inset-0 h-full w-full"
        />

        {/* SmartMap draws the map only, so the stop actions sit over it here
            rather than being passed in as props it does not accept. */}
        {(onMarkComplete || onReportIssue) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex justify-center gap-2 p-4">
            {onReportIssue && (
              <button
                type="button"
                onClick={onReportIssue}
                className="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur transition-colors hover:bg-white"
              >
                Report Issue
              </button>
            )}

            {onMarkComplete && (
              <button
                type="button"
                onClick={onMarkComplete}
                className="pointer-events-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-500"
              >
                Mark Complete
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

