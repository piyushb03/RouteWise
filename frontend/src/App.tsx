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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-slate-900 selection:text-white dark:selection:bg-sky-500 dark:selection:text-slate-950">
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
