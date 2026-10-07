import React, { useState } from 'react';
import { TripPlanResponse, Location, AdvancedTripSettings } from './types/trip';
import { planTrip } from './services/api';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { TripPlannerForm } from './components/trip/TripPlannerForm';
import { RouteMap } from './components/map/RouteMap';
import { HOSDashboard } from './components/hos/HOSDashboard';
import { TripTimeline } from './components/hos/TripTimeline';
import { RouteInstructions } from './components/hos/RouteInstructions';
import { CompliancePanel } from './components/hos/CompliancePanel';
import { DailyLogViewer } from './components/logs/DailyLogViewer';
import { Loader2, AlertCircle, Shield, Clock, Fuel, FileSpreadsheet, ArrowDown } from 'lucide-react';

export const App: React.FC = () => {
  const [planResult, setPlanResult] = useState<TripPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initiating trip calculation...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePlanTrip = async (data: {
    current: Location;
    pickup: Location;
    dropoff: Location;
    cycleUsed: number;
    startDate: string;
    startTime: string;
    timezone: string;
    advanced: AdvancedTripSettings;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Step sequence messages for rich feedback
    const steps = [
      'Validating route waypoints and geocodes...',
      'Calculating turn-by-turn road geometry with OSRM...',
      'Evaluating FMCSA 11h driving and 14h window limits...',
      'Scheduling 1,000-mile fuel stops & 30-minute breaks...',
      'Partitioning continuous timeline into midnight daily logs...',
      'Running 18-point independent compliance audit...',
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 450);

    try {
      const response = await planTrip({
        current_location: data.current,
        pickup_location: data.pickup,
        dropoff_location: data.dropoff,
        cycle_used_hours: data.cycleUsed,
        start_date: data.startDate,
        start_time: data.startTime,
        timezone: data.timezone,
        advanced: data.advanced,
      });

      clearInterval(stepTimer);
      setPlanResult(response);

      // Smooth scroll to results
      setTimeout(() => {
        handleScrollTo('hos-dashboard-section');
      }, 200);
    } catch (err: any) {
      clearInterval(stepTimer);
      console.error('Trip planning error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while planning the trip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-600 selection:text-white pb-36 sm:pb-16 md:pb-10">
      {/* Navigation */}
      <Navbar hasResults={!!planResult} onScrollTo={handleScrollTo} />

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 w-full space-y-8 sm:space-y-10">
        {/* Modern 2026 Bento Hero Section */}
        <section className="pt-1 pb-2">
          <div className="border border-slate-200/90 rounded-3xl bg-white p-5 sm:p-10 shadow-soft-sm relative overflow-hidden">
            {/* Ambient Lighting Accents */}
            <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-sky-400/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4 sm:space-y-6">
              {/* Live Badge Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100/90 text-slate-800 border border-slate-200 shadow-2xs">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>FMCSA Part 395 Compliant</span>
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-mono text-slate-500">
                  <span>·</span>
                  <span>70h / 8-Day Property-Carrying Standard</span>
                </span>
              </div>

              {/* Headline & CTA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-end">
                <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-snug sm:leading-tight">
                    Commercial CMV Route Planning &{' '}
                    <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      FMCSA ELD Daily Log
                    </span>{' '}
                    Automation
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                    Route<span className="text-sky-600 font-semibold">Wise</span> plans property-carrying truck trips, enforces mandatory 30-minute rest breaks after 8 hours of driving, schedules 10-hour off-duty resets at 11h/14h limits, inserts fuel stops every ≤1,000 miles, and renders official 24.0-hour vector SVG driver daily log sheets with continuous duty status graphing.
                  </p>
                </div>

                {/* Quick Call to Action button */}
                <div className="lg:col-span-4 flex lg:justify-end">
                  <button
                    type="button"
                    onClick={() => handleScrollTo('planner-form-section')}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-slate-900/10 hover:bg-slate-800 transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>Configure Trip Waypoints</span>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>
              </div>

              {/* 2026 Bento Telemetry Pillars */}
              <div className="pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                    <div className="p-1 rounded-lg bg-sky-100 text-sky-700">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px] sm:text-xs">11h Driving Window</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Max 11.0h net movement per shift
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                    <div className="p-1 rounded-lg bg-teal-100 text-teal-700">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px] sm:text-xs">14h Duty Window</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Consecutive span before 10h reset
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                    <div className="p-1 rounded-lg bg-amber-100 text-amber-700">
                      <Fuel className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px] sm:text-xs">Fueling Rules</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Mandatory stop every ≤1,000 mi
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                    <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[11px] sm:text-xs">Vector Daily Logs</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    24.0h partitioned SVG sheets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Input Form Section */}
        <TripPlannerForm onPlanTrip={handlePlanTrip} isLoading={isLoading} />

        {/* Loading Overlay / Progress Indicator */}
        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto shadow-soft-md animate-fade-in">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Calculating Route Geometry & HOS Timeline
              </h3>
              <p className="text-xs sm:text-sm font-mono text-slate-600 font-medium">
                {loadingStep}
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 max-w-3xl mx-auto flex items-start space-x-3 text-xs sm:text-sm text-rose-800 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-900 text-sm">Trip Planning Notice</h4>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Results Sections (Rendered when planResult is available) */}
        {planResult && !isLoading && (
          <div className="space-y-8 sm:space-y-10 animate-fade-in">
            {/* 1. HOS Summary Dashboard */}
            <HOSDashboard trip={planResult.trip} hos={planResult.hos_summary} />

            {/* 2. Interactive Route Map (2-Halves on Desktop, Mobile Optimized) */}
            <RouteMap route={planResult.route} stops={planResult.stops} />

            {/* 3. Daily Log Sheets (Plotted SVG Graph) */}
            <DailyLogViewer logs={planResult.daily_logs} />

            {/* 4. Sequential Trip Timeline */}
            <TripTimeline timeline={planResult.timeline} />

            {/* 5. Turn-by-Turn Driving Route Instructions */}
            <RouteInstructions steps={planResult.route.instructions} />

            {/* 6. Compliance Audit & Regulatory Rationale */}
            <CompliancePanel
              validation={planResult.validation}
              stops={planResult.stops}
              assumptions={planResult.assumptions}
              disclaimer={planResult.disclaimer}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
