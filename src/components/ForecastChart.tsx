import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import type { ForecastAnalysis, HourlyForecastPoint } from '../types/airshield';
import { getAqiSeverity } from '../utils/aqiUtils';

interface ForecastChartProps {
  hourly: HourlyForecastPoint[];
  analysis: ForecastAnalysis;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: HourlyForecastPoint }>;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0].payload;
  const severity = getAqiSeverity(pt.usAqi);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
        <span className="font-mono font-semibold text-slate-900">
          {pt.hourLabel} · {pt.dayLabel}
        </span>
        {pt.isCurrentHour && (
          <span className="font-semibold text-teal-800">Now</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-600">US AQI</span>
        <span className="font-mono font-bold text-slate-900 tabular-nums">
          {pt.usAqi} ({severity.shortLabel})
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-600">PM2.5</span>
        <span className="font-mono text-slate-800 tabular-nums">{pt.pm25} µg/m³</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-600">PM10</span>
        <span className="font-mono text-slate-800 tabular-nums">{pt.pm10} µg/m³</span>
      </div>
      <div className="pt-1 border-t border-slate-100 font-medium text-slate-800">
        Guidance: {pt.status}
      </div>
    </div>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({ hourly, analysis }) => {
  const [horizon, setHorizon] = useState<'24h' | '48h'>('24h');

  const chartData = useMemo(
    () => (horizon === '24h' ? hourly.slice(0, 24) : hourly.slice(0, 48)),
    [hourly, horizon]
  );

  const currentPoint = chartData.find((p) => p.isCurrentHour);
  const yMax = Math.max(220, Math.ceil((Math.max(...chartData.map((d) => d.usAqi), 100) + 30) / 50) * 50);

  if (chartData.length === 0) {
    return (
      <section
        id="forecast-section"
        className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500"
      >
        Hourly forecast unavailable for this location right now.
      </section>
    );
  }

  return (
    <section
      id="forecast-section"
      aria-label="Hourly air quality forecast chart"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900">
            Hourly Air Quality Forecast
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Projected US AQI curve · Range {analysis.minAqi}–{analysis.maxAqi} (24h avg {analysis.avgAqi})
          </p>
        </div>

        <div
          role="group"
          aria-label="Forecast horizon"
          className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start"
        >
          <button
            type="button"
            onClick={() => setHorizon('24h')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              horizon === '24h'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Next 24 Hours
          </button>
          <button
            type="button"
            onClick={() => setHorizon('48h')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              horizon === '48h'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            48-Hour Outlook
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full" role="img" aria-label={`Hourly US AQI trend from ${chartData[0]?.hourLabel} to ${chartData[chartData.length - 1]?.hourLabel}. ${analysis.trendNarrative}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F766E" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              interval={horizon === '24h' ? 2 : 5}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={100}
              stroke="#D97706"
              strokeDasharray="4 4"
              label={{ value: '100 Moderate', position: 'insideTopRight', fill: '#B45309', fontSize: 10 }}
            />
            <ReferenceLine
              y={200}
              stroke="#E11D48"
              strokeDasharray="4 4"
              label={{ value: '200 Very Unhealthy', position: 'insideTopRight', fill: '#BE123C', fontSize: 10 }}
            />
            {yMax >= 300 && (
              <ReferenceLine
                y={300}
                stroke="#881337"
                strokeDasharray="4 4"
                label={{ value: '300 Hazardous', position: 'insideTopRight', fill: '#881337', fontSize: 10 }}
              />
            )}
            {currentPoint && (
              <ReferenceLine
                x={currentPoint.hourLabel}
                stroke="#0F766E"
                strokeWidth={2}
                label={{ value: 'Now', position: 'top', fill: '#0F766E', fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="usAqi"
              name="US AQI"
              stroke="#0F766E"
              strokeWidth={2.5}
              fill="url(#aqiFill)"
              activeDot={{ r: 5, fill: '#0F766E', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
        <span className="font-semibold text-slate-800">US AQI Reference:</span>
        <span>0–50 Good</span>
        <span aria-hidden="true">·</span>
        <span>51–100 Moderate</span>
        <span aria-hidden="true">·</span>
        <span>101–200 Unhealthy</span>
        <span aria-hidden="true">·</span>
        <span>201–300 Very Unhealthy</span>
        <span aria-hidden="true">·</span>
        <span>301+ Hazardous</span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
        {analysis.trendDirection === 'falling' ? (
          <TrendingDown className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
        ) : analysis.trendDirection === 'rising' || analysis.trendDirection === 'inversion_spike' ? (
          <TrendingUp className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <Activity className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="space-y-1 text-xs sm:text-sm text-slate-700">
          <p className="font-medium text-slate-900">{analysis.trendNarrative}</p>
          <p>{analysis.windowNarrative}</p>
        </div>
      </div>
    </section>
  );
};
