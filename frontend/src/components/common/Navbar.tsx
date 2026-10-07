import React, { useState } from 'react';
import { Truck, ShieldCheck, MapPin, FileText, Clock, Compass, Menu, X } from 'lucide-react';

interface NavbarProps {
  hasResults: boolean;
  onScrollTo: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ hasResults, onScrollTo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onScrollTo(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
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
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-soft-sm transition-transform duration-200 group-hover:scale-105">
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                  RouteWise
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  HOS · ELD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Interstate Logistics & FMCSA Compliance Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (shown when trip results are ready) */}
          {hasResults && (
            <nav className="hidden md:flex items-center space-x-1" aria-label="Trip sections navigation">
              <button
                onClick={() => handleNavClick('map-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Route Map</span>
              </button>
              <button
                onClick={() => handleNavClick('hos-dashboard-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>HOS Clocks</span>
              </button>
              <button
                onClick={() => handleNavClick('logs-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Daily Logs</span>
              </button>
              <button
                onClick={() => handleNavClick('timeline-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span>Itinerary</span>
              </button>
              <button
                onClick={() => handleNavClick('compliance-panel-section')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audit</span>
              </button>
            </nav>
          )}

          {/* Right Action Bar: Regulatory Status Pill + Mobile Menu Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Regulatory Status Pill */}
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs text-emerald-800 font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px]">FMCSA 70/8 Property</span>
            </div>

            {/* Mobile Hamburger Toggle (visible on mobile when results exist) */}
            {hasResults && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {hasResults && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 animate-slide-up">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('map-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>Route Map</span>
              </button>
              <button
                onClick={() => handleNavClick('hos-dashboard-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Clock className="w-4 h-4 text-teal-600" />
                <span>HOS Clocks</span>
              </button>
              <button
                onClick={() => handleNavClick('logs-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Daily Logs</span>
              </button>
              <button
                onClick={() => handleNavClick('timeline-section')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Compass className="w-4 h-4 text-sky-600" />
                <span>Itinerary</span>
              </button>
              <button
                onClick={() => handleNavClick('compliance-panel-section')}
                className="col-span-2 flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Compliance Audit Checklist</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
