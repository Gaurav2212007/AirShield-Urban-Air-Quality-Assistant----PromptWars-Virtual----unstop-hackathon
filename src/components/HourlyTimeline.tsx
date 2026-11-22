import React from 'react';
import { Clock } from 'lucide-react';
import type { HourlyForecastPoint } from '../types/airshield';
import { getAqiSeverity } from '../utils/aqiUtils';

interface HourlyTimelineProps {
  hourly: HourlyForecastPoint[];
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({ hourly }) => {
  const next24 = hourly.slice(0, 24);

  if (next24.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="24-hour exposure timeline"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>24-Hour Safe-Window Timeline</span>
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            Hour-by-Hour Exposure Guidance
          </h2>
        </div>
        <div className="text-xs text-slate-500">
          Scroll horizontally to inspect upcoming hours
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2 snap-x"
        role="list"
        aria-label="Hourly air quality cards"
      >
        {next24.map((pt) => {
          const sev = getAqiSeverity(pt.usAqi);
          const highlightRing = pt.isCurrentHour
            ? 'border-teal-700 bg-teal-50/40'
            : pt.isBestWindow
            ? 'border-teal-300 bg-slate-50/60'
            : pt.isPeakHour
            ? 'border-rose-300 bg-rose-50/40'
            : 'border-slate-200 bg-white';

          return (
            <div
              key={pt.time}
              role="listitem"
              className={`min-w-[148px] snap-start border rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 shrink-0 ${highlightRing}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                  {pt.hourLabel}
                </span>
                {pt.isCurrentHour ? (
                  <span className="text-[11px] font-semibold text-teal-800">Now</span>
                ) : pt.isBestWindow ? (
                  <span className="text-[11px] font-semibold text-teal-800">Lowest</span>
                ) : pt.isPeakHour ? (
                  <span className="text-[11px] font-semibold text-rose-800">Peak</span>
                ) : null}
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                  {pt.usAqi}
                </div>
                <div className={`text-xs font-semibold ${sev.textColorClass}`}>
                  {sev.shortLabel}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>PM2.5</span>
                  <span className="font-mono tabular-nums">{pt.pm25} µg/m³</span>
                </div>
                <div className="font-semibold text-slate-800">{pt.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
