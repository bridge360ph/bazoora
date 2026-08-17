import { useEffect, useState } from "react";
import {
  Map,
  Marker,
  Source,
  Layer,
} from "react-map-gl/mapbox";


const destination = {
  name: "Sitio Malakas",
  lat: 14.3845,
  lng: 120.8850,
};


// temporary driver starting location
const startPoint = {
  lat: 14.3785,
  lng: 120.8780,
};


export function CompletedRouteMap() {

  const [route, setRoute] = useState<
    number[][] | null
  >(null);


  useEffect(() => {

    const fetchRoute = async () => {

      const token =
        import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;


      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${startPoint.lng},${startPoint.lat};` +
        `${destination.lng},${destination.lat}` +
        `?geometries=geojson&access_token=${token}`;


      const response = await fetch(url);

      const data = await response.json();


      if (data.routes?.length) {

        setRoute(
          data.routes[0]
            .geometry
            .coordinates
        );

      }

    };


    void fetchRoute();

  }, []);



  return (

    <div className="h-[320px] overflow-hidden rounded-xl">

      <Map
        mapboxAccessToken={
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
        }

        initialViewState={{
          longitude: destination.lng,
          latitude: destination.lat,
          zoom: 15,
        }}

        mapStyle="mapbox://styles/mapbox/streets-v12"
      >


        {/* Driver Start Marker */}

        <Marker
          longitude={startPoint.lng}
          latitude={startPoint.lat}
        >

          <div className="
            flex h-8 w-8 items-center
            justify-center rounded-full
            bg-blue-600 text-white
            text-xs font-bold
          ">
            🚚
          </div>

        </Marker>



        {/* Collection Point */}

        <Marker
          longitude={destination.lng}
          latitude={destination.lat}
        >

          <div className="
            flex h-8 w-8 items-center
            justify-center rounded-full
            bg-emerald-600
            text-white
            text-xs
            font-bold
          ">
            1
          </div>

        </Marker>



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