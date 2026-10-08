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
import { Loader2, AlertCircle, Shield, Clock, Fuel, FileSpreadsheet, ArrowDown, Truck, Sparkles, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
        {/* Modern 2026 SaaS Hero Section */}
        <section className="pt-1 pb-3 sm:pb-4">
          <div className="border border-slate-200/90 rounded-3xl bg-white/95 backdrop-blur-xl p-4 sm:p-8 lg:p-10 shadow-soft-md relative overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 left-10 w-60 sm:w-80 h-60 sm:h-80 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6 sm:space-y-10">
              {/* 2-Column Hero: Left Value Prop, Right Telemetry Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                
                {/* Left Column: Headlines, CTAs, Trust Elements */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                  {/* Live Spec Badge */}
                  <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-slate-800 text-[11px] sm:text-xs font-semibold shadow-2xs">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="sm:hidden">FMCSA Part 395 Standard</span>
                    <span className="hidden sm:inline">FMCSA 49 CFR Part 395 Specification</span>
                    <span className="text-slate-400 hidden sm:inline">|</span>
                    <span className="text-slate-500 font-mono hidden sm:inline text-[11px]">70h/8d Standard</span>
                  </div>

                  {/* High-Impact Headline */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-slate-900 leading-snug sm:leading-[1.12]">
                      Interstate CMV Routing &{' '}
                      <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        FMCSA ELD Daily Log
                      </span>{' '}
                      Automation
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
                      Automate commercial truck trip planning with precision HOS compliance. Schedules mandatory 30-minute rest breaks, 10-hour sleeper resets, fuel stops every ≤1,000 miles, and exports official 24-hour vector SVG driver daily log sheets.
                    </p>
                  </div>

                  {/* Primary & Secondary Call to Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleScrollTo('planner-form-section')}
                      className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide shadow-md shadow-slate-900/15 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-sky-400" />
                      <span>Configure Trip Waypoints</span>
                      <ArrowDown className="w-4 h-4 text-slate-400 animate-bounce" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScrollTo('planner-form-section')}
                      className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200/90 shadow-2xs hover:shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Instant 1-Click Samples</span>
                    </button>
                  </div>

                  {/* Key Assurance Indicators */}
                  <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>11h / 14h Shifting Rules</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>OSRM Highway Geometry</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Print-Ready Vector SVG</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Simulated Route Telemetry Card Showcase */}
                <div className="lg:col-span-5 relative">
                  {/* Subtle Background Glow Accent */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-sky-500/15 via-blue-500/10 to-indigo-500/15 rounded-3xl blur-xl pointer-events-none"></div>

                  {/* Showcase Card */}
                  <div className="relative bg-white border border-slate-200/90 rounded-3xl p-5 shadow-soft-md space-y-4 hover:shadow-soft-lg transition-all duration-300">
                    {/* Console Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                          CMV Telemetry Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        FMCSA Compliant
                      </span>
                    </div>

                    {/* Active Corridor Box */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Dallas, TX → Chicago, IL</span>
                        </span>
                        <span className="font-mono text-slate-700 font-bold text-xs">1,050.4 mi</span>
                      </div>

                      {/* Segment Progression Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div className="bg-sky-600 h-full" style={{ width: '42%' }} title="Leg 1 Drive"></div>
                        <div className="bg-amber-500 h-full" style={{ width: '12%' }} title="1h Shipper Load"></div>
                        <div className="bg-teal-500 h-full" style={{ width: '8%' }} title="30m Rest Break"></div>
                        <div className="bg-blue-600 h-full" style={{ width: '38%' }} title="Leg 2 Delivery"></div>
                      </div>

                      <div className="grid grid-cols-2 xs:flex xs:justify-between text-[10px] text-slate-500 font-medium font-mono gap-1">
                        <span>Leg 1: 95 mi</span>
                        <span>Load (1h)</span>
                        <span>Break (30m)</span>
                        <span>Leg 2: 955 mi</span>
                      </div>
                    </div>

                    {/* Live HOS Clocks Triplet */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                      <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block truncate">Drive Limit</span>
                        <span className="text-sm sm:text-base font-mono font-black text-teal-700">11.0h</span>
                        <span className="text-[8px] sm:text-[9px] text-emerald-700 font-semibold block truncate">Max shift</span>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block truncate">Duty Window</span>
                        <span className="text-sm sm:text-base font-mono font-black text-indigo-700">14.0h</span>
                        <span className="text-[8px] sm:text-[9px] text-slate-500 font-medium block truncate">Consecutive</span>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block truncate">Cycle Limit</span>
                        <span className="text-sm sm:text-base font-mono font-black text-sky-700">70.0h</span>
                        <span className="text-[8px] sm:text-[9px] text-sky-700 font-medium block truncate">8-Day Window</span>
                      </div>
                    </div>

                    {/* Mini SVG 24.0h Duty Graph Simulation */}
                    <div className="bg-slate-900 text-white p-3 rounded-2xl space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center space-x-1.5 text-slate-200 font-semibold truncate">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">24h Daily Log Output</span>
                        </span>
                        <span className="text-emerald-400 font-bold shrink-0">18/18 Passed</span>
                      </div>
                      <svg viewBox="0 0 320 44" className="w-full h-9">
                        <line x1="0" y1="5" x2="320" y2="5" stroke="#334155" strokeWidth="0.5" />
                        <line x1="0" y1="16" x2="320" y2="16" stroke="#334155" strokeWidth="0.5" />
                        <line x1="0" y1="27" x2="320" y2="27" stroke="#334155" strokeWidth="0.5" />
                        <line x1="0" y1="38" x2="320" y2="38" stroke="#334155" strokeWidth="0.5" />
                        <polyline
                          points="0,5 75,5 75,27 185,27 185,38 210,38 210,27 265,27 265,5 320,5"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span><span className="sm:hidden">00:00</span><span className="hidden sm:inline">Midnight</span></span>
                        <span><span className="sm:hidden">06:00</span><span className="hidden sm:inline">06:00 (Drive)</span></span>
                        <span><span className="sm:hidden">14:00</span><span className="hidden sm:inline">14:00 (Rest)</span></span>
                        <span><span className="sm:hidden">22:00</span><span className="hidden sm:inline">22:00 (Reset)</span></span>
                        <span>24:00</span>
                      </div>
                    </div>

                    {/* Bottom Feature Micro Badge */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="flex items-center space-x-1.5 text-slate-600 font-semibold text-[10px] sm:text-[11px] truncate">
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                        <span className="hidden sm:inline">Audit-Ready Electronic Logging</span>
                        <span className="sm:hidden">Audit-Ready Logs</span>
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 shrink-0">
                        <span className="hidden sm:inline">Letter Size Vector SVG</span>
                        <span className="sm:hidden">Vector SVG</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2026 Bento Feature Pillars - 2x2 Grid on Mobile, 4 Cols on Desktop */}
              <div className="pt-5 sm:pt-6 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1 sm:space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-600 font-medium">
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-sky-100/90 text-sky-700 shrink-0">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-sm truncate">11h Driving</span>
                  </div>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                    Caps continuous driving at 11.0h per shift before enforcing a 10-hour sleeper reset.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1 sm:space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-600 font-medium">
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-teal-100/90 text-teal-700 shrink-0">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-sm truncate">14h Duty Span</span>
                  </div>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                    Strictly bounds active on-duty time to 14 consecutive hours from shift start.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1 sm:space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-600 font-medium">
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-amber-100/90 text-amber-700 shrink-0">
                      <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-sm truncate">Rest & Fuel</span>
                  </div>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                    Auto-schedules 30m rest breaks after 8h and fuel stops every ≤1,000 miles.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1 sm:space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-600 font-medium">
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-indigo-100/90 text-indigo-700 shrink-0">
                      <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-sm truncate">Vector Logs</span>
                  </div>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                    Generates official 24-hour letter-size SVG paper logs with duty status lines.
                  </p>
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
