import React, { useState } from 'react';
import { DailyLog } from '../../types/trip';
import { DailyLogSVG } from './DailyLogSVG';
import { FileText, Printer, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DailyLogViewerProps {
  logs: DailyLog[];
}

export const DailyLogViewer: React.FC<DailyLogViewerProps> = ({ logs }) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isPrintAllMode, setIsPrintAllMode] = useState(false);

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
    <section id="logs-section" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-sm dark:shadow-dark-md space-y-6 transition-colors">
      {/* Top Header & Day Navigation Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/80">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">FMCSA 24-Hour Driver Daily Log Sheets</h3>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              {logs.length} {logs.length === 1 ? 'Sheet' : 'Sheets'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Exact vector SVG grid drawings with 24.0-hour totals and status transitions. Letter landscape ready.
          </p>
        </div>

        {/* Action Buttons: Print & Download */}
        <div className="no-print flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 px-1 font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrintCurrent}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Print Sheet (Day {currentLog.day_number})</span>
          </button>

          {logs.length > 1 && (
            <button
              onClick={handlePrintAll}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-soft-sm transition"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-200" />
              <span>Print All ({logs.length} Days)</span>
            </button>
          )}

          <button
            onClick={handlePrintCurrent}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-soft-sm transition"
            title="Export as vector PDF via system print dialog"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Day Selector Tabs (if multi-day trip) */}
      {logs.length > 1 && (
        <div className="no-print flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            {logs.map((lg, idx) => (
              <button
                key={lg.day_number}
                onClick={() => setActiveDayIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  activeDayIdx === idx
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-soft-sm border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
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
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={activeDayIdx === logs.length - 1}
              onClick={() => setActiveDayIdx((i) => Math.min(logs.length - 1, i + 1))}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen Log Viewer Preview Area */}
      <div className="no-print overflow-x-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/70 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 flex justify-center shadow-inner">
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

      {/* Dedicated Print Container (Hidden on screen, rendered during @media print) */}
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
