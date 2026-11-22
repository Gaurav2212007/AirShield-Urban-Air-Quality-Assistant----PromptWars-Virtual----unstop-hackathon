import React from 'react';
import { Bus, Car, Footprints, Home, Leaf } from 'lucide-react';
import type {
  CommuteMode,
  CommuteRecommendation,
  MicroHabit,
} from '../types/airshield';
import { getCommuteLabel } from '../utils/profileLabels';

interface CommuteAndHabitsSectionProps {
  commuteMode: CommuteMode;
  recommendations: CommuteRecommendation[];
  microHabits: MicroHabit[];
}

function getCommuteIcon(mode: CommuteMode) {
  const cls = 'w-4 h-4 text-teal-700';
  switch (mode) {
    case 'walking_two_wheeler':
      return <Footprints className={cls} aria-hidden="true" />;
    case 'public_transit':
      return <Bus className={cls} aria-hidden="true" />;
    case 'car':
      return <Car className={cls} aria-hidden="true" />;
    case 'wfh':
      return <Home className={cls} aria-hidden="true" />;
  }
}

export const CommuteAndHabitsSection: React.FC<CommuteAndHabitsSectionProps> = ({
  commuteMode,
  recommendations,
  microHabits,
}) => {
  return (
    <section
      id="commute-section"
      aria-label="Low-emission commute and micro-habits"
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
            {getCommuteIcon(commuteMode)}
            <span>Low-Emission Commute · {getCommuteLabel(commuteMode)}</span>
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            {commuteMode === 'wfh'
              ? 'Low-Exposure Workday Routine'
              : 'Safer Travel & Lower Emissions'}
          </h2>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{rec.title}</h3>
                <span className="text-xs font-mono uppercase text-slate-500">
                  {rec.priority} priority
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{rec.action}</p>
              <p className="text-xs text-slate-600">{rec.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
            <Leaf className="w-4 h-4" aria-hidden="true" />
            <span>Micro-Habits</span>
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            Community & Home Emission Cuts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual emission cuts reduce localized winter smog for neighbors as well as your home.
          </p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {microHabits.map((habit, idx) => (
            <div key={idx} className="p-3.5 space-y-1">
              <div className="text-sm font-semibold text-slate-900">{habit.title}</div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{habit.action}</p>
              <p className="text-xs text-teal-800">{habit.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
