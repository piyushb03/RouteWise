import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Location } from '../../types/trip';
import { geocodeLocation } from '../../services/api';

interface LocationInputProps {
  id: string;
  label: string;
  value: Location | null;
  onChange: (loc: Location | null) => void;
  placeholder?: string;
  required?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Search city, state, or address...',
  required = true,
}) => {
  const [inputText, setInputText] = useState(value ? value.name : '');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal text if value changes externally (e.g. preset applied)
  useEffect(() => {
    if (value) {
      setInputText(value.name);
      setErrorMsg(null);
    } else {
      setInputText('');
    }
  }, [value]);

  // Handle outside click to dismiss autocomplete popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    setInputText(text);
    setErrorMsg(null);
    setSelectedIndex(-1);

    if (value && text !== value.name) {
      onChange(null); // invalidate until selected
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await geocodeLocation(text.trim());
        setSuggestions(results);
        setIsOpen(results.length > 0);
        if (results.length === 0) {
          setErrorMsg('No US highway locations found for this query.');
        }
      } catch (err) {
        console.error('Geocoding search failed:', err);
        setErrorMsg('Failed to fetch location suggestions.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  };

  const handleSelectLocation = (loc: Location) => {
    setInputText(loc.name);
    onChange(loc);
    setIsOpen(false);
    setErrorMsg(null);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputText('');
    onChange(null);
    setSuggestions([]);
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectLocation(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-bold text-slate-800 tracking-normal truncate">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <span className="shrink-0 inline-flex items-center space-x-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="font-mono text-[10px] hidden sm:inline">{value.latitude.toFixed(2)}, {value.longitude.toFixed(2)}</span>
            <span className="text-[10px] font-semibold sm:hidden">Selected</span>
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <MapPin className="w-4 h-4 text-slate-500" />
        </div>

        <input
          id={id}
          type="text"
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !value) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-10 pr-12 h-12 text-sm sm:text-base bg-white border rounded-2xl placeholder-slate-400 focus:outline-none transition shadow-2xs ${
            errorMsg
              ? 'border-rose-400 ring-2 ring-rose-400/10'
              : 'border-slate-300 hover:border-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15'
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center space-x-1">
          {isLoading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin mr-1" />}
          {value && !isLoading && (
            <span className="text-emerald-600 p-1" title="Location coordinates verified">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}
          {inputText && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              aria-label={`Clear ${label}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && <p className="text-xs text-rose-600 font-medium px-1">{errorMsg}</p>}

      {/* Autocomplete Dropdown - Mobile Touch Optimized */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-64 sm:max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl divide-y divide-slate-100 text-sm animate-fade-in"
        >
          {suggestions.map((loc, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={`${loc.latitude}-${loc.longitude}-${idx}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLocation(loc)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 sm:py-2.5 cursor-pointer transition flex items-start space-x-3 active:bg-slate-100 ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate">{loc.name}</div>
                  <div className="text-xs text-slate-500 truncate">{loc.formatted_address}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
