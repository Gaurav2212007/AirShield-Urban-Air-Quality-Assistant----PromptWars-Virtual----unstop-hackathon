import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
} from 'lucide-react';
import type {
  AirQualityDataset,
  AqiCategoryKey,
  ForecastAnalysis,
} from '../types/airshield';
import {
  formatPollutant,
  getAqiSeverity,
  getHumanHeadlineForAqi,
  getLocationLocalClockString,
} from '../utils/aqiUtils';

interface AqiHeroCardProps {
  dataset: AirQualityDataset;
  analysis: ForecastAnalysis;
}

function renderSeverityIcon(key: AqiCategoryKey) {
  const cls = 'w-5 h-5 shrink-0';
  switch (key) {
    case 'good':
      return <CheckCircle2 className={cls} aria-hidden="true" />;
    case 'moderate':
      return <Info className={cls} aria-hidden="true" />;
    case 'sensitive':
      return <AlertTriangle className={cls} aria-hidden="true" />;
    case 'unhealthy':
      return <ShieldAlert className={cls} aria-hidden="true" />;
    case 'very_unhealthy':
      return <AlertOctagon className={cls} aria-hidden="true" />;
    case 'hazardous':
      return <AlertOctagon className={cls} aria-hidden="true" />;
  }
}

export const AqiHeroCard: React.FC<AqiHeroCardProps> = ({ dataset, analysis }) => {
  const severity = getAqiSeverity(analysis.currentAqi);
  const headline = getHumanHeadlineForAqi(analysis.currentAqi);
  const localClock = getLocationLocalClockString(dataset.timezone);

  const pollutants = [
    { label: 'PM2.5', value: formatPollutant(dataset.current.pm25), unit: 'µg/m³' },
    { label: 'PM10', value: formatPollutant(dataset.current.pm10), unit: 'µg/m³' },
    { label: 'O₃', value: formatPollutant(dataset.current.o3), unit: 'µg/m³' },
    { label: 'NO₂', value: formatPollutant(dataset.current.no2), unit: 'µg/m³' },
  ];

  return (
    <section
      aria-label="Current air quality summary"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className={`p-6 sm:p-7 border-b border-slate-200 ${severity.surfaceClasses}`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">
                {dataset.location.name}
                {dataset.location.region ? `, ${dataset.location.region}` : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Local time {localClock}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {dataset.source === 'demo'
                  ? 'Demo / Offline Data'
                  : dataset.source === 'cached'
                  ? 'Cached Reading'
                  : 'Live Telemetry'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <div>
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                  US AQI
                </div>
                <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-slate-950 tabular-nums">
                  {analysis.currentAqi}
                </div>
              </div>

              <div className="space-y-1">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${severity.badgeClasses}`}
                >
                  {renderSeverityIcon(severity.key)}
                  <span>{severity.label}</span>
                </div>
                <div className="text-xs font-mono text-slate-600">
                  Scale {severity.range} US AQI
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg font-display font-semibold text-slate-900 max-w-2xl text-balance">
              {headline}
            </p>
            <p className="text-sm text-slate-700 max-w-2xl leading-relaxed">
              {severity.description} {severity.guidance}
            </p>
          </div>

          <div className="md:max-w-xs w-full bg-white/95 border border-slate-200 rounded-xl p-4 space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Next best action</span>
            </div>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">
              {analysis.nextBestAction}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
        {pollutants.map((p) => (
          <div key={p.label} className="p-4 sm:px-6 flex items-baseline justify-between sm:block">
            <div className="text-xs font-medium text-slate-500">{p.label}</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-semibold text-slate-900 tabular-nums">
                {p.value}
              </span>
              <span className="text-xs font-mono text-slate-500">{p.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
