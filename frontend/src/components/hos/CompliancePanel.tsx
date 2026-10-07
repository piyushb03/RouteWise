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
    <section id="compliance-panel-section" className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-soft-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Compliance Audit & Regulatory Rationale
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            18-point automated compliance verification executed independently over the trip timeline.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs">
            {validation.passed_checks_count} / {validation.passed_checks_count + validation.failed_checks_count} Audits Passed
          </span>
        </div>
      </div>

      {/* Grid: Compliance Audits & Why Stops Exist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Left: 18-point Audit List */}
        <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Automated Audit Checks</span>
          </h4>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {validation.passed_checks.map((chk, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs py-1 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{chk}</span>
              </div>
            ))}

            {validation.failed_checks.map((fail, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs py-1 text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{fail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Why Every Inserted Stop Exists */}
        <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Why Inserted Stops Exist ({insertedStops.length})</span>
          </h4>

          {insertedStops.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No intermediate rest or fuel stops required for this route distance and duration.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {insertedStops.map((stop) => (
                <div key={stop.stop_id} className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{stop.title}</span>
                    <span className="font-mono text-slate-600 text-[11px] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                      Mile {stop.route_mile.toFixed(1)} • {stop.duration_hours.toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <span className="text-slate-900 font-semibold">Justification:</span> {stop.reason}
                  </p>
                  {stop.city && stop.state && (
                    <span className="text-[10px] text-slate-400 font-mono block">
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
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Core Assessment Assumptions (FMCSA April 2022 Reference)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs pt-1">
          {Object.entries(assumptions).map(([key, val]) => (
            <div key={key} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-800 font-semibold text-xs mt-0.5 block">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="flex items-start space-x-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>{disclaimer}</span>
      </div>
    </section>
  );
};
