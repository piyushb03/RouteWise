import React, { useState } from 'react';
import { Location, AdvancedTripSettings } from '../../types/trip';
import { LocationInput } from './LocationInput';
import { CycleHoursInput } from './CycleHoursInput';
import { AdvancedSettingsModal } from './AdvancedSettingsModal';
import { Truck, Navigation, Sliders, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface TripPlannerFormProps {
  onPlanTrip: (data: {
    current: Location;
    pickup: Location;
    dropoff: Location;
    cycleUsed: number;
    startDate: string;
    startTime: string;
    timezone: string;
    advanced: AdvancedTripSettings;
  }) => void;
  isLoading: boolean;
}

export const TripPlannerForm: React.FC<TripPlannerFormProps> = ({ onPlanTrip, isLoading }) => {
  // Preset defaults for instant testing
  const [currentLoc, setCurrentLoc] = useState<Location | null>({
    name: 'Dallas, TX',
    formatted_address: 'Dallas, Texas, United States',
    latitude: 32.7767,
    longitude: -96.797,
    city: 'Dallas',
    state: 'TX',
    country: 'United States',
  });

  const [pickupLoc, setPickupLoc] = useState<Location | null>({
    name: 'Waco, TX',
    formatted_address: 'Waco, Texas, United States',
    latitude: 31.5493,
    longitude: -97.1467,
    city: 'Waco',
    state: 'TX',
    country: 'United States',
  });

  const [dropoffLoc, setDropoffLoc] = useState<Location | null>({
    name: 'Chicago, IL',
    formatted_address: 'Chicago, Illinois, United States',
    latitude: 41.8781,
    longitude: -87.6298,
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
  });

  const [cycleUsed, setCycleUsed] = useState<number>(15.0);

  // Advanced / Log metadata settings
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>('06:00');
  const [timezone, setTimezone] = useState<string>('America/Chicago');

  const [advanced, setAdvanced] = useState<AdvancedTripSettings>({
    driver_name: 'John Doe',
    carrier_name: 'Continental Freight Logistics LLC',
    truck_number: 'TRK-410',
    trailer_number: 'TRL-5301',
    carrier_address: '100 Logistics Pkwy, Dallas, TX 75201',
    home_terminal_address: '500 Freight Way, Fort Worth, TX 76102',
    shipping_doc_number: 'BOL-78921',
    commodity: 'General Freight / Dry Goods',
    co_driver_name: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentLoc) {
      setValidationError('Please specify your current starting location.');
      return;
    }
    if (!pickupLoc) {
      setValidationError('Please specify the shipper pickup location.');
      return;
    }
    if (!dropoffLoc) {
      setValidationError('Please specify the receiver dropoff destination.');
      return;
    }

    onPlanTrip({
      current: currentLoc,
      pickup: pickupLoc,
      dropoff: dropoffLoc,
      cycleUsed,
      startDate,
      startTime,
      timezone,
      advanced,
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === 'chicago') {
      setCurrentLoc({
        name: 'Dallas, TX',
        formatted_address: 'Dallas, Texas, United States',
        latitude: 32.7767,
        longitude: -96.797,
        city: 'Dallas',
        state: 'TX',
      });
      setPickupLoc({
        name: 'Waco, TX',
        formatted_address: 'Waco, Texas, United States',
        latitude: 31.5493,
        longitude: -97.1467,
        city: 'Waco',
        state: 'TX',
      });
      setDropoffLoc({
        name: 'Chicago, IL',
        formatted_address: 'Chicago, Illinois, United States',
        latitude: 41.8781,
        longitude: -87.6298,
        city: 'Chicago',
        state: 'IL',
      });
      setCycleUsed(15.0);
    } else if (presetKey === 'cross_country') {
      setCurrentLoc({
        name: 'Los Angeles, CA',
        formatted_address: 'Los Angeles, California, United States',
        latitude: 34.0522,
        longitude: -118.2437,
        city: 'Los Angeles',
        state: 'CA',
      });
      setPickupLoc({
        name: 'Phoenix, AZ',
        formatted_address: 'Phoenix, Arizona, United States',
        latitude: 33.4484,
        longitude: -112.074,
        city: 'Phoenix',
        state: 'AZ',
      });
      setDropoffLoc({
        name: 'Dallas, TX',
        formatted_address: 'Dallas, Texas, United States',
        latitude: 32.7767,
        longitude: -96.797,
        city: 'Dallas',
        state: 'TX',
      });
      setCycleUsed(42.0);
    } else if (presetKey === 'florida') {
      setCurrentLoc({
        name: 'Atlanta, GA',
        formatted_address: 'Atlanta, Georgia, United States',
        latitude: 33.749,
        longitude: -84.388,
        city: 'Atlanta',
        state: 'GA',
      });
      setPickupLoc({
        name: 'Savannah, GA',
        formatted_address: 'Savannah, Georgia, United States',
        latitude: 32.0809,
        longitude: -81.0912,
        city: 'Savannah',
        state: 'GA',
      });
      setDropoffLoc({
        name: 'Miami, FL',
        formatted_address: 'Miami, Florida, United States',
        latitude: 25.7617,
        longitude: -80.1918,
        city: 'Miami',
        state: 'FL',
      });
      setCycleUsed(20.0);
    }
    setValidationError(null);
  };

  return (
    <section id="planner-form-section" className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 lg:p-8 shadow-soft-md relative overflow-hidden">
      {/* Preset Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Interstate CMV Trip Planner
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure departure, shipper loading, receiver delivery, and current cycle hours.
          </p>
        </div>

        {/* Quick sample buttons - Clean single-row horizontal scroll on mobile, no tall vertical stacking */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar w-full lg:w-auto -mx-1 px-1 flex-nowrap text-xs">
          <span className="text-slate-500 flex items-center space-x-1 font-semibold shrink-0 mr-1 text-[11px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden xs:inline">Presets:</span>
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('chicago')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 border border-slate-200/90 font-semibold whitespace-nowrap transition active:scale-95 shadow-2xs cursor-pointer flex items-center space-x-1.5 shrink-0 text-xs"
          >
            <span>Dallas → Chicago</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">(1,050 mi)</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('cross_country')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 border border-slate-200/90 font-semibold whitespace-nowrap transition active:scale-95 shadow-2xs cursor-pointer flex items-center space-x-1.5 shrink-0 text-xs"
          >
            <span>LA → Dallas</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">(1,435 mi)</span>
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('florida')}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 border border-slate-200/90 font-semibold whitespace-nowrap transition active:scale-95 shadow-2xs cursor-pointer flex items-center space-x-1.5 shrink-0 text-xs"
          >
            <span>Atlanta → Miami</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">(660 mi)</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-5 sm:mb-6 flex items-start space-x-2.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm animate-slide-up">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* Main Planning Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
          {/* Field 1: Current Location */}
          <LocationInput
            id="current-location"
            label="Current Location"
            value={currentLoc}
            onChange={setCurrentLoc}
            placeholder="Search departure city (e.g. Dallas, TX)"
            stepType="start"
            stepTag="1. Origin"
            subtitle="Tractor staging terminal / departure point"
          />

          {/* Field 2: Pickup Location */}
          <LocationInput
            id="pickup-location"
            label="Pickup Shipper"
            value={pickupLoc}
            onChange={setPickupLoc}
            placeholder="Search shipper city (e.g. Waco, TX)"
            stepType="pickup"
            stepTag="2. Pickup"
            subtitle="Freight loading facility (1.0 hr load required)"
          />

          {/* Field 3: Dropoff Location */}
          <LocationInput
            id="dropoff-location"
            label="Receiver Dropoff"
            value={dropoffLoc}
            onChange={setDropoffLoc}
            placeholder="Search receiver city (e.g. Chicago, IL)"
            stepType="dropoff"
            stepTag="3. Dropoff"
            subtitle="Final consignee destination (1.0 hr unload)"
          />
        </div>

        {/* Field 4: Current Cycle Used */}
        <CycleHoursInput value={cycleUsed} onChange={setCycleUsed} />

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="sm:hidden">Trip & Driver Settings</span>
            <span className="hidden sm:inline">Advanced Details (Start Time, Carrier, Driver)</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer ${
              isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-sky-600/25 active:scale-[0.98]'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Planning Route & HOS Schedule...' : 'Plan Trip & Generate Logs'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </form>

      {/* Advanced Settings Modal */}
      <AdvancedSettingsModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        startDate={startDate}
        onChangeStartDate={setStartDate}
        startTime={startTime}
        onChangeStartTime={setStartTime}
        timezone={timezone}
        onChangeTimezone={setTimezone}
        advanced={advanced}
        onChangeAdvanced={setAdvanced}
      />
    </section>
  );
};
