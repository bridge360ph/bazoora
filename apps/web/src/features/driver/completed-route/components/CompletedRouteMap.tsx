import { useEffect, useState } from "react";
import { Layer, Map, Marker, Source } from "react-map-gl/mapbox";

type CompletedStop = {
  name: string;
  lat: number;
  lng: number;
};

interface Props {
  stop: CompletedStop;
}

interface RouteGeometry {
  coordinates?: number[][];
}

interface Route {
  geometry?: RouteGeometry;
}

interface RouteResponse {
  routes?: Route[];
}

const startPoint = {
  lat: 14.3785,
  lng: 120.878,
};

const MAPBOX_TOKEN: string =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

export function CompletedRouteMap({ stop }: Props) {
  const [route, setRoute] = useState<number[][] | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!MAPBOX_TOKEN) {
        console.warn("Mapbox access token is missing.");
        return;
      }

      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${startPoint.lng},${startPoint.lat};` +
        `${stop.lng},${stop.lat}` +
        `?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Mapbox request failed: ${response.status}`,
          );
        }

        const data: RouteResponse =
          (await response.json()) as RouteResponse;

        const coordinates =
          data.routes?.[0]?.geometry?.coordinates;

        if (coordinates) {
          setRoute(coordinates);
        } else {
          setRoute(null);
        }
      } catch (error) {
        console.error("Failed to fetch completed route:", error);
        setRoute(null);
      }
    };

    void fetchRoute();
  }, [stop.lat, stop.lng]);

  return (
    <div className="h-[320px] overflow-hidden rounded-xl">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: stop.lng,
          latitude: stop.lat,
          zoom: 15,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Driver Start */}
        <Marker
          longitude={startPoint.lng}
          latitude={startPoint.lat}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            🚚
          </div>
        </Marker>

        {/* Completed Collection Point */}
        <Marker
          longitude={stop.lng}
          latitude={stop.lat}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            1
          </div>
        </Marker>

        {/* Completed Route */}
        {route && (
          <Source
            id="completed-route"
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: route,
              },
            }}
          >
            <Layer
              id="completed-route-line"
              type="line"
              paint={{
                "line-width": 5,
                "line-opacity": 0.8,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}

export default CompletedRouteMap;