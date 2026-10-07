import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Stop, RouteData } from '../../types/trip';
import { MapPin } from 'lucide-react';

interface RouteMapProps {
  route: RouteData;
  stops: Stop[];
}

// Helper to auto-fit map view to the polyline bounding box
const FitBounds: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [coordinates, map]);

  return null;
};

// Create custom SVG Leaflet divIcons
const createMarkerIcon = (type: string) => {
  let bgClass = 'bg-sky-500';
  let borderClass = 'border-sky-300';
  let iconSvg = '';

  switch (type) {
    case 'START':
      bgClass = 'bg-emerald-600';
      borderClass = 'border-emerald-300';
      iconSvg = '🏁';
      break;
    case 'PICKUP':
      bgClass = 'bg-blue-600';
      borderClass = 'border-blue-300';
      iconSvg = '📦';
      break;
    case 'DROPOFF':
      bgClass = 'bg-purple-600';
      borderClass = 'border-purple-300';
      iconSvg = '🎯';
      break;
    case 'FUEL':
      bgClass = 'bg-amber-500';
      borderClass = 'border-amber-200';
      iconSvg = '⛽';
      break;
    case 'REST_30':
      bgClass = 'bg-cyan-500';
      borderClass = 'border-cyan-200';
      iconSvg = '☕';
      break;
    case 'REST_10':
      bgClass = 'bg-indigo-600';
      borderClass = 'border-indigo-300';
      iconSvg = '🌙';
      break;
    case 'RESTART_34':
      bgClass = 'bg-rose-600';
      borderClass = 'border-rose-300';
      iconSvg = '🔄';
      break;
    default:
      bgClass = 'bg-slate-600';
      borderClass = 'border-slate-300';
      iconSvg = '📍';
  }

  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full ${bgClass} border-2 ${borderClass} shadow-xl flex items-center justify-center text-xs text-white font-bold transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 cursor-pointer">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [0, 0],
    popupAnchor: [0, -20],
  });
};

export const RouteMap: React.FC<RouteMapProps> = ({ route, stops }) => {
  const coordinates = route.combined_coordinates;

  const center: [number, number] = useMemo(() => {
    if (coordinates.length > 0) {
      return coordinates[Math.floor(coordinates.length / 2)];
    }
    return [39.8283, -98.5795]; // Center of USA
  }, [coordinates]);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <section id="map-section" className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <MapPin className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Interactive Interstate Route Map
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualized route geometry with all inserted rest breaks, fuel stops, and daily resets.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-700 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>Start</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span>Pickup</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span>Dropoff</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>Fuel</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span><span>30m Break</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span>10h Reset</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span>34h Restart</span></span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative h-[460px] sm:h-[560px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <MapContainer center={center} zoom={6} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            key={tileUrl}
            attribution={tileAttr}
            url={tileUrl}
          />

          <FitBounds coordinates={coordinates} />

          {/* Route Polyline */}
          {coordinates.length > 0 && (
            <>
              {/* Outer halo */}
              <Polyline
                positions={coordinates}
                pathOptions={{
                  color: '#0284c7',
                  weight: 7,
                  opacity: 0.25
                }}
              />
              {/* Crisp inner line */}
              <Polyline
                positions={coordinates}
                pathOptions={{
                  color: '#0284c7',
                  weight: 3.5,
                  opacity: 1.0
                }}
              />
            </>
          )}

          {/* Stops Markers */}
          {stops.map((stop) => (
            <Marker
              key={stop.stop_id}
              position={[stop.latitude, stop.longitude]}
              icon={createMarkerIcon(stop.type)}
            >
              <Popup className="custom-popup">
                <div className="p-1 space-y-1.5 min-w-[220px] text-slate-900">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-xs uppercase text-slate-800">{stop.title}</span>
                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-600">
                      Mile {stop.route_mile.toFixed(1)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{stop.city && stop.state ? `${stop.city}, ${stop.state}` : 'En route'}</p>

                  <div className="text-[11px] space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-semibold text-slate-800">
                        {stop.duration_hours > 0 ? `${stop.duration_hours.toFixed(1)} hr` : 'Departure'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time:</span>
                      <span className="font-mono text-slate-700">
                        {new Date(stop.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    <span className="font-semibold">Reason:</span> {stop.reason}
                  </p>

                  {stop.is_approximate && (
                    <span className="text-[10px] italic text-amber-700 block">
                      *Planned stop location — approximate.
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
};
