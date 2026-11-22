import React from 'react';
import { MessageSquare, Shield } from 'lucide-react';

interface HeaderBarProps {
  onOpenCoach: () => void;
  onEditProfile: () => void;
  onGoHome: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenCoach,
  onEditProfile,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 rounded"
        >
          <Shield className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />
          <span className="text-lg font-display font-bold tracking-tight text-slate-900">
            AirShield
          </span>
        </button>

        <nav
          aria-label="Dashboard sections"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#forecast-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Forecast
          </a>
          <a
            href="#action-plan-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Action Plan
          </a>
          <a
            href="#indoor-defense-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Indoor Defense
          </a>
          <a
            href="#commute-section"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Commute
          </a>
          <button
            type="button"
            onClick={onEditProfile}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Family Profile
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCoach}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ask Air Coach</span>
          </button>
        </div>
      </div>
    </header>
  );
};
