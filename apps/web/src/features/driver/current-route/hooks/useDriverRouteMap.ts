import { useEffect, useMemo, useState } from "react";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";
import type { RouteStep } from "@/lib/routing";

type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "pending" | "active" | "completed";
};

interface DirectionsResponse {
  routes?: DirectionsRoute[];
}

interface DirectionsRoute {
  distance: number;
  duration: number;
  legs?: {
    steps: RouteStep[];
  }[];
}

interface UseDriverRouteMapProps {
  gpsPos: [number, number] | null;
  heading: number;
  stops: Stop[];
  isPlanning: boolean;
  isCollecting: boolean;
  routePath?: [number, number][];
}


export function useDriverRouteMap({
  gpsPos,
  heading,
  stops,
  isPlanning,
  isCollecting,
  routePath = [],
}: UseDriverRouteMapProps) {


  const [navigationSteps, setNavigationSteps] = useState<RouteStep[]>([]);

  const [routeSummary, setRouteSummary] = useState<
    | {
        distance: number;
        duration: number;
      }
    | undefined
  >(undefined);



  /* ---------------- MAP CENTER ---------------- */

  const mapCenter = useMemo<[number, number]>(() => {

    console.warn("HOOK GPS", gpsPos);
    
    if (
      gpsPos &&
      Number.isFinite(gpsPos[0]) &&
      Number.isFinite(gpsPos[1])
    ) {
      return gpsPos;
    }


    return [
      13.8248,
      121.3964
    ];

  }, [gpsPos]);


  /* ---------------- MARKERS ---------------- */

  const mapMarkers = useMemo<MapMarker[]>(() => {

    return [

      ...(gpsPos
        ? [
            {
              id: "truck-main",

              position: [
                gpsPos[0],
                gpsPos[1],
              ] as [number, number],

              label: "Current Location",

              icon: "truck" as const,

              pulse: isCollecting,

              heading,
            },
          ]
        : []),



      ...stops.map((stop) => ({

        id:`stop-${stop.id}`,

        position:[
          stop.lat,
          stop.lng,
        ] as [number,number],

        label:stop.name,


        icon:
          stop.status === "completed"
            ? ("done" as const)
            : ("pending" as const),


        pulse:
          stop.status === "active",

      })),
    ];

  },[
    gpsPos,
    stops,
    heading,
    isCollecting,
  ]);

  /* ---------------- ROUTE ---------------- */

  const mapRoutes = useMemo<MapRoute[]>(()=>{


    // use actual GPS route if available
    if(routePath.length > 1){

      return [
        {
          path: routePath,
          color:"blue",
          label:"Driver Route",
        },
      ];

    }

    if(!gpsPos || stops.length===0){
      return [];
    }

    return [
      {
        waypoints:[

          [
            gpsPos[1],
            gpsPos[0],
          ],

          ...stops.map(
            (stop)=>[
              stop.lng,
              stop.lat,
            ] as [number,number]
          ),

        ],

        color:"blue",
        label:"Driver Route",
      },
    ];


  },[
    gpsPos,
    stops,
    routePath,
  ]);

  /* ---------------- MAPBOX DIRECTIONS ---------------- */

    useEffect(()=>{

    async function loadRoute(){

      if(
        !gpsPos ||
        stops.length===0 ||
        isPlanning
      ){
        return;
      }

      try {

        const coords = [
          [
            gpsPos[1],
            gpsPos[0],
          ],

          ...stops.map(
            (s)=>[
              s.lng,
              s.lat,
            ]
          ),

        ]
        .map(
          (p)=>p.join(",")
        )
        .join(";");


        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?steps=true&geometries=geojson&overview=full&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
        );


        const data =
          (await response.json()) as DirectionsResponse;


        const route = data.routes?.[0];


        if(!route){
          return;
        }


        setRouteSummary({
          distance: route.distance,
          duration: route.duration,
        });


        const steps =
          route.legs?.flatMap(
            (leg)=>leg.steps
          ) ?? [];


        setNavigationSteps(steps);


      } catch(error){

        console.error(
          "Route loading failed:",
          error
        );

      }

    }


    void loadRoute();


  }, [
    gpsPos,
    stops,
    isPlanning,
  ]);

  return {
    mapCenter,
    mapMarkers,
    mapRoutes,
    navigationSteps,
    routeSummary,
  };
}