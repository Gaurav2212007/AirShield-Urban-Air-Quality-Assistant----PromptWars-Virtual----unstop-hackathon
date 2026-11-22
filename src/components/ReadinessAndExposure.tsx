import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gauge, Timer } from 'lucide-react';
import type { ForecastAnalysis } from '../types/airshield';

interface ReadinessAndExposureProps {
  analysis: ForecastAnalysis;
}

export const ReadinessAndExposure: React.FC<ReadinessAndExposureProps> = ({ analysis }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const scoreTone =
    analysis.readinessScore >= 75
      ? 'text-emerald-800'
      : analysis.readinessScore >= 50
      ? 'text-amber-800'
      : 'text-rose-800';

  const barWidth = Math.min(100, Math.round((analysis.exposureBudget.recommendedMaxOutdoorMinutes / 180) * 100));

  return (
    <section
      aria-label="Household readiness and exposure guidance"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Gauge className="w-4 h-4 text-teal-700" aria-hidden="true" />
              <span>AirShield Readiness</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-mono font-bold tabular-nums ${scoreTone}`}>
                {analysis.readinessScore}
              </span>
              <span className="text-sm font-mono text-slate-500">/100</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            aria-expanded={showBreakdown}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span>Why this score</span>
            {showBreakdown ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{analysis.readinessSummary}</p>

        {showBreakdown && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {analysis.readinessFactors.map((factor, i) => (
              <div key={i} className="flex items-center justify-between text-xs gap-2">
                <span className="text-slate-700">{factor.label}</span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    factor.status === 'positive'
                      ? 'text-emerald-700'
                      : factor.status === 'risk'
                      ? 'text-rose-700'
                      : 'text-slate-500'
                  }`}
                >
                  {factor.impact}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-500 pt-1">
          Product-generated household readiness indicator (not a medical metric).
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Timer className="w-4 h-4 text-teal-700" aria-hidden="true" />
              <span>AirShield Exposure Guidance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                {analysis.exposureBudget.recommendedMaxOutdoorMinutes} min
              </span>
              <span className="text-xs text-slate-500">suggested max outdoor cap today</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
            {analysis.exposureBudget.statusLabel}
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-teal-700 rounded-full transition-all duration-300"
            style={{ width: `${barWidth}%` }}
          />
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          {analysis.exposureBudget.guidance}
        </p>
        <p className="text-[11px] text-slate-500 pt-1">
          Behavioral planning visualization based on current US AQI & family sensitivity.
        </p>
      </div>
    </section>
  );
};
