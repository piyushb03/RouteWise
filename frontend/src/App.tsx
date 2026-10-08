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
import {
  Loader2,
  AlertCircle,
  Shield,
  Clock,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Route,
  Layers,
} from 'lucide-react';

type ResultTab = 'map' | 'logs' | 'timeline' | 'directions' | 'compliance';

export const App: React.FC = () => {
  const [planResult, setPlanResult] = useState<TripPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initiating trip calculation...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Center-focused results tabs
  const [activeTab, setActiveTab] = useState<ResultTab>('map');
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');

  const handleScrollTo = (elementId: string, targetTab?: string) => {
    if (targetTab && ['map', 'logs', 'timeline', 'directions', 'compliance'].includes(targetTab)) {
      setActiveTab(targetTab as ResultTab);
    }
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
      setActiveTab('map');

      // Smooth scroll to results
      setTimeout(() => {
        handleScrollTo('results-container');
      }, 150);
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
      <Navbar hasResults={!!planResult} onScrollTo={handleScrollTo} activeTab={activeTab} />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full space-y-6 sm:space-y-8">
        {/* Streamlined, Center-Focused Hero Banner */}
        <section className="pt-1">
          <div className="border border-slate-200/90 rounded-3xl bg-white/95 backdrop-blur-xl p-5 sm:p-7 shadow-soft-sm relative overflow-hidden text-center">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 left-10 w-64 h-64 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-3.5">
              {/* Live Spec Badge */}
              <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/90 text-slate-800 text-[11px] sm:text-xs font-semibold shadow-2xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>FMCSA 49 CFR Part 395 Specification</span>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <span className="text-slate-500 font-mono hidden sm:inline text-[11px]">70h/8d Standard</span>
              </div>

              {/* Centered High-Impact Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-snug sm:leading-tight">
                Interstate CMV Routing &{' '}
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FMCSA ELD Daily Log
                </span>{' '}
                Automation
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
                Automated commercial truck route planning with strict HOS adherence. Schedules mandatory 30-minute rest breaks, 10-hour sleeper resets, ≤1,000-mile fuel stops, and generates print-ready 24-hour vector SVG driver daily logs.
              </p>

              {/* Key Assurance Indicators */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>11h Drive / 14h Window</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Turn-by-Turn OSRM</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Vector SVG Logs</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>18/18 Regulatory Checks</span>
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
          <div id="results-container" className="space-y-5 sm:space-y-6 animate-fade-in">
            {/* 1. HOS Summary Dashboard Clocks */}
            <HOSDashboard trip={planResult.trip} hos={planResult.hos_summary} />

            {/* 2. Center-Focused Results Navigation Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Segmented Tab Controls */}
              <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-slate-900 text-white shadow-soft-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Route Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-slate-900 text-white shadow-soft-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Daily Logs ({planResult.daily_logs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-slate-900 text-white shadow-soft-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duty Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('directions')}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'directions'
                      ? 'bg-slate-900 text-white shadow-soft-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Route className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Turn-by-Turn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('compliance')}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'compliance'
                      ? 'bg-slate-900 text-white shadow-soft-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit (18)</span>
                </button>
              </div>

              {/* View Mode Toggle: Center-Focused vs All Sections */}
              <div className="hidden sm:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('focused')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                    viewMode === 'focused'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Focused View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                    viewMode === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>All Sections</span>
                </button>
              </div>
            </div>

            {/* 3. Center-Focused Content Area */}
            {viewMode === 'focused' ? (
              <div className="space-y-6">
                {activeTab === 'map' && (
                  <RouteMap route={planResult.route} stops={planResult.stops} />
                )}
                {activeTab === 'logs' && (
                  <DailyLogViewer logs={planResult.daily_logs} />
                )}
                {activeTab === 'timeline' && (
                  <TripTimeline timeline={planResult.timeline} />
                )}
                {activeTab === 'directions' && (
                  <RouteInstructions steps={planResult.route.instructions} />
                )}
                {activeTab === 'compliance' && (
                  <CompliancePanel
                    validation={planResult.validation}
                    stops={planResult.stops}
                    assumptions={planResult.assumptions}
                    disclaimer={planResult.disclaimer}
                  />
                )}
              </div>
            ) : (
              /* Continuous / All Sections Stack */
              <div className="space-y-6 sm:space-y-8">
                <RouteMap route={planResult.route} stops={planResult.stops} />
                <DailyLogViewer logs={planResult.daily_logs} />
                <TripTimeline timeline={planResult.timeline} />
                <RouteInstructions steps={planResult.route.instructions} />
                <CompliancePanel
                  validation={planResult.validation}
                  stops={planResult.stops}
                  assumptions={planResult.assumptions}
                  disclaimer={planResult.disclaimer}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
