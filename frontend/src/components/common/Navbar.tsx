import React, { useState } from 'react';
import { Truck, ShieldCheck, MapPin, FileText, Clock, Compass, Sun, Moon, Monitor, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  hasResults: boolean;
  onScrollTo: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ hasResults, onScrollTo }) => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onScrollTo(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-soft-sm dark:shadow-dark-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer group select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="RouteWise Home"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-sky-600 flex items-center justify-center text-white shadow-soft-sm transition-transform duration-200 group-hover:scale-105">
              <Truck className="w-5 h-5 text-sky-400 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                  RouteWise
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  HOS · ELD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Interstate Logistics & FMCSA Compliance Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (shown when trip results are ready) */}
          {hasResults && (
            <nav className="hidden md:flex items-center space-x-1" aria-label="Trip sections navigation">
              <button
                onClick={() => handleNavClick('map-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Route Map</span>
              </button>
              <button
                onClick={() => handleNavClick('hos-dashboard-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>HOS Clocks</span>
              </button>
              <button
                onClick={() => handleNavClick('logs-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Daily Logs</span>
              </button>
              <button
                onClick={() => handleNavClick('timeline-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <Compass className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Itinerary</span>
              </button>
              <button
                onClick={() => handleNavClick('compliance-panel-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Audit</span>
              </button>
            </nav>
          )}

          {/* Right Action Bar: Status Pill + Theme Switcher + Mobile Menu Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Regulatory Status Pill */}
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-full px-3 py-1 text-xs text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px]">FMCSA 70/8 Property</span>
            </div>

            {/* Theme Toggle Button (Light / Dark / System) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md text-xs transition ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Light mode"
                aria-label="Switch to light theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md text-xs transition ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Dark mode"
                aria-label="Switch to dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md text-xs transition hidden sm:inline-flex ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="System preference"
                aria-label="Use system color theme"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Hamburger Toggle (visible on mobile when results exist) */}
            {hasResults && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {hasResults && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('map-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Route Map</span>
              </button>
              <button
                onClick={() => handleNavClick('hos-dashboard-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>HOS Clocks</span>
              </button>
              <button
                onClick={() => handleNavClick('logs-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Daily Logs</span>
              </button>
              <button
                onClick={() => handleNavClick('timeline-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Itinerary</span>
              </button>
              <button
                onClick={() => handleNavClick('compliance-panel-section')}
                className="col-span-2 flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Compliance Audit Checklist</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
