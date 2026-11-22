import React from 'react';

export const AqiHeroSkeleton: React.FC = () => (
  <div
    className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 animate-pulse"
    aria-label="Loading current air quality"
  >
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-3">
        <div className="h-3.5 w-32 bg-slate-200 rounded" />
        <div className="h-14 w-44 bg-slate-200 rounded" />
        <div className="h-4 w-72 max-w-full bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-36 bg-slate-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="h-3 w-12 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const ForecastChartSkeleton: React.FC = () => (
  <div
    className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-pulse"
    aria-label="Loading hourly forecast chart"
  >
    <div className="flex items-center justify-between">
      <div className="h-5 w-48 bg-slate-200 rounded" />
      <div className="h-8 w-32 bg-slate-200 rounded-lg" />
    </div>
    <div className="h-64 w-full bg-slate-100 rounded-lg" />
    <div className="h-4 w-3/4 bg-slate-200 rounded" />
  </div>
);

export const ActionPlanSkeleton: React.FC = () => (
  <div
    className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 animate-pulse"
    aria-label="Personalizing your family action plan"
  >
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-6 w-80 max-w-full bg-slate-200 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 border border-slate-200 rounded-lg space-y-2.5">
          <div className="h-3.5 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-3.5 w-4/5 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);
