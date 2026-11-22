import React, { useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import type { AirPlan, FamilyProfile, ForecastAnalysis } from '../types/airshield';
import { formatHourLabel } from '../utils/aqiUtils';
import { getVulnerabilityLabel } from '../utils/profileLabels';

interface ActionPlanSectionProps {
  plan: AirPlan;
  profile: FamilyProfile;
  analysis: ForecastAnalysis;
  planWarning: string | null;
}

export const ActionPlanSection: React.FC<ActionPlanSectionProps> = ({
  plan,
  profile,
  analysis,
  planWarning,
}) => {
  const [expandedWhy, setExpandedWhy] = useState(false);

  const sensitiveMembers = profile.vulnerabilities.filter((v) => v !== 'none');
  const hasSensitive = sensitiveMembers.length > 0;

  return (
    <section
      id="action-plan-section"
      aria-label="Your family's clean air action plan"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-teal-800">Your Family’s Action Plan</span>
            <span aria-hidden="true">·</span>
            <span>
              {plan.generatedBy === 'gemini'
                ? 'Personalized via Gemini'
                : 'Personalized via Safety Engine'}
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 text-balance">
            {plan.overallAssessment.headline}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
            {plan.overallAssessment.summary}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpandedWhy((v) => !v)}
          aria-expanded={expandedWhy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 self-start"
        >
          <Info className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
          <span>Why this matters</span>
          {expandedWhy ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {planWarning && (
        <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{planWarning}</span>
        </div>
      )}

      {expandedWhy && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs sm:text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900">How AirShield built this plan</p>
          <p>
            This plan combines your city’s current US AQI ({analysis.currentAqi}) and 24-hour range (
            {analysis.minAqi}–{analysis.maxAqi}) with your household profile:{' '}
            {hasSensitive
              ? sensitiveMembers.map(getVulnerabilityLabel).join(', ')
              : 'general adult household'}
            , {profile.home.airPurifier === 'available' ? 'HEPA purifier available' : 'no purifier'},{' '}
            {profile.home.windowSealing} window sealing, and {profile.home.cookingFuel.replace('_', '/')} cooking.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-display font-semibold text-slate-900">
          Top 3 Priorities Right Now
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.topPriorities.slice(0, 3).map((item) => (
            <div
              key={item.rank}
              className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2"
            >
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-teal-800">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Priority 0{item.rank}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                {item.action}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sun className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
              <span>
                {analysis.hasCleanWindow
                  ? 'Next Best Outdoor Window'
                  : 'Least-Polluted Window (Minimize Exposure)'}
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
              {analysis.bestWindow.startLabel}–{analysis.bestWindow.endLabel}
            </span>
          </div>

          {plan.safeWindows.slice(0, 1).map((win, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-xs font-mono text-slate-600">
                {formatHourLabel(win.start)}–{formatHourLabel(win.end)} · Avg US AQI {Math.round(win.aqi)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{win.reason}</p>
              <ul className="space-y-1 pt-1">
                {win.recommendedActivities.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border border-slate-200 rounded-lg space-y-3 bg-rose-50/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Ban className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
              <span>Lockdown / Peak Pollution Hours</span>
            </div>
            <span className="text-xs font-mono font-semibold text-rose-900 tabular-nums">
              {analysis.worstWindow.startLabel}–{analysis.worstWindow.endLabel}
            </span>
          </div>

          {plan.lockdownHours.length > 0 ? (
            plan.lockdownHours.slice(0, 1).map((lock, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-xs font-mono text-rose-800">
                  {formatHourLabel(lock.start)}–{formatHourLabel(lock.end)} · Peak US AQI {Math.round(lock.aqi)}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{lock.reason}</p>
                <ul className="space-y-1 pt-1">
                  {lock.avoid.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-rose-700 font-bold" aria-hidden="true">×</span>
                      <span>Avoid: {item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              No severe lockdown hours projected in the next 24 hours, though staying alert to
              evening traffic spikes is still recommended.
            </p>
          )}
        </div>
      </div>

      {hasSensitive && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Health Notice:</strong> AirShield provides general
          environmental guidance, not medical diagnosis or treatment. Follow your clinician&apos;s
          advice and your existing action plan.
        </div>
      )}
    </section>
  );
};
