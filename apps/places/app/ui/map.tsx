import MapboxGL, { Map } from 'mapbox-gl';
import React, { useEffect, useRef } from 'react';

MapboxGL.accessToken =
  'pk.eyJ1IjoiY2FsZWItdSIsImEiOiJjazJzYnFncXYwajAwM2RtbmtmZmM0bHJrIn0.LV7Viq5XrB_fCzW89QbTKw';

export interface MapboxProps {
  lng: number;
  lat: number;
  zoom: number;
  style: 'mapbox://styles/mapbox/streets-v11';
  showMarker?: boolean;
}
export function Mapbox({
  lng,
  lat,
  zoom,
  style,
  showMarker = false,
}: MapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    const m = new MapboxGL.Map({
      container: mapContainer.current,
      center: [lng, lat],
      style,
      zoom,
    });
    if (showMarker) {
      new MapboxGL.Marker().setLngLat([lng, lat]).addTo(m);
    }
    map.current = m;
  });

  return <div ref={mapContainer} className="map-container" />;
}
