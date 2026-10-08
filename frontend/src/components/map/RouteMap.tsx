import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Stop, RouteData } from '../../types/trip';
import { MapPin, Clock, Fuel, Bed, Maximize2, Minimize2, LocateFixed } from 'lucide-react';

interface RouteMapProps {
  route: RouteData;
  stops: Stop[];
}

// Helper to auto-fit map view to the polyline bounding box
const FitBounds: React.FC<{ coordinates: [number, number][]; triggerFit?: number }> = ({
  coordinates,
  triggerFit,
}) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map((c) => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [coordinates, triggerFit, map]);

  return null;
};

// Helper to fly to a selected stop when clicked from the list
const FlyToStop: React.FC<{ targetLocation: [number, number] | null }> = ({ targetLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 12, { duration: 1.2 });
    }
  }, [targetLocation, map]);

  return null;
};

// Invalidate container size when fullscreen changes to prevent grey or missing tiles
const MapInvalidateHandler: React.FC<{ isFullscreen: boolean }> = ({ isFullscreen }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen, map]);

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
const createMarkerIcon = (type: string, isSelected: boolean = false) => {
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

  const ringStyle = isSelected ? 'ring-4 ring-sky-400 ring-offset-2 scale-125 z-50' : '';

  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full ${bgClass} border-2 ${borderClass} shadow-xl flex items-center justify-center text-xs text-white font-bold transition-all duration-200 hover:scale-125 cursor-pointer ${ringStyle}">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const RouteMap: React.FC<RouteMapProps> = ({ route, stops }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);

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

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleSelectStop = (stop: Stop) => {
    setSelectedStopId(stop.stop_id);
    setTargetLocation([stop.latitude, stop.longitude]);
  };

  const handleResetView = () => {
    setSelectedStopId(null);
    setTargetLocation(null);
    setFitTrigger((prev) => prev + 1);
  };

  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Render the Map element
  const renderMap = (inFullscreen: boolean) => (
    <div className={`relative w-full h-full flex flex-col ${inFullscreen ? 'bg-slate-900' : ''}`}>
      {/* Interactive Controls Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-2">
        {/* Fit Route Button */}
        <button
          type="button"
          onClick={handleResetView}
          className="bg-white/95 hover:bg-white text-slate-800 px-3 py-2 rounded-xl shadow-md border border-slate-200 transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5 text-xs font-semibold backdrop-blur-sm"
          title="Fit Route to Center"
        >
          <LocateFixed className="w-4 h-4 text-sky-600" />
          <span className="hidden sm:inline">Fit Route</span>
        </button>

        {/* Maximize / Minimize Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!inFullscreen)}
          className="bg-slate-900/90 hover:bg-slate-900 text-white px-3 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5 text-xs font-semibold backdrop-blur-sm"
          title={inFullscreen ? 'Exit Fullscreen (Esc)' : 'Maximize Map Window'}
        >
          {inFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-sky-400" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-sky-400" />
              <span>Maximize Map</span>
            </>
          )}
        </button>
      </div>

      {/* Map Hint / Status Chip */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-2xs flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{stops.length} Planned Waypoints Plotted</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={inFullscreen}
        className="h-full w-full flex-1 rounded-2xl"
      >
        <TileLayer key={tileUrl} attribution={tileAttr} url={tileUrl} />

        <FitBounds coordinates={coordinates} triggerFit={fitTrigger} />
        <FlyToStop targetLocation={targetLocation} />
        <MapInvalidateHandler isFullscreen={isFullscreen} />

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
            icon={createMarkerIcon(stop.type, selectedStopId === stop.stop_id)}
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
  );

  return (
    <>
      <section id="map-section" className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 lg:p-7 shadow-soft-sm space-y-5">
        {/* Header with Title and Overall Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100">
                <MapPin className="w-5 h-5" />
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Interstate Route Navigation
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Continuous highway routing geometry calculated via OSRM turn-by-turn road data.
              Mandatory FMCSA 30-minute rest breaks, 10-hour sleeper resets, and ≤1,000-mile fuel stops are automatically scheduled along the path.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <span className="font-mono text-xs sm:text-sm font-black text-slate-900 bg-slate-50 border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-2xs">
              {totalMiles > 0 ? totalMiles.toFixed(1) : '—'} <span className="text-xs font-normal text-slate-500">total miles</span>
            </span>
          </div>
        </div>

        {/* Route Details & Waypoints Cards (Placed ABOVE the map in a 2-card grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Route Corridor & Interventions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Route Corridor</span>
              <span className="font-mono text-slate-900 font-extrabold text-xs">
                {totalMiles > 0 ? totalMiles.toFixed(1) : '—'} mi
              </span>
            </div>

            <div className="space-y-2 text-xs">
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
              <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                  <Fuel className="w-3 h-3 text-amber-600" />
                  <span>Fuel</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{fuelStopsCount}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-600" />
                  <span>30m Rest</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{restBreaksCount}</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                  <Bed className="w-3 h-3 text-indigo-600" />
                  <span>10h Reset</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{resetsCount}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Waypoints Sequence & Legend */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                Waypoints Sequence ({stops.length})
              </span>
              <span className="text-[11px] text-sky-600 font-medium">
                Click stop to fly on map
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-2 bg-white shadow-2xs">
              {stops.map((stop) => {
                const isSelected = selectedStopId === stop.stop_id;
                return (
                  <button
                    key={stop.stop_id}
                    type="button"
                    onClick={() => handleSelectStop(stop)}
                    className={`w-full text-left pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1.5 px-2 rounded-xl transition cursor-pointer ${
                      isSelected ? 'bg-sky-50 border border-sky-200 shadow-2xs' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-base shrink-0">{getStopEmoji(stop.type)}</span>
                      <div className="min-w-0">
                        <div className={`font-semibold truncate ${isSelected ? 'text-sky-900 font-bold' : 'text-slate-900'}`}>
                          {stop.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {stop.city && stop.state ? `${stop.city}, ${stop.state}` : 'En route'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        isSelected ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        Mile {stop.route_mile.toFixed(0)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Marker Legend */}
            <div className="pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-700 font-medium">
              <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Start</span>
              </span>
              <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Pickup</span>
              </span>
              <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Dropoff</span>
              </span>
              <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Fuel</span>
              </span>
              <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>30m Break</span>
              </span>
              <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>10h Reset</span>
              </span>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH TALL INTERACTIVE MAP (Placed BELOW route details) */}
        <div className="w-full h-[520px] sm:h-[620px] lg:h-[720px] min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative flex flex-col">
          {renderMap(false)}
        </div>
      </section>

      {/* FULLSCREEN MAP MODAL */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Fullscreen Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center space-x-3">
              <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <div className="font-bold text-sm sm:text-base flex items-center space-x-2">
                  <span>{route.leg1?.origin?.name || 'Origin'}</span>
                  <span className="text-slate-500">→</span>
                  <span>{route.leg2?.destination?.name || 'Destination'}</span>
                  <span className="text-xs font-mono font-normal text-sky-400">({totalMiles.toFixed(1)} mi)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Full Maximized Route View • {stops.length} Planned Stops Scheduled
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetView}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <LocateFixed className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Fit Route</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-soft-sm"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Exit Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Map Body */}
          <div className="flex-1 w-full h-full relative">
            {renderMap(true)}
          </div>
        </div>
      )}
    </>
  );
};
