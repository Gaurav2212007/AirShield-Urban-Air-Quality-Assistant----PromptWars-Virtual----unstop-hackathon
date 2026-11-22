import React from 'react';
import { MessageSquare, SlidersHorizontal, Users } from 'lucide-react';
import type { AirQualityDataset, FamilyProfile, ForecastAnalysis } from '../types/airshield';
import {
  getCommuteLabel,
  getCookingLabel,
  getSealingLabel,
  getVulnerabilityLabel,
} from '../utils/profileLabels';

interface ProfileSummarySidebarProps {
  profile: FamilyProfile;
  dataset: AirQualityDataset | null;
  analysis: ForecastAnalysis | null;
  onEditProfile: () => void;
  onQuickTogglePurifier: () => void;
  onOpenCoach: () => void;
}

export const ProfileSummarySidebar: React.FC<ProfileSummarySidebarProps> = ({
  profile,
  dataset,
  analysis,
  onEditProfile,
  onQuickTogglePurifier,
  onOpenCoach,
}) => {
  return (
    <aside aria-label="Household profile and Air Coach" className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" aria-hidden="true" />
            <h2 className="text-sm font-display font-bold text-slate-900">Family Profile</h2>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-900"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit</span>
          </button>
        </div>

        <dl className="space-y-3 text-xs">
          <div>
            <dt className="text-slate-500">Vulnerabilities</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {profile.vulnerabilities.map(getVulnerabilityLabel).join(' · ')}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div>
              <dt className="text-slate-500">Air Purifier</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {profile.home.airPurifier === 'available' ? 'Available' : 'None'}
              </dd>
            </div>
            <button
              type="button"
              onClick={onQuickTogglePurifier}
              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Switch to {profile.home.airPurifier === 'available' ? 'None' : 'Available'}
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <dt className="text-slate-500">Home Setup</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {getCookingLabel(profile.home.cookingFuel)} ·{' '}
              {getSealingLabel(profile.home.windowSealing)} sealing
              {profile.home.hasBalcony ? ' · Balcony' : ''}
              {profile.home.hasIndoorPlants ? ' · Plants' : ''}
            </dd>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <dt className="text-slate-500">Commute</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {getCommuteLabel(profile.commuteMode)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          <span>Ask the Air Coach</span>
        </div>
        <h2 className="text-base font-display font-bold text-slate-900">
          Need situation-specific advice?
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Air Coach already sees{' '}
          <strong className="text-slate-800">
            {dataset?.location.name ?? profile.location.name}
          </strong>{' '}
          (US AQI{' '}
          <span className="font-mono font-semibold">
            {analysis?.currentAqi ?? '—'}
          </span>
          ) and your full household profile—no need to repeat anything.
        </p>
        <button
          type="button"
          onClick={onOpenCoach}
          className="w-full py-2.5 px-4 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition-colors"
        >
          Open Air Coach
        </button>
      </div>
    </aside>
  );
};
