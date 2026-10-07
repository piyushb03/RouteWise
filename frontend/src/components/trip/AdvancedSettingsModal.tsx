import React, { useEffect } from 'react';
import { Sliders, X, Calendar, Clock, Globe, User, Building2, FileCheck } from 'lucide-react';
import { AdvancedTripSettings } from '../../types/trip';

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  onChangeStartDate: (val: string) => void;
  startTime: string;
  onChangeStartTime: (val: string) => void;
  timezone: string;
  onChangeTimezone: (val: string) => void;
  advanced: AdvancedTripSettings;
  onChangeAdvanced: (settings: AdvancedTripSettings) => void;
}

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  startDate,
  onChangeStartDate,
  startTime,
  onChangeStartTime,
  timezone,
  onChangeTimezone,
  advanced,
  onChangeAdvanced,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateField = (field: keyof AdvancedTripSettings, val: string) => {
    onChangeAdvanced({
      ...advanced,
      [field]: val,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="advanced-settings-title"
    >
      <div className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <Sliders className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h2 id="advanced-settings-title" className="text-sm sm:text-base font-bold text-slate-900">
                Advanced Operational & ELD Details
              </h2>
              <p className="text-[11px] text-slate-500">
                Optional carrier, vehicle, and manifest information for official daily logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section: Trip Departure & Timing */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Schedule Timing & Timezone</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onChangeStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Time (Local)</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => onChangeStartTime(e.target.value)}
                    className="w-full pl-9 pr-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Default 06:00 (planning default)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terminal Timezone</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <select
                    value={timezone}
                    onChange={(e) => onChangeTimezone(e.target.value)}
                    className="w-full pl-9 pr-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Phoenix">Arizona (MST)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Driver & Equipment */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Driver & Vehicle Identification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={advanced.driver_name}
                  onChange={(e) => updateField('driver_name', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Co-Driver Name (if any)</label>
                <input
                  type="text"
                  placeholder="Optional co-driver"
                  value={advanced.co_driver_name}
                  onChange={(e) => updateField('co_driver_name', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Truck / Tractor Number</label>
                <input
                  type="text"
                  placeholder="e.g. TRK-410"
                  value={advanced.truck_number}
                  onChange={(e) => updateField('truck_number', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trailer Number</label>
                <input
                  type="text"
                  placeholder="e.g. TRL-5301"
                  value={advanced.trailer_number}
                  onChange={(e) => updateField('trailer_number', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Carrier & Terminal */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Carrier & Home Terminal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Continental Freight Logistics LLC"
                  value={advanced.carrier_name}
                  onChange={(e) => updateField('carrier_name', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier Main Office Address</label>
                <input
                  type="text"
                  placeholder="100 Logistics Pkwy, Dallas, TX 75201"
                  value={advanced.carrier_address}
                  onChange={(e) => updateField('carrier_address', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Home Terminal Address</label>
                <input
                  type="text"
                  placeholder="500 Freight Way, Fort Worth, TX 76102"
                  value={advanced.home_terminal_address}
                  onChange={(e) => updateField('home_terminal_address', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Shipping Documents */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <FileCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Manifest & Commodity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">DVL or Manifest Number</label>
                <input
                  type="text"
                  placeholder="e.g. BOL-78921"
                  value={advanced.shipping_doc_number}
                  onChange={(e) => updateField('shipping_doc_number', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipper & Commodity</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp / Auto Parts"
                  value={advanced.commodity}
                  onChange={(e) => updateField('commodity', e.target.value)}
                  className="w-full px-3 h-11 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-soft-sm transition cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
