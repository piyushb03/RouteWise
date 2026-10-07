import React, { useState, useEffect } from 'react';
import { DailyLog } from '../../types/trip';
import { DailyLogSVG } from './DailyLogSVG';
import { FileText, Printer, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, MoveHorizontal } from 'lucide-react';

interface DailyLogViewerProps {
  logs: DailyLog[];
}

export const DailyLogViewer: React.FC<DailyLogViewerProps> = ({ logs }) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isPrintAllMode, setIsPrintAllMode] = useState(false);

  // Initialize mobile-friendly zoom level on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setZoomLevel(0.72);
    }
  }, []);

  if (!logs || logs.length === 0) return null;

  const currentLog = logs[activeDayIdx] || logs[0];

  const handlePrintCurrent = () => {
    setIsPrintAllMode(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintAll = () => {
    setIsPrintAllMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintAllMode(false);
    }, 100);
  };

  return (
    <section id="logs-section" className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-soft-sm space-y-5 sm:space-y-6">
      {/* Top Header & Day Navigation Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">FMCSA 24-Hour Daily Log Sheets</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {logs.length} {logs.length === 1 ? 'Sheet' : 'Sheets'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Exact vector SVG grid drawings with 24.0-hour totals and status transitions. Letter landscape ready.
          </p>
        </div>

        {/* Action Buttons: Desktop & Mobile responsive layouts */}
        {/* Desktop Toolbar */}
        <div className="no-print hidden sm:flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition active:scale-95 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-700 px-1.5 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition active:scale-95 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.72 : 1.0)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition active:scale-95 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrintCurrent}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition shadow-2xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Sheet (Day {currentLog.day_number})</span>
          </button>

          {logs.length > 1 && (
            <button
              onClick={handlePrintAll}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-soft-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-200" />
              <span>Print All ({logs.length} Days)</span>
            </button>
          )}

          <button
            onClick={handlePrintCurrent}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-soft-sm transition active:scale-95 cursor-pointer"
            title="Export as vector PDF via system print dialog"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Mobile Toolbar: Compact 2-column + Zoom Bar */}
        <div className="no-print sm:hidden space-y-2.5 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
                className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-200 transition active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-700 px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
                className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-200 transition active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(0.72)}
                className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-200 transition active:scale-95"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {logs.length > 1 && (
              <button
                onClick={handlePrintAll}
                className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl active:scale-95 transition"
              >
                Print All ({logs.length} Days)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrintCurrent}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Day {currentLog.day_number}</span>
            </button>
            <button
              onClick={handlePrintCurrent}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs (if multi-day trip) */}
      {logs.length > 1 && (
        <div className="no-print flex items-center justify-between bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            {logs.map((lg, idx) => (
              <button
                key={lg.day_number}
                onClick={() => setActiveDayIdx(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 active:scale-95 cursor-pointer ${
                  activeDayIdx === idx
                    ? 'bg-white text-slate-900 shadow-soft-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Day {lg.day_number}</span>
                <span className="font-mono text-[11px] opacity-75 font-normal">({lg.date_str})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              disabled={activeDayIdx === 0}
              onClick={() => setActiveDayIdx((i) => Math.max(0, i - 1))}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={activeDayIdx === logs.length - 1}
              onClick={() => setActiveDayIdx((i) => Math.min(logs.length - 1, i + 1))}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Swipe Hint Banner */}
      <div className="sm:hidden flex items-center justify-center space-x-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
        <MoveHorizontal className="w-3.5 h-3.5 text-sky-600" />
        <span>Swipe horizontally to inspect the full 24.0h grid</span>
      </div>

      {/* Screen Log Viewer Preview Area */}
      <div className="no-print overflow-x-auto p-2 sm:p-6 bg-slate-100/70 rounded-3xl border border-slate-200/90 flex justify-center shadow-inner mb-6 sm:mb-0">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
          }}
          className="w-full max-w-[1020px] transition-transform"
        >
          <DailyLogSVG log={currentLog} />
        </div>
      </div>

      {/* Dedicated Print Container */}
      <div className="log-print-container hidden print:block">
        {isPrintAllMode ? (
          logs.map((lg) => <DailyLogSVG key={lg.day_number} log={lg} />)
        ) : (
          <DailyLogSVG log={currentLog} />
        )}
      </div>
    </section>
  );
};
