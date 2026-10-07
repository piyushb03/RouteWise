import React, { useState } from 'react';
import { TimelineEvent, DutyStatus } from '../../types/trip';
import { Calendar, ChevronDown, ChevronUp, MapPin, Clock, Fuel, Bed, RotateCcw, Package, CheckCircle } from 'lucide-react';

interface TripTimelineProps {
  timeline: TimelineEvent[];
}

const getDutyStatusBadge = (status: DutyStatus) => {
  switch (status) {
    case 'DRIVING':
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">DRIVING</span>;
    case 'ON_DUTY_NOT_DRIVING':
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">ON DUTY (ND)</span>;
    case 'OFF_DUTY':
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">OFF DUTY</span>;
    case 'SLEEPER_BERTH':
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">SLEEPER</span>;
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'DRIVING':
      return <MapPin className="w-4 h-4 text-sky-600" />;
    case 'PICKUP':
    case 'DROPOFF':
      return <Package className="w-4 h-4 text-amber-600" />;
    case 'FUEL':
      return <Fuel className="w-4 h-4 text-amber-600" />;
    case 'REST_30':
      return <Clock className="w-4 h-4 text-cyan-600" />;
    case 'REST_10':
      return <Bed className="w-4 h-4 text-indigo-600" />;
    case 'RESTART_34':
      return <RotateCcw className="w-4 h-4 text-rose-600" />;
    case 'TRIP_COMPLETE':
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    default:
      return <Clock className="w-4 h-4 text-slate-500" />;
  }
};

export const TripTimeline: React.FC<TripTimelineProps> = ({ timeline }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section id="timeline-section" className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-soft-sm space-y-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sequential Trip Timeline
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological progression of every driving slice, fuel stop, rest break, and reset.
          </p>
        </div>

        <button
          className="text-slate-600 hover:text-slate-900 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition active:scale-95 cursor-pointer"
          aria-label={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="pt-4 relative before:absolute before:left-5 sm:before:left-6 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200">
          <div className="space-y-4">
            {timeline.map((event, idx) => {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);

              return (
                <div
                  key={event.event_id || idx}
                  className="relative pl-12 sm:pl-14 py-2 hover:bg-slate-50/80 rounded-2xl p-2.5 transition"
                >
                  {/* Spine Icon Node */}
                  <div className="absolute left-2.5 sm:left-3.5 top-3 w-7 h-7 rounded-full bg-white border-2 border-slate-300 shadow-2xs flex items-center justify-center shrink-0 z-10">
                    {getActivityIcon(event.activity_type)}
                  </div>

                  {/* Event Content Container */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    {/* Time & Title */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {event.duration_hours > 0 && (
                            <span className="text-slate-400 font-normal text-xs">
                              {' '}→ {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        {getDutyStatusBadge(event.status)}
                      </div>

                      <div className="font-bold text-slate-900 text-sm">
                        {event.reason || event.activity_type}
                      </div>

                      <div className="text-slate-500 text-xs truncate">
                        {event.start_location} {event.start_location !== event.end_location && `→ ${event.end_location}`}
                      </div>

                      {event.notes && (
                        <div className="text-[11px] text-slate-400 italic">
                          {event.notes}
                        </div>
                      )}
                    </div>

                    {/* Mileage and Duration Pills */}
                    <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                      {event.status === 'DRIVING' && (
                        <div className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl font-bold text-[11px]">
                          {(event.end_mile - event.start_mile).toFixed(1)} mi
                        </div>
                      )}

                      <div className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 font-bold text-xs shadow-2xs">
                        {event.duration_hours > 0 ? `${event.duration_hours.toFixed(2)}h` : 'Complete'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
