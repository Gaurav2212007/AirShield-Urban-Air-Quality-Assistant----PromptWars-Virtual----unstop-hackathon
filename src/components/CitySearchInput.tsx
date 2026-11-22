import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { POPULAR_CITIES } from '../data/demoData';
import { searchCities } from '../services/aqiService';
import type { Location } from '../types/airshield';

interface CitySearchInputProps {
  selectedLocation: Location;
  onSelectLocation: (loc: Location) => void;
  placeholder?: string;
  compact?: boolean;
}

export const CitySearchInput: React.FC<CitySearchInputProps> = ({
  selectedLocation,
  onSelectLocation,
  placeholder = 'Search any city globally (e.g. Delhi, Pune, London)...',
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Location[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      const res = await searchCities(trimmed, controller.signal);
      if (!controller.signal.aborted) {
        setResults(res.results);
        setSearchError(res.error ?? null);
        setIsSearching(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleChoose = (loc: Location) => {
    onSelectLocation(loc);
    setQuery('');
    setIsOpen(false);
  };

  const trimmedQuery = query.trim();
  const showPresets = trimmedQuery.length < 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search city for air quality"
          aria-expanded={isOpen}
          className={`w-full bg-white border border-slate-300 rounded-lg pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 transition-colors ${
            compact ? 'py-2' : 'py-2.5'
          }`}
        />
        {isSearching ? (
          <Loader2
            className="w-4 h-4 text-teal-700 animate-spin absolute right-3"
            aria-label="Searching cities"
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setSearchError(null);
            }}
            aria-label="Clear city search"
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div
          className="absolute z-40 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          role="listbox"
          aria-label="City search results"
        >
          {showPresets ? (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Quick-select global cities</span>
                <span className="font-mono">
                  Current: {selectedLocation.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {POPULAR_CITIES.map((city) => {
                  const isActive =
                    city.name === selectedLocation.name &&
                    city.country === selectedLocation.country;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleChoose(city)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-900 border border-teal-300'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                      <span className="truncate">{city.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : searchError ? (
            <div className="p-3 text-xs text-amber-800 bg-amber-50/70 space-y-2">
              <p>{searchError}</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.slice(0, 4).map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleChoose(city)}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded text-xs font-medium text-slate-800 hover:bg-amber-100"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          ) : !isSearching && results.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center">
              No matching cities found for “{trimmedQuery}”. Try another spelling or select a preset city.
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {results.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    onClick={() => handleChoose(loc)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors focus-visible:bg-teal-50 focus-visible:outline-none"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {loc.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {[loc.region, loc.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                    {loc.countryCode && (
                      <span className="text-xs font-mono text-slate-500 shrink-0">
                        {loc.countryCode}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
