import React from 'react';
import { Clock, Info, AlertCircle } from 'lucide-react';

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
    return 'bg-emerald-600';
  };

  const quickPresets = [
    { label: '0h (Fresh)', val: 0 },
    { label: '15h Used', val: 15 },
    { label: '35h (Mid)', val: 35 },
    { label: '55h Used', val: 55 },
    { label: '65h (Warning)', val: 65 },
  ];

  return (
    <div className="space-y-4 bg-slate-50/80 p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label htmlFor="cycle-hours-input" className="block text-xs font-bold text-slate-800 tracking-wide uppercase">
          Current 70/8 Cycle Used <span className="text-rose-500">*</span>
        </label>
        <span className="text-xs font-mono font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs inline-block self-start sm:self-auto">
          70.0 hrs / 8-day rolling limit
        </span>
      </div>

      {/* Quick Preset Pills for 1-Tap Setting on Mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1">Quick Sets:</span>
        {quickPresets.map((preset) => (
          <button
            key={preset.val}
            type="button"
            onClick={() => onChange(preset.val)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition active:scale-95 cursor-pointer text-xs ${
              value === preset.val
                ? 'bg-slate-900 text-white shadow-soft-sm font-semibold'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Number Input - 48px Touch Height */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <input
            id="cycle-hours-input"
            type="number"
            min="0"
            max="70"
            step="0.25"
            value={value}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 h-12 bg-white border border-slate-300 rounded-2xl text-base text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 transition shadow-2xs"
            placeholder="e.g. 15.5"
          />
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 font-semibold font-mono">
            hrs
          </span>
        </div>

        {/* Remaining Readout Box */}
        <div className="flex items-center justify-between px-4 h-12 bg-white rounded-2xl border border-slate-200 shadow-2xs text-xs">
          <span className="text-slate-500 font-medium">Cycle Remaining:</span>
          <span className={`font-mono font-black text-base ${remaining < 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {remaining.toFixed(2)} hrs
          </span>
        </div>
      </div>

      {/* Progress Bar & Range Slider */}
      <div className="space-y-2 pt-1">
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="70"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          aria-label="Cycle hours slider"
        />
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>0h (Fresh start)</span>
          <span className="font-semibold text-slate-800">
            {value.toFixed(1)}h Used ({percentage.toFixed(0)}%)
          </span>
          <span>70h (Limit)</span>
        </div>
      </div>

      {value >= 60 && (
        <div className="flex items-start space-x-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3.5 rounded-2xl shadow-2xs animate-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>Driver has under 10 hours available in cycle. A 34-hour restart may be scheduled to preserve compliance.</span>
        </div>
      )}

      {/* Spec Notice */}
      <div className="flex items-start space-x-2.5 text-[11px] text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
        <span className="leading-relaxed">
          The assessment provides aggregate cycle hours, not preceding 8 daily historical records. Exact rolling 8-day hour rollover therefore cannot be inferred from the supplied inputs.
        </span>
      </div>
    </div>
  );
};
