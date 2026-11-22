import React, { useMemo, useState } from 'react';
import { Home, ShieldAlert } from 'lucide-react';
import type { HomeSetup, IndoorHack } from '../types/airshield';

interface IndoorDefenseSectionProps {
  hacks: IndoorHack[];
  home: HomeSetup;
}

type HackFilter = 'all' | 'free' | 'budget' | 'cooking';

export const IndoorDefenseSection: React.FC<IndoorDefenseSectionProps> = ({
  hacks,
  home,
}) => {
  const [filter, setFilter] = useState<HackFilter>('all');

  const filteredHacks = useMemo(() => {
    if (filter === 'free') return hacks.filter((h) => h.cost === 'free');
    if (filter === 'budget') return hacks.filter((h) => h.cost !== 'free');
    if (filter === 'cooking') {
      return hacks.filter(
        (h) =>
          h.title.toLowerCase().includes('cook') ||
          h.title.toLowerCase().includes('gas') ||
          h.title.toLowerCase().includes('lpg') ||
          h.personalizedReason.toLowerCase().includes('cook')
      );
    }
    return hacks;
  }, [hacks, filter]);

  const formatCost = (cost: IndoorHack['cost']) => {
    if (cost === 'free') return '₹0 / Free';
    if (cost === 'low') return 'Low cost';
    return 'Medium cost';
  };

  return (
    <section
      id="indoor-defense-section"
      aria-label="Indoor Air Defense"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Indoor Air Defense</span>
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            Practical Indoor Hacks for Your Home
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tailored for {home.airPurifier === 'available' ? 'HEPA purifier' : 'no purifier'} ·{' '}
            {home.windowSealing} window sealing · {home.cookingFuel.replace('_', '/')}
          </p>
        </div>

        <div
          role="group"
          aria-label="Filter indoor hacks"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'free', label: '₹0 / Free' },
              { id: 'budget', label: 'Low-Budget' },
              { id: 'cooking', label: 'Cooking' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredHacks.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          No hacks match this filter. Try switching to “All” to view your full indoor plan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHacks.map((hack, idx) => (
            <article
              key={`${hack.title}-${idx}`}
              className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-white hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-display font-semibold text-slate-900">
                    {hack.title}
                  </h3>
                  <span className="text-xs font-mono font-semibold text-teal-800 whitespace-nowrap shrink-0">
                    {formatCost(hack.cost)} · {hack.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {hack.personalizedReason}
                </p>

                <ol className="space-y-1.5 text-xs sm:text-sm text-slate-800 list-decimal list-inside">
                  {hack.steps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <p className="text-slate-700">
                  <strong className="text-slate-900">Why it helps:</strong> {hack.whyItHelps}
                </p>
                {hack.safetyNote && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
                    <span>{hack.safetyNote}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
