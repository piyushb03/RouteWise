import React from 'react';
import { Clock, Info, AlertCircle, Sparkles, CheckCircle2, Minus, Plus } from 'lucide-react';

interface CycleHoursInputProps {
  value: number;
  onChange: (val: number) => void;
}

export const CycleHoursInput: React.FC<CycleHoursInputProps> = ({ value, onChange }) => {
  const maxCycle = 70.0;
  const remaining = Math.max(0, maxCycle - value);
  const percentage = Math.min(100, (value / maxCycle) * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      if (parsed < 0) onChange(0);
      else if (parsed > 70) onChange(70);
      else onChange(parsed);
    }
  };

  const getProgressColor = () => {
    if (percentage > 85) return 'bg-rose-500';
    if (percentage > 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const quickPresets = [
    { label: '0h Fresh', val: 0 },
    { label: '15h Normal', val: 15 },
    { label: '35h Mid', val: 35 },
    { label: '55h Heavy', val: 55 },
    { label: '65h Near Limit', val: 65 },
  ];

  return (
    <div className="bg-slate-50/80 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 sm:space-y-5">
      {/* Module Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <label htmlFor="cycle-hours-input" className="block text-xs sm:text-sm font-bold text-slate-900 tracking-normal cursor-pointer truncate">
                Driver 70-Hour / 8-Day Cycle
              </label>
              <span className="text-rose-500 font-bold shrink-0">*</span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal truncate hidden xs:block">
              Duty hours accumulated by driver in current 8-day rolling window
            </p>
          </div>
        </div>

        <span className="text-[10px] sm:text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs shrink-0">
          70.0h Limit
        </span>
      </div>

      {/* Main 2-Column Controls & Telemetry Readout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-center">
        
        {/* Left Column (7 Cols): Quick Sets + Precision Stepper + Slider */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
          {/* Quick Presets Bar with horizontal smooth scroll on mobile */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1 text-[11px] sm:text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Quick Cycle Presets:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Tap to load</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs -mx-0.5 px-0.5 flex-nowrap">
              {quickPresets.map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onChange(preset.val)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition active:scale-95 cursor-pointer text-xs shrink-0 ${
                    value === preset.val
                      ? 'bg-slate-900 text-white shadow-soft-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper & Numeric Input (Flex row - NO OVERLAPPING TEXT) */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, Math.round((value - 1) * 2) / 2))}
              className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Decrease by 1.0 hour"
              aria-label="Decrease cycle hours"
            >
              <Minus className="w-4 h-4 text-slate-600" />
            </button>

            <div className="flex-1 flex items-center justify-center bg-white border border-slate-300 rounded-xl h-10 sm:h-11 px-3 shadow-2xs focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/15 transition">
              <input
                id="cycle-hours-input"
                type="number"
                min="0"
                max="70"
                step="0.25"
                value={value}
                onChange={handleInputChange}
                className="w-20 sm:w-24 text-center text-base sm:text-lg text-slate-900 font-mono font-bold bg-transparent focus:outline-none"
                placeholder="0.0"
              />
              <span className="text-xs text-slate-500 font-semibold font-mono select-none shrink-0 pl-1">
                hrs used
              </span>
            </div>

            <button
              type="button"
              onClick={() => onChange(Math.min(70, Math.round((value + 1) * 2) / 2))}
              className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Increase by 1.0 hour"
              aria-label="Increase cycle hours"
            >
              <Plus className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Range Slider with Live Markers (Clean 1-line labels) */}
          <div className="space-y-1.5 pt-0.5">
            <input
              type="range"
              min="0"
              max="70"
              step="0.5"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              aria-label="Cycle hours slider"
            />
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-500 font-mono">
              <span className="shrink-0">0h Fresh</span>
              <span className="font-bold text-slate-800 text-center px-1 truncate">
                {value.toFixed(1)}h used ({percentage.toFixed(0)}%)
              </span>
              <span className="shrink-0">70h Limit</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Live Cycle Availability Dial Box */}
        <div className="lg:col-span-5 bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Available Drive Budget
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              remaining < 10
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {remaining < 10 ? 'Approaching Limit' : 'Ready to Dispatch'}
            </span>
          </div>

          {/* Large Availability Metric */}
          <div className="flex items-baseline space-x-1.5 sm:space-x-2">
            <span className={`text-2xl sm:text-3xl font-mono font-black ${
              remaining < 10 ? 'text-amber-600' : 'text-emerald-700'
            }`}>
              {remaining.toFixed(2)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500">hours remaining</span>
          </div>

          {/* Mini Percentage Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Automated Dispatch Insight */}
          <div className="flex items-start space-x-2 text-[10px] sm:text-[11px] text-slate-600 pt-0.5">
            <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
              remaining < 10 ? 'text-amber-500' : 'text-emerald-600'
            }`} />
            <p className="leading-tight">
              {remaining >= 11
                ? 'Full 11.0-hour net driving shift available before a 34-hour restart is required.'
                : 'Under 10.0 hours remaining in cycle. A 34-hour off-duty restart will be auto-scheduled if needed.'}
            </p>
          </div>
        </div>

      </div>

      {value >= 60 && (
        <div className="flex items-start space-x-2.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl sm:rounded-2xl shadow-2xs animate-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Critical HOS Notice:</strong> Driver has under 10 hours available in cycle. A 34-hour restart will be automatically scheduled during the trip to preserve 100% FMCSA compliance.
          </span>
        </div>
      )}

      {/* Regulatory Context Notice */}
      <div className="flex items-start space-x-2 text-[10px] sm:text-[11px] text-slate-500 bg-white/70 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200/70">
        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-sky-600 mt-0.5" />
        <span className="leading-relaxed">
          Operating under FMCSA §395.3(b) 70-hour / 8-day property-carrying CMV standard. Real-time driving and on-duty limits calculate continuously across state lines.
        </span>
      </div>
    </div>
  );
};
