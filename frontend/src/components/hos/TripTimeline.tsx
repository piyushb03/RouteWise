import React, { useState } from 'react';
import { TimelineEvent, DutyStatus } from '../../types/trip';
import { Calendar, ChevronDown, ChevronUp, MapPin, Clock, Fuel, Bed, RotateCcw, Package, CheckCircle } from 'lucide-react';

interface TripTimelineProps {
  timeline: TimelineEvent[];
}

const getDutyStatusBadge = (status: DutyStatus) => {
  switch (status) {
    case 'DRIVING':
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80">DRIVING</span>;
    case 'ON_DUTY_NOT_DRIVING':
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">ON DUTY (ND)</span>;
    case 'OFF_DUTY':
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">OFF DUTY</span>;
    case 'SLEEPER_BERTH':
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">SLEEPER</span>;
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'DRIVING':
      return <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    case 'PICKUP':
    case 'DROPOFF':
      return <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 'FUEL':
      return <Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 'REST_30':
      return <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    case 'REST_10':
      return <Bed className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    case 'RESTART_34':
      return <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    case 'TRIP_COMPLETE':
      return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
  }
};

export const TripTimeline: React.FC<TripTimelineProps> = ({ timeline }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section id="timeline-section" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-sm dark:shadow-dark-md space-y-4 transition-colors">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/80">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Trip Itinerary & Event Timeline
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Sequential chronological progression of every driving slice, fuel stop, rest break, and reset.
          </p>
        </div>

        <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="pt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {timeline.map((event, idx) => {
            const startDate = new Date(event.start_time);
            const endDate = new Date(event.end_time);

            return (
              <div key={event.event_id || idx} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-3 rounded-2xl transition">
                {/* Time & Activity Icon */}
                <div className="flex items-start sm:items-center space-x-3 min-w-[200px]">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {getActivityIcon(event.activity_type)}
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {event.duration_hours > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">
                          {' '}→ {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Event Details & Location */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{event.reason || event.activity_type}</span>
                    {getDutyStatusBadge(event.status)}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                    {event.start_location} {event.start_location !== event.end_location && `→ ${event.end_location}`}
                  </div>
                  {event.notes && <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5">{event.notes}</div>}
                </div>

                {/* Duration & Mileage Badges */}
                <div className="flex items-center space-x-3 shrink-0 sm:text-right">
                  {event.status === 'DRIVING' && (
                    <div className="text-right">
                      <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {(event.end_mile - event.start_mile).toFixed(1)} mi
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        Mile {event.start_mile.toFixed(0)} - {event.end_mile.toFixed(0)}
                      </div>
                    </div>
                  )}

                  <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                    {event.duration_hours > 0 ? `${event.duration_hours.toFixed(2)}h` : 'Complete'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
