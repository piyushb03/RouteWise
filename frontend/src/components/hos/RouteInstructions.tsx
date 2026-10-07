import React, { useState } from 'react';
import { RouteStep } from '../../types/trip';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';

interface RouteInstructionsProps {
  steps: RouteStep[];
}

export const RouteInstructions: React.FC<RouteInstructionsProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group steps by leg if available
  const leg1Steps = steps.filter((s) => s.leg?.includes('Leg 1') || !s.leg);
  const leg2Steps = steps.filter((s) => s.leg?.includes('Leg 2'));

  return (
    <section id="instructions-section" className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft-sm space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
              <Compass className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Turn-by-Turn Driving Route Instructions
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detailed highway navigation maneuvers and route guidance ({steps.length} maneuvers).
          </p>
        </div>

        <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 transition">
          <span>{isExpanded ? 'Collapse' : 'Expand Instructions'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="pt-2 space-y-6 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">
          {/* Leg 1 Section */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Leg 1: Current Location → Pickup
            </h4>
            <div className="space-y-1.5">
              {leg1Steps.slice(0, 15).map((step, idx) => (
                <div key={idx} className="flex items-start justify-between text-xs py-2 px-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start space-x-2.5">
                    <span className="font-mono text-slate-400 font-semibold text-[11px] shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>
                    <span className="text-slate-800">{step.instruction}</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px] shrink-0 ml-4 font-medium">
                    {step.distance_miles.toFixed(1)} mi
                  </span>
                </div>
              ))}
              {leg1Steps.length > 15 && (
                <p className="text-[11px] text-slate-400 text-center italic py-1">
                  + {leg1Steps.length - 15} additional minor highway maneuvers
                </p>
              )}
            </div>
          </div>

          {/* Leg 2 Section */}
          {leg2Steps.length > 0 && (
            <div className="space-y-2 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Leg 2: Pickup Location → Dropoff
              </h4>
              <div className="space-y-1.5">
                {leg2Steps.slice(0, 15).map((step, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs py-2 px-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start space-x-2.5">
                      <span className="font-mono text-slate-400 font-semibold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="text-slate-800">{step.instruction}</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px] shrink-0 ml-4 font-medium">
                      {step.distance_miles.toFixed(1)} mi
                    </span>
                  </div>
                ))}
                {leg2Steps.length > 15 && (
                  <p className="text-[11px] text-slate-400 text-center italic py-1">
                    + {leg2Steps.length - 15} additional minor highway maneuvers
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
