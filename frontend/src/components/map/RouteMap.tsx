import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Stop, RouteData } from '../../types/trip';
import { MapPin, Clock, Fuel, Bed, Navigation } from 'lucide-react';

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
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [coordinates, map]);

  return null;
};

// Stop emoji indicator helper
const getStopEmoji = (type: string) => {
  switch (type) {
    case 'START':
      return '🏁';
    case 'PICKUP':
      return '📦';
    case 'DROPOFF':
      return '🎯';
    case 'FUEL':
      return '⛽';
    case 'REST_30':
      return '☕';
    case 'REST_10':
      return '🌙';
    case 'RESTART_34':
      return '🔄';
    default:
      return '📍';
  }
};

// Create custom SVG Leaflet divIcons
const createMarkerIcon = (type: string) => {
  let bgClass = 'bg-sky-500';
  let borderClass = 'border-sky-300';
  const iconSvg = getStopEmoji(type);

  switch (type) {
    case 'START':
      bgClass = 'bg-emerald-600';
      borderClass = 'border-emerald-300';
      break;
    case 'PICKUP':
      bgClass = 'bg-blue-600';
      borderClass = 'border-blue-300';
      break;
    case 'DROPOFF':
      bgClass = 'bg-purple-600';
      borderClass = 'border-purple-300';
      break;
    case 'FUEL':
      bgClass = 'bg-amber-500';
      borderClass = 'border-amber-200';
      break;
    case 'REST_30':
      bgClass = 'bg-cyan-500';
      borderClass = 'border-cyan-200';
      break;
    case 'REST_10':
      bgClass = 'bg-indigo-600';
      borderClass = 'border-indigo-300';
      break;
    case 'RESTART_34':
      bgClass = 'bg-rose-600';
      borderClass = 'border-rose-300';
      break;
    default:
      bgClass = 'bg-slate-600';
      borderClass = 'border-slate-300';
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
  const [mobileTab, setMobileTab] = useState<'map' | 'details'>('map');
  const coordinates = route.combined_coordinates;

  const center: [number, number] = useMemo(() => {
    if (coordinates.length > 0) {
      return coordinates[Math.floor(coordinates.length / 2)];
    }
    return [39.8283, -98.5795]; // Center of USA
  }, [coordinates]);

  const totalMiles = useMemo(() => {
    return (route.leg1?.distance_miles || 0) + (route.leg2?.distance_miles || 0);
  }, [route]);

  const fuelStopsCount = useMemo(() => stops.filter((s) => s.type === 'FUEL').length, [stops]);
  const restBreaksCount = useMemo(() => stops.filter((s) => s.type === 'REST_30').length, [stops]);
  const resetsCount = useMemo(() => stops.filter((s) => s.type === 'REST_10').length, [stops]);

  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <section id="map-section" className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-soft-sm">
      {/* Mobile-Only Segmented View Switcher */}
      <div className="lg:hidden flex p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
            mobileTab === 'map' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
          }`}
        >
          <MapPin className="w-4 h-4 text-sky-600" />
          <span>Interactive Map</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
            mobileTab === 'details' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
          }`}
        >
          <Navigation className="w-4 h-4 text-teal-600" />
          <span>Route & Stops ({stops.length})</span>
        </button>
      </div>

      {/* 2-Halves Layout on Desktop, Segmented or Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* LEFT SIDE: Text, Route Details, Stops List, & Legend */}
        <div className={`lg:col-span-5 flex flex-col justify-between space-y-5 ${mobileTab === 'details' ? 'block' : 'hidden lg:flex'}`}>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100">
                <MapPin className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Interstate Route Navigation
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Continuous highway routing geometry calculated via OSRM turn-by-turn road data.
              Mandatory FMCSA 30-minute rest breaks, 10-hour sleeper resets, and ≤1,000-mile fuel stops are automatically scheduled and plotted along the route path.
            </p>
          </div>

          {/* Route Corridor Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Route Corridor</span>
              <span className="font-mono text-slate-900 font-extrabold text-sm sm:text-base">
                {totalMiles > 0 ? totalMiles.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-500">mi</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">1. Origin</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {route.leg1?.origin?.name || 'Current Location'}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">2. Shipper (1h Loading)</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {route.leg1?.destination?.name || 'Pickup Location'}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">3. Receiver (1h Delivery)</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {route.leg2?.destination?.name || 'Dropoff Location'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                  <Fuel className="w-3 h-3 text-amber-600" />
                  <span>Fuel</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{fuelStopsCount}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-600" />
                  <span>30m Rest</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{restBreaksCount}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                  <Bed className="w-3 h-3 text-indigo-600" />
                  <span>10h Reset</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{resetsCount}</div>
              </div>
            </div>
          </div>

          {/* Sequential Stops Timeline List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                Waypoints Sequence ({stops.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click map marker for details
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-2.5 bg-white shadow-2xs">
              {stops.map((stop) => (
                <div
                  key={stop.stop_id}
                  className="pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1 hover:bg-slate-50 px-2 rounded-lg transition"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-base shrink-0">{getStopEmoji(stop.type)}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{stop.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {stop.city && stop.state ? `${stop.city}, ${stop.state}` : 'En route'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Mile {stop.route_mile.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Marker Legend
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 font-medium">
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Start</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Pickup</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Dropoff</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Fuel</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>30m Break</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>10h Reset</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>34h Restart</span>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Interactive Map */}
        <div className={`lg:col-span-7 h-[420px] sm:h-[500px] lg:h-full min-h-[420px] sm:min-h-[500px] lg:min-h-[640px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative flex flex-col ${mobileTab === 'map' ? 'block' : 'hidden lg:flex'}`}>
          <MapContainer center={center} zoom={6} scrollWheelZoom={true} className="h-full w-full flex-1">
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
                    opacity: 0.25,
                  }}
                />
                {/* Crisp inner line */}
                <Polyline
                  positions={coordinates}
                  pathOptions={{
                    color: '#0284c7',
                    weight: 3.5,
                    opacity: 1.0,
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

                    <p className="text-xs text-slate-600">
                      {stop.city && stop.state ? `${stop.city}, ${stop.state}` : 'En route'}
                    </p>

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
      </div>
    </section>
  );
};
