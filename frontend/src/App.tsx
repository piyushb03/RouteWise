import React, { useState } from 'react';
import { TripPlanResponse, Location, AdvancedTripSettings } from './types/trip';
import { planTrip } from './services/api';
import { useTheme } from './context/ThemeContext';
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
  const { theme } = useTheme();
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
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors selection:bg-slate-900 selection:text-white dark:selection:bg-sky-500 dark:selection:text-slate-950`}>
      {/* Navigation */}
      <Navbar hasResults={!!planResult} onScrollTo={handleScrollTo} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* Editorial Commercial Hero Section */}
        <section className="pt-2 pb-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/70 p-6 sm:p-10 shadow-soft-sm dark:shadow-dark-md relative overflow-hidden transition-colors">
            {/* Subtle background structural accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 dark:bg-sky-400/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              {/* Badge Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>FMCSA 49 CFR Part 395 Specification</span>
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>·</span>
                  <span>70h / 8-Day Property-Carrying Standard</span>
                </span>
              </div>

              {/* Editorial Title & Subtitle */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-8 space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                    Commercial CMV Route Planning &{' '}
                    <span className="text-sky-700 dark:text-sky-400 font-black">
                      FMCSA ELD Daily Log
                    </span>{' '}
                    Automation
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-normal">
                    RouteWise plans property-carrying truck trips, enforces mandatory 30-minute rest breaks after 8 hours of driving, schedules 10-hour off-duty resets at 11h/14h limits, inserts fuel stops every ≤1,000 miles, and renders official 24.0-hour vector SVG driver daily log sheets with continuous duty status graphing.
                  </p>
                </div>

                {/* Quick Call to Action / Scroll Trigger */}
                <div className="lg:col-span-4 flex lg:justify-end">
                  <button
                    type="button"
                    onClick={() => handleScrollTo('planner-form-section')}
                    className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-sky-600 text-white font-semibold text-xs tracking-wide shadow-soft-sm dark:shadow-dark-sm hover:bg-slate-800 dark:hover:bg-sky-500 transition active:scale-95"
                  >
                    <span>Configure Trip Waypoints</span>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>
              </div>

              {/* Logistics Telemetry Pillars */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>11h Driving Window</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Max 11.0h net movement per shift
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>14h Duty Window</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Consecutive span before 10h reset
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <Fuel className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Fueling Rules</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Mandatory stop every ≤1,000 mi
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Vector Daily Logs</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-soft-md dark:shadow-dark-md animate-fade-in transition-colors">
            <Loader2 className="w-8 h-8 text-slate-900 dark:text-sky-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Calculating Route Geometry & HOS Timeline
              </h3>
              <p className="text-xs font-mono text-slate-600 dark:text-sky-300 font-medium">
                {loadingStep}
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-5 max-w-3xl mx-auto flex items-start space-x-3 text-xs text-rose-800 dark:text-rose-200 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm">Trip Planning Notice</h4>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Results Sections (Rendered when planResult is available) */}
        {planResult && !isLoading && (
          <div className="space-y-10 animate-fade-in">
            {/* 1. HOS Summary Dashboard */}
            <HOSDashboard trip={planResult.trip} hos={planResult.hos_summary} />

            {/* 2. Interactive Route Map */}
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
