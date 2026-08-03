"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { useEffect, useState, useRef } from "react";
import { env } from "@/lib/env";

interface LocationPickerMapboxProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  defaultCenter?: [number, number]; // [lat, lng]
  defaultZoom?: number;
  className?: string;
}

export default function LocationPickerMapbox({
  value,
  onChange,
  defaultCenter = [14.1678, 121.2435], // Los Baños default
  defaultZoom = 15,
  className = "h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner",
}: LocationPickerMapboxProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Recenter map if value changes from outside (e.g. geocoding search or geolocation)
  useEffect(() => {
    if (isMounted && value && mapRef.current) {
      mapRef.current.flyTo({
        center: [value.lng, value.lat],
        duration: 800,
      });
    }
  }, [value?.lat, value?.lng, isMounted]);

  if (!isMounted) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-50`}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
          <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
            Loading map...
          </p>
        </div>
      </div>
    );
  }

  const centerLat = value?.lat ?? defaultCenter[0];
  const centerLng = value?.lng ?? defaultCenter[1];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: centerLat,
          longitude: centerLng,
          zoom: defaultZoom,
        }}
        onClick={(e: any) => {
          onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {value && (
          <Marker
            latitude={value.lat}
            longitude={value.lng}
            draggable
            onDragEnd={(e: any) => {
              onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
              <div className="absolute inset-0.5 flex items-center justify-center rounded-full border-2 border-white bg-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.5)]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 2.5 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
            </div>
          </Marker>
        )}
      </Map>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg bg-black/75 px-2.5 py-1.5 text-[10px] font-black tracking-wider text-white uppercase shadow-md">
        📍 Tap map or drag pin
      </div>
    </div>
  );
}
