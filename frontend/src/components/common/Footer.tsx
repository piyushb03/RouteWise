import React from 'react';
import { AlertTriangle, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 mt-20 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Informational Disclaimer Box */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start space-x-3.5 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950 text-xs uppercase tracking-wide">
              FMCSA Regulatory Notice & Planning Guidance
            </p>
            <p className="text-amber-800 leading-relaxed text-xs">
              This application is an informational planning and assessment tool designed against the FMCSA Interstate Truck Driver&apos;s Guide to
              Hours of Service for Property Carriers (April 2022) and assessment parameters (70h/8d cycle, 1,000-mile fueling intervals,
              1h pickup/dropoff). The provided guide is guidance rather than a substitute for statutory regulations (49 CFR Part 395).
              This software does not provide legal advice and does not substitute for certified Electronic Logging Devices (ELDs) or motor carrier safety policies.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} RouteWise. Professional Freight & HOS Planning Platform.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Map data ©{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-slate-800"
                >
                  OpenStreetMap
                </a>
              </span>
            </span>
            <span>•</span>
            <span>
              Routing via{' '}
              <a
                href="https://project-osrm.org/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-800"
              >
                OSRM
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
