import React from 'react';
import { ValidationResult, Stop } from '../../types/trip';
import { ShieldCheck, CheckCircle2, AlertTriangle, Info, BookOpen, MapPin } from 'lucide-react';

interface CompliancePanelProps {
  validation: ValidationResult;
  stops: Stop[];
  assumptions: Record<string, string>;
  disclaimer: string;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  validation,
  stops,
  assumptions,
  disclaimer,
}) => {
  // Filter inserted operational stops (excluding start, pickup, dropoff)
  const insertedStops = stops.filter((s) => ['FUEL', 'REST_30', 'REST_10', 'RESTART_34'].includes(s.type));

  return (
    <section id="compliance-panel-section" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-sm dark:shadow-dark-md space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/80">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Independent Compliance Audit & Regulatory Rationale
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            18-point automated compliance verification executed independently over the trip timeline.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-full shadow-2xs">
            {validation.passed_checks_count} / {validation.passed_checks_count + validation.failed_checks_count} Audits Passed
          </span>
        </div>
      </div>

      {/* Grid: Compliance Audits & Why Stops Exist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 18-point Audit List */}
        <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Automated Audit Checks</span>
          </h4>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2">
            {validation.passed_checks.map((chk, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs py-1 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{chk}</span>
              </div>
            ))}

            {validation.failed_checks.map((fail, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs py-1 text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{fail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Why Every Inserted Stop Exists */}
        <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Why Inserted Stops Exist ({insertedStops.length})</span>
          </h4>

          {insertedStops.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
              No intermediate rest or fuel stops required for this route distance and duration.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {insertedStops.map((stop) => (
                <div key={stop.stop_id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{stop.title}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      Mile {stop.route_mile.toFixed(1)} • {stop.duration_hours.toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    <span className="text-slate-900 dark:text-slate-200 font-medium">Justification:</span> {stop.reason}
                  </p>
                  {stop.city && stop.state && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                      Location: {stop.city}, {stop.state} (approximate on route)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Assumptions Table */}
      <div className="bg-slate-50/70 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Core Assessment Assumptions (FMCSA April 2022 Reference)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
          {Object.entries(assumptions).map(([key, val]) => (
            <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium text-xs mt-0.5 block">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="flex items-start space-x-2.5 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
        <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <span>{disclaimer}</span>
      </div>
    </section>
  );
};
