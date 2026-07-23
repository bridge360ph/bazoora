import SmartMap from "@/components/map/smart-map";
import { useDriverRouteMap } from "../hooks/useDriverRouteMap";

type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "pending" | "active" | "completed";
};

interface Props {
  gpsPos: [number, number] | null;
  heading: number;
  stops: Stop[];
  isPlanning: boolean;
  isCollecting: boolean;
  routePath?: [number, number][];
}

export default function RouteMapSection({
  gpsPos,
  heading,
  stops,
  isPlanning,
  isCollecting,
  routePath = [],
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

  console.warn("RouteMapSection props", {
    gpsPos,
    heading,
    stops,
    isPlanning,
    isCollecting,
  });

  console.warn("Map Data", {
    mapCenter,
    mapMarkers,
    mapRoutes,
    navigationSteps,
    routeSummary,
  });

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden">

      <SmartMap
        center={mapCenter}
        markers={mapMarkers}
        routes={mapRoutes}
        isCollecting={isCollecting}

        // Navigation HUD
        navigationSteps={navigationSteps}
        routeSummary={routeSummary}
      />

    </div>
  );
}