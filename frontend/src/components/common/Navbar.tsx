import React, { useState } from 'react';
import { Truck, ShieldCheck, MapPin, FileText, Clock, Compass, Menu, X, Route } from 'lucide-react';

interface NavbarProps {
  hasResults: boolean;
  onScrollTo: (id: string, tab?: string) => void;
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ hasResults, onScrollTo, activeTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string, tab?: string) => {
    onScrollTo(sectionId, tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Branding */}
            <div
              className="flex items-center space-x-3 cursor-pointer group select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="RouteWise Home"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-500/10 transition-transform duration-200 group-hover:scale-105">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                    Route<span className="text-sky-600">Wise</span>
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    HOS · ELD
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Interstate Logistics & FMCSA Compliance Engine
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            {hasResults && (
              <nav className="hidden md:flex items-center space-x-1.5" aria-label="Trip sections navigation">
                <button
                  onClick={() => handleNavClick('hos-dashboard-section')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>HOS Clocks</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'map')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'map' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Route Map</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'logs')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Daily Logs</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'timeline')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'timeline' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'directions')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'directions' ? 'bg-slate-100 text-slate-900 border border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Route className="w-3.5 h-3.5 text-slate-600" />
                  <span>Turn-by-Turn</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'compliance')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'compliance' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Audit (18)</span>
                </button>
              </nav>
            )}

            {/* Right Status Pill + Mobile Menu Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs text-emerald-800 font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-[11px]">FMCSA 70/8 Property</span>
              </div>

              {/* Compact live status indicator for mobile */}
              <div className="sm:hidden flex items-center space-x-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-full px-2.5 py-1 text-[11px] text-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </div>

              {/* Mobile Hamburger Button */}
              {hasResults && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && hasResults && (
            <div className="md:hidden border-t border-slate-100 py-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  onClick={() => handleNavClick('hos-dashboard-section')}
                  className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 text-left"
                >
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>HOS Clocks</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'map')}
                  className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 text-left"
                >
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Route Map</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'logs')}
                  className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 text-left"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Daily Logs</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'timeline')}
                  className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 text-left"
                >
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Itinerary</span>
                </button>
                <button
                  onClick={() => handleNavClick('results-container', 'compliance')}
                  className="col-span-2 flex items-center justify-center space-x-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Compliance Audit Checklist (18 Checks)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Floating Mobile Bottom Dock */}
      {hasResults && (
        <aside
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-2.5 inset-x-3 z-40 md:hidden bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-2xl py-1 px-1 flex items-center justify-around animate-slide-up"
        >
          <button
            onClick={() => onScrollTo('hos-dashboard-section')}
            className="flex-1 py-1 px-0.5 flex flex-col items-center justify-center text-[10px] font-semibold text-slate-700 hover:text-sky-600 active:scale-95 transition cursor-pointer"
          >
            <Clock className="w-4 h-4 text-teal-600 mb-0.5" />
            <span>HOS</span>
          </button>
          <button
            onClick={() => onScrollTo('results-container', 'map')}
            className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center text-[10px] font-semibold active:scale-95 transition cursor-pointer ${
              activeTab === 'map' ? 'text-sky-600 font-bold' : 'text-slate-700 hover:text-sky-600'
            }`}
          >
            <MapPin className="w-4 h-4 text-sky-600 mb-0.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => onScrollTo('results-container', 'logs')}
            className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center text-[10px] font-semibold active:scale-95 transition cursor-pointer ${
              activeTab === 'logs' ? 'text-indigo-600 font-bold' : 'text-slate-700 hover:text-indigo-600'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600 mb-0.5" />
            <span>Logs</span>
          </button>
          <button
            onClick={() => onScrollTo('results-container', 'timeline')}
            className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center text-[10px] font-semibold active:scale-95 transition cursor-pointer ${
              activeTab === 'timeline' ? 'text-amber-600 font-bold' : 'text-slate-700 hover:text-amber-600'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600 mb-0.5" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => onScrollTo('results-container', 'compliance')}
            className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center text-[10px] font-semibold active:scale-95 transition cursor-pointer ${
              activeTab === 'compliance' ? 'text-emerald-700 font-bold' : 'text-slate-700 hover:text-emerald-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
            <span>Audit</span>
          </button>
        </aside>
      )}
    </>
  );
};
