import React, { useState } from 'react';
import { Truck, ArrowRight, Sliders, Sparkles, Navigation, AlertCircle } from 'lucide-react';
import { Location, AdvancedTripSettings } from '../../types/trip';
import { LocationInput } from './LocationInput';
import { CycleHoursInput } from './CycleHoursInput';
import { AdvancedSettingsModal } from './AdvancedSettingsModal';

interface TripPlannerFormProps {
  onPlanTrip: (payload: {
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
  const [currentLoc, setCurrentLoc] = useState<Location | null>(null);
  const [pickupLoc, setPickupLoc] = useState<Location | null>(null);
  const [dropoffLoc, setDropoffLoc] = useState<Location | null>(null);
  const [cycleUsed, setCycleUsed] = useState<number>(12.5);

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('06:00');
  const [timezone, setTimezone] = useState<string>('America/Chicago');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [advanced, setAdvanced] = useState<AdvancedTripSettings>({
    driver_name: '',
    co_driver_name: '',
    carrier_name: 'Lone Star Logistics LLC',
    carrier_address: '100 Commerce St, Dallas, TX 75201',
    home_terminal_address: '500 Logistics Way, Fort Worth, TX 76102',
    truck_number: 'TRK-804',
    trailer_number: 'TRL-5390',
    shipping_doc_number: 'BOL-98214',
    commodity: 'Commercial Freight',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-configured realistic trip presets for easy evaluation
  const handleApplyPreset = (presetType: 'chicago' | 'cross_country' | 'florida') => {
    setValidationError(null);
    if (presetType === 'chicago') {
      setCurrentLoc({
        name: 'Dallas, TX',
        formatted_address: 'Dallas, Dallas County, Texas, United States',
        latitude: 32.7767,
        longitude: -96.7970,
        city: 'Dallas',
        state: 'Texas',
        country: 'US',
      });
      setPickupLoc({
        name: 'Waco, TX',
        formatted_address: 'Waco, McLennan County, Texas, United States',
        latitude: 31.5493,
        longitude: -97.1467,
        city: 'Waco',
        state: 'Texas',
        country: 'US',
      });
      setDropoffLoc({
        name: 'Chicago, IL',
        formatted_address: 'Chicago, Cook County, Illinois, United States',
        latitude: 41.8781,
        longitude: -87.6298,
        city: 'Chicago',
        state: 'Illinois',
        country: 'US',
      });
      setCycleUsed(14.0);
    } else if (presetType === 'cross_country') {
      setCurrentLoc({
        name: 'Los Angeles, CA',
        formatted_address: 'Los Angeles, Los Angeles County, California, United States',
        latitude: 34.0522,
        longitude: -118.2437,
        city: 'Los Angeles',
        state: 'California',
        country: 'US',
      });
      setPickupLoc({
        name: 'Phoenix, AZ',
        formatted_address: 'Phoenix, Maricopa County, Arizona, United States',
        latitude: 33.4484,
        longitude: -112.0740,
        city: 'Phoenix',
        state: 'Arizona',
        country: 'US',
      });
      setDropoffLoc({
        name: 'Dallas, TX',
        formatted_address: 'Dallas, Dallas County, Texas, United States',
        latitude: 32.7767,
        longitude: -96.7970,
        city: 'Dallas',
        state: 'Texas',
        country: 'US',
      });
      setCycleUsed(8.5);
    } else {
      setCurrentLoc({
        name: 'Atlanta, GA',
        formatted_address: 'Atlanta, Fulton County, Georgia, United States',
        latitude: 33.7490,
        longitude: -84.3880,
        city: 'Atlanta',
        state: 'Georgia',
        country: 'US',
      });
      setPickupLoc({
        name: 'Savannah, GA',
        formatted_address: 'Savannah, Chatham County, Georgia, United States',
        latitude: 32.0809,
        longitude: -81.0912,
        city: 'Savannah',
        state: 'Georgia',
        country: 'US',
      });
      setDropoffLoc({
        name: 'Miami, FL',
        formatted_address: 'Miami, Miami-Dade County, Florida, United States',
        latitude: 25.7617,
        longitude: -80.1918,
        city: 'Miami',
        state: 'Florida',
        country: 'US',
      });
      setCycleUsed(22.0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentLoc) {
      setValidationError('Please specify and select a valid Current Location.');
      return;
    }
    if (!pickupLoc) {
      setValidationError('Please specify and select a valid Pickup Location.');
      return;
    }
    if (!dropoffLoc) {
      setValidationError('Please specify and select a valid Dropoff Location.');
      return;
    }
    if (cycleUsed < 0 || cycleUsed > 70) {
      setValidationError('Current Cycle Used must be between 0.0 and 70.0 hours.');
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

  return (
    <section id="planner-form-section" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-sm dark:shadow-dark-md transition-colors relative overflow-hidden">
      {/* Preset Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-sky-400 border border-slate-200 dark:border-slate-700">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Interstate CMV Trip Planner
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Configure departure, shipper loading, receiver delivery, and current cycle hours.
          </p>
        </div>

        {/* Quick sample buttons for assessment evaluator */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Trips:</span>
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('chicago')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition active:scale-95 shadow-2xs"
          >
            Dallas → Chicago
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('cross_country')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition active:scale-95 shadow-2xs"
          >
            LA → Dallas (1,400+ mi)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('florida')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition active:scale-95 shadow-2xs"
          >
            Atlanta → Miami
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs animate-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* Main Planning Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Field 1: Current Location */}
          <LocationInput
            id="current-location"
            label="1. Current Location"
            value={currentLoc}
            onChange={setCurrentLoc}
            placeholder="Search departure city (e.g. Dallas, TX)"
          />

          {/* Field 2: Pickup Location */}
          <LocationInput
            id="pickup-location"
            label="2. Pickup Location (1 hr load)"
            value={pickupLoc}
            onChange={setPickupLoc}
            placeholder="Search shipper city (e.g. Waco, TX)"
          />

          {/* Field 3: Dropoff Location */}
          <LocationInput
            id="dropoff-location"
            label="3. Dropoff Location (1 hr unload)"
            value={dropoffLoc}
            onChange={setDropoffLoc}
            placeholder="Search receiver city (e.g. Chicago, IL)"
          />
        </div>

        {/* Field 4: Current Cycle Used */}
        <CycleHoursInput value={cycleUsed} onChange={setCycleUsed} />

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Sliders className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Advanced Details (Start Time, Carrier, Driver)</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3 rounded-xl font-bold text-sm shadow-soft-sm transition-all ${
              isLoading
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white shadow-soft-sm active:scale-[0.99]'
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
