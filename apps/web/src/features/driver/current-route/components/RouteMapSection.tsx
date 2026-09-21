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
          onMarkComplete={
            onMarkComplete
          }
          onReportIssue={
            onReportIssue
          }
        />
      </div>
    </section>
  );
}

