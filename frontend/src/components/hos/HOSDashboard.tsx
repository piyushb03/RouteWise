import React from 'react';
import { TripSummary, HOSSummary } from '../../types/trip';
import { ShieldCheck, Clock, Navigation, AlertTriangle, Bed, Fuel, RotateCcw } from 'lucide-react';

interface HOSDashboardProps {
  trip: TripSummary;
  hos: HOSSummary;
}

export const HOSDashboard: React.FC<HOSDashboardProps> = ({ trip, hos }) => {
  const cyclePercent = Math.min(100, (hos.final_cycle_used / hos.cycle_limit) * 100);

  return (
    <section id="hos-dashboard-section" className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-soft-sm space-y-6">
      {/* Header and Compliance Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
              <Clock className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              HOS Compliance Dashboard
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time compliance clocks under FMCSA 70h/8d property-carrier rules.
          </p>
        </div>

        {/* Status Badge */}
        <div className={`px-4 py-2.5 rounded-2xl flex items-center space-x-3 border shadow-2xs self-stretch sm:self-auto ${
          hos.status_label === 'Compliant'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {hos.status_label === 'Compliant' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">{hos.status_label}</div>
            <div className="text-[11px] opacity-90">{hos.status_message}</div>
          </div>
        </div>
      </div>

      {/* 2026 Bento Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Trip Distance */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">Route Miles</span>
            <div className="p-1 rounded-lg bg-sky-100/80 text-sky-700 shrink-0">
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-slate-900">
            {trip.total_miles.toLocaleString()} <span className="text-xs font-normal text-slate-500">mi</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Leg 1: {trip.leg1_miles} mi • Leg 2: {trip.leg2_miles} mi
          </div>
        </div>

        {/* Metric 2: Driving Time */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">Base Driving</span>
            <div className="p-1 rounded-lg bg-teal-100/80 text-teal-700 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-teal-700">
            {trip.base_driving_formatted}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Net movement only
          </div>
        </div>

        {/* Metric 3: Total Elapsed Time */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">Total Elapsed</span>
            <div className="p-1 rounded-lg bg-indigo-100/80 text-indigo-700 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-indigo-700">
            {trip.total_elapsed_formatted}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Spans {trip.calendar_days_count} calendar {trip.calendar_days_count === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Metric 4: Planned Stops */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">Planned Stops</span>
            <div className="p-1 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-700">
            {trip.stops_count} <span className="text-xs font-normal text-slate-500">stops</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {hos.fuel_stops_count} Fuel • {hos.rest_30_breaks_count} Breaks • {hos.rest_10_resets_count} Resets
          </div>
        </div>
      </div>

      {/* Cycle Gauge & Stops Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* 70-Hour Cycle Monitor Card */}
        <div className="lg:col-span-2 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              70-Hour / 8-Day Active Cycle Clocks
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              Limit: 70.0 hrs
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Initial Used</div>
              <div className="text-base sm:text-lg font-mono font-bold text-slate-800">{hos.initial_cycle_used.toFixed(2)}h</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">End Cycle</div>
              <div className="text-base sm:text-lg font-mono font-bold text-sky-700">{hos.final_cycle_used.toFixed(2)}h</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Remaining</div>
              <div className="text-base sm:text-lg font-mono font-bold text-emerald-600">{hos.final_cycle_remaining.toFixed(2)}h</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-200/90 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  cyclePercent > 85 ? 'bg-rose-500' : cyclePercent > 60 ? 'bg-amber-500' : 'bg-sky-600'
                }`}
                style={{ width: `${cyclePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0h</span>
              <span className="font-semibold text-slate-700">{hos.final_cycle_used.toFixed(1)}h Used ({cyclePercent.toFixed(0)}%)</span>
              <span>70.0h</span>
            </div>
          </div>
        </div>

        {/* Scheduled HOS Interventions Card */}
        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Scheduled HOS Interventions
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="flex items-center space-x-2 text-amber-800 font-medium">
                <Fuel className="w-4 h-4 text-amber-600" />
                <span>Fuel Stops (≤1,000 mi)</span>
              </span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{hos.fuel_stops_count}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="flex items-center space-x-2 text-cyan-800 font-medium">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>30-min Breaks (after 8h)</span>
              </span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{hos.rest_30_breaks_count}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="flex items-center space-x-2 text-indigo-800 font-medium">
                <Bed className="w-4 h-4 text-indigo-600" />
                <span>10-hour Off-Duty Resets</span>
              </span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{hos.rest_10_resets_count}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="flex items-center space-x-2 text-rose-800 font-medium">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>34-hour Cycle Restarts</span>
              </span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{hos.restart_34_count}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
