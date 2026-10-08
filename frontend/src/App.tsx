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
        <section className="pt-1 pb-4">
          <div className="border border-slate-200/90 rounded-3xl bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-soft-md relative overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-8 sm:space-y-10">
              {/* 2-Column Hero: Left Value Prop, Right Telemetry Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                
                {/* Left Column: Headlines, CTAs, Trust Elements */}
                <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                  {/* Live Spec Badge */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-2xs">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>FMCSA 49 CFR Part 395 Specification</span>
                    <span className="text-slate-400 hidden sm:inline">|</span>
                    <span className="text-slate-500 font-mono hidden sm:inline text-[11px]">70h/8d Standard</span>
                  </div>

                  {/* High-Impact Headline */}
                  <div className="space-y-3">
                    <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-slate-900 leading-[1.12]">
                      Interstate CMV Routing &{' '}
                      <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        FMCSA ELD Daily Log
                      </span>{' '}
                      Automation
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
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

                      <div className="flex justify-between text-[10px] text-slate-500 font-medium font-mono">
                        <span>Leg 1: 95 mi</span>
                        <span>Load (1h)</span>
                        <span>Break (30m)</span>
                        <span>Leg 2: 955 mi</span>
                      </div>
                    </div>

                    {/* Live HOS Clocks Triplet */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-medium block">Drive Limit</span>
                        <span className="text-base font-mono font-black text-teal-700">11.0h</span>
                        <span className="text-[9px] text-emerald-700 font-semibold block">Max net span</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-medium block">Duty Window</span>
                        <span className="text-base font-mono font-black text-indigo-700">14.0h</span>
                        <span className="text-[9px] text-slate-500 font-medium block">Consecutive</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-0.5">
                        <span className="text-[10px] text-slate-500 font-medium block">Cycle Limit</span>
                        <span className="text-base font-mono font-black text-sky-700">70.0h</span>
                        <span className="text-[9px] text-sky-700 font-medium block">8-Day Rolling</span>
                      </div>
                    </div>

                    {/* Mini SVG 24.0h Duty Graph Simulation */}
                    <div className="bg-slate-900 text-white p-3 rounded-2xl space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center space-x-1.5 text-slate-200 font-semibold">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                          <span>Official 24h Daily Log Output</span>
                        </span>
                        <span className="text-emerald-400 font-bold">18/18 Checks Passed</span>
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
                        <span>Midnight</span>
                        <span>06:00 (Drive)</span>
                        <span>14:00 (Rest)</span>
                        <span>22:00 (Reset)</span>
                        <span>24:00</span>
                      </div>
                    </div>

                    {/* Bottom Feature Micro Badge */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="flex items-center space-x-1.5 text-slate-600 font-semibold text-[11px]">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Audit-Ready Electronic Logging</span>
                      </span>
                      <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                        Letter Size Vector SVG
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2026 Bento Feature Pillars */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-2 text-slate-600 font-medium">
                    <div className="p-1.5 rounded-xl bg-sky-100/90 text-sky-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">11h Driving Window</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-normal">
                    Caps continuous driving at 11.0h per shift before enforcing a mandatory 10-hour sleeper reset.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-2 text-slate-600 font-medium">
                    <div className="p-1.5 rounded-xl bg-teal-100/90 text-teal-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">14h Duty Window</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-normal">
                    Strictly bounds active on-duty time to 14 consecutive hours from shift start, accounting for load and unload.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-2 text-slate-600 font-medium">
                    <div className="p-1.5 rounded-xl bg-amber-100/90 text-amber-700">
                      <Fuel className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">30m Rest & Fuel Stops</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-normal">
                    Automatically inserts 30-min breaks before 8 hours of driving and fuel stops every ≤1,000 corridor miles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 hover:-translate-y-0.5 transition duration-200 shadow-2xs hover:bg-white hover:border-slate-300">
                  <div className="flex items-center space-x-2 text-slate-600 font-medium">
                    <div className="p-1.5 rounded-xl bg-indigo-100/90 text-indigo-700">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">Vector Daily Logs</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-normal">
                    Generates official 24-hour letter-size SVG paper logs with precise 4-row duty status transitions.
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
