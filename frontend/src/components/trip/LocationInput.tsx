import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Location } from '../../types/trip';
import { geocodeLocation } from '../../services/api';

interface LocationInputProps {
  id: string;
  label: string;
  value: Location | null;
  onChange: (loc: Location | null) => void;
  placeholder: string;
  required?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
}) => {
  const [inputText, setInputText] = useState(value ? value.name : '');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value) {
      setInputText(value.name);
    } else {
      setInputText('');
    }
  }, [value]);

  // Click outside listener to dismiss suggestions
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

    if (value && value.name !== text) {
      onChange(null);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await geocodeLocation(trimmed);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err: any) {
        setErrorMsg('Search failed. Check network or try typing city name.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelectLocation = (loc: Location) => {
    onChange(loc);
    setInputText(loc.name);
    setSuggestions([]);
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleClear = () => {
    onChange(null);
    setInputText('');
    setSuggestions([]);
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
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
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-full font-medium shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono text-[10px]">{value.latitude.toFixed(2)}, {value.longitude.toFixed(2)}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
          className={`w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition shadow-soft-sm dark:shadow-dark-sm ${
            value
              ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/10 dark:ring-emerald-500/20'
              : errorMsg
              ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-slate-900 dark:focus:border-sky-400 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-sky-400/20'
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
          {isLoading && <Loader2 className="w-4 h-4 text-slate-500 dark:text-slate-400 animate-spin" />}
          {inputText && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={`Clear ${label}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</p>}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-soft-md dark:shadow-dark-lg divide-y divide-slate-100 dark:divide-slate-800 text-sm animate-fade-in"
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
                className={`px-3.5 py-2.5 cursor-pointer transition flex items-start space-x-2.5 ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{loc.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{loc.formatted_address}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
