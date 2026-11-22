import React from 'react';
import {
  AlertCircle,
  FlaskConical,
  MapPin,
  Radio,
  RefreshCw,
  SlidersHorizontal,
  WifiOff,
} from 'lucide-react';
import type { AirQualityDataset, Location } from '../types/airshield';
import { formatRelativeMinutes } from '../utils/aqiUtils';
import { CitySearchInput } from './CitySearchInput';

interface WorkspaceToolbarProps {
  location: Location;
  dataset: AirQualityDataset | null;
  isDemoMode: boolean;
  isOnline: boolean;
  isAqiLoading: boolean;
  aqiWarning: string | null;
  onSelectLocation: (loc: Location) => void;
  onRefreshLive: () => void;
  onToggleDemoMode: (enable: boolean) => void;
  onOpenProfileWizard: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  location,
  dataset,
  isDemoMode,
  isOnline,
  isAqiLoading,
  aqiWarning,
  onSelectLocation,
  onRefreshLive,
  onToggleDemoMode,
  onOpenProfileWizard,
}) => {
  const isDemoOrFallback = isDemoMode || dataset?.source === 'demo';
  const isCached = dataset?.source === 'cached';

  return (
    <section
      aria-label="Location and data controls"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <div className="w-full sm:max-w-sm">
            <CitySearchInput
              selectedLocation={location}
              onSelectLocation={onSelectLocation}
              compact
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-900 truncate">
              {location.name}
              {location.region ? `, ${location.region}` : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{location.country}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            {isDemoOrFallback ? (
              <span className="inline-flex items-center gap-1.5 text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {dataset?.isOfflineFallback
                    ? 'Demo / Offline Data — Not live'
                    : 'DEMO DATA — Not live'}
                </span>
              </span>
            ) : isCached ? (
              <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Cached Live Reading · Updated{' '}
                  {dataset?.fetchedAt ? formatRelativeMinutes(dataset.fetchedAt) : 'recently'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-teal-900 bg-teal-50/70 border border-teal-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                <Radio className="w-3.5 h-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                <span>
                  Live · Open-Meteo · Updated{' '}
                  {dataset?.fetchedAt ? formatRelativeMinutes(dataset.fetchedAt) : 'now'}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshLive}
              disabled={isAqiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isAqiLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isDemoOrFallback ? 'Try Live Data Again' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleDemoMode(!isDemoMode)}
              aria-pressed={isDemoMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isDemoMode
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isDemoMode ? 'Exit Demo Mode' : 'Demo Mode'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenProfileWizard}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>

      {(!isOnline || aqiWarning) && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900"
        >
          {!isOnline ? (
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex-1">
            {!isOnline
              ? 'You appear to be offline. AirShield has switched to its offline/cached data so your guidance remains accessible.'
              : aqiWarning}
          </div>
        </div>
      )}
    </section>
  );
};
