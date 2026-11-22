import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Shield } from 'lucide-react';
import type {
  CommuteMode,
  CookingFuel,
  FamilyProfile,
  Location,
  Vulnerability,
  WindowSealing,
} from '../types/airshield';
import {
  COMMUTE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  getCommuteLabel,
  getCookingLabel,
  getSealingLabel,
  getVulnerabilityLabel,
  PURIFIER_OPTIONS,
  SEALING_OPTIONS,
  VULNERABILITY_OPTIONS,
} from '../utils/profileLabels';
import { CitySearchInput } from './CitySearchInput';

interface FamilyProfileWizardProps {
  initialProfile: FamilyProfile;
  onComplete: (profile: FamilyProfile) => void;
  onCancel: () => void;
  isModal?: boolean;
}

const STEPS = ['Location', 'Family', 'Home', 'Commute', 'Review'] as const;

export const FamilyProfileWizard: React.FC<FamilyProfileWizardProps> = ({
  initialProfile,
  onComplete,
  onCancel,
  isModal = false,
}) => {
  const [step, setStep] = useState<number>(0);
  const [draft, setDraft] = useState<FamilyProfile>(initialProfile);

  const toggleVulnerability = (id: Vulnerability) => {
    setDraft((prev) => {
      if (id === 'none') {
        return { ...prev, vulnerabilities: ['none'] };
      }
      const withoutNone = prev.vulnerabilities.filter((v) => v !== 'none');
      const exists = withoutNone.includes(id);
      const next = exists
        ? withoutNone.filter((v) => v !== id)
        : [...withoutNone, id];
      return {
        ...prev,
        vulnerabilities: next.length === 0 ? ['none'] : next,
      };
    });
  };

  const setLocation = (location: Location) => {
    setDraft((prev) => ({ ...prev, location }));
  };

  const content = (
    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl mx-auto overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-700" aria-hidden="true" />
          <h2 className="text-base font-display font-bold text-slate-900">
            Family AirShield Profile
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </span>
      </div>

      <div className="px-6 pt-4">
        <div className="grid grid-cols-5 gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}>
          {STEPS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(idx)}
              className="text-left space-y-1 focus:outline-none group"
            >
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  idx <= step ? 'bg-teal-700' : 'bg-slate-200 group-hover:bg-slate-300'
                }`}
              />
              <span
                className={`block text-[11px] font-medium truncate ${
                  idx === step ? 'text-teal-800 font-semibold' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">
                Where does your household live?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                AirShield uses your city’s coordinates for live Open-Meteo pollution telemetry and
                local time alignment.
              </p>
            </div>
            <CitySearchInput
              selectedLocation={draft.location}
              onSelectLocation={setLocation}
            />
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5 text-sm">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-slate-900">{draft.location.name}</span>
              <span className="text-slate-500">
                {[draft.location.region, draft.location.country].filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">
                Who lives in your household?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Select all groups that apply. AirShield never stores personal names or sensitive
                identifiers remotely.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VULNERABILITY_OPTIONS.map((opt) => {
                const selected = draft.vulnerabilities.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleVulnerability(opt.id)}
                    aria-pressed={selected}
                    className={`p-3.5 rounded-lg border text-left transition-colors ${
                      selected
                        ? 'bg-teal-50/70 border-teal-700 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {selected && <Check className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.detail}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">
                Tell us about your home setup
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Used to prioritize ₹0 draft-sealing hacks, purifier zoning, or safer cooking airflow.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Air Purifier</label>
              <div className="grid grid-cols-2 gap-2.5">
                {PURIFIER_OPTIONS.map((opt) => {
                  const active = draft.home.airPurifier === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          home: { ...p.home, airPurifier: opt.id },
                        }))
                      }
                      aria-pressed={active}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        active
                          ? 'bg-teal-50/70 border-teal-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.detail}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Cooking Fuel</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {COOKING_FUEL_OPTIONS.map((opt) => {
                  const active = draft.home.cookingFuel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          home: { ...p.home, cookingFuel: opt.id as CookingFuel },
                        }))
                      }
                      aria-pressed={active}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        active
                          ? 'bg-teal-50/70 border-teal-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.detail}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Window Sealing</label>
              <div className="grid grid-cols-3 gap-2.5">
                {SEALING_OPTIONS.map((opt) => {
                  const active = draft.home.windowSealing === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          home: { ...p.home, windowSealing: opt.id as WindowSealing },
                        }))
                      }
                      aria-pressed={active}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        active
                          ? 'bg-teal-50/70 border-teal-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.detail}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    home: { ...p.home, hasBalcony: !p.home.hasBalcony },
                  }))
                }
                aria-pressed={draft.home.hasBalcony}
                className={`p-3 rounded-lg border text-left flex items-center justify-between ${
                  draft.home.hasBalcony
                    ? 'bg-teal-50/70 border-teal-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">Balcony</div>
                  <div className="text-xs text-slate-500">
                    {draft.home.hasBalcony ? 'Yes' : 'No'}
                  </div>
                </div>
                {draft.home.hasBalcony && <Check className="w-4 h-4 text-teal-700" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    home: { ...p.home, hasIndoorPlants: !p.home.hasIndoorPlants },
                  }))
                }
                aria-pressed={draft.home.hasIndoorPlants}
                className={`p-3 rounded-lg border text-left flex items-center justify-between ${
                  draft.home.hasIndoorPlants
                    ? 'bg-teal-50/70 border-teal-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">Indoor Plants</div>
                  <div className="text-xs text-slate-500">
                    {draft.home.hasIndoorPlants ? 'Yes' : 'No'}
                  </div>
                </div>
                {draft.home.hasIndoorPlants && (
                  <Check className="w-4 h-4 text-teal-700" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">
                Primary weekday commute mode
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                AirShield adapts outdoor timing, mask guidance, or work-from-home routines around
                how you travel.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COMMUTE_OPTIONS.map((opt) => {
                const active = draft.commuteMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({ ...p, commuteMode: opt.id as CommuteMode }))
                    }
                    aria-pressed={active}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      active
                        ? 'bg-teal-50/70 border-teal-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                      {active && <Check className="w-4 h-4 text-teal-700" aria-hidden="true" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{opt.detail}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-teal-800">Profile Complete</div>
              <h3 className="text-lg font-display font-bold text-slate-900 mt-0.5">
                Your AirShield profile is ready.
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Review your household configuration below. Your plan updates immediately whenever
                you adjust these settings.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg text-sm">
              <div className="p-3.5 flex justify-between gap-4">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-900 text-right">
                  {draft.location.name}, {draft.location.country}
                </span>
              </div>
              <div className="p-3.5 flex justify-between gap-4">
                <span className="text-slate-500">Household</span>
                <span className="font-semibold text-slate-900 text-right">
                  {draft.vulnerabilities.map(getVulnerabilityLabel).join(', ')}
                </span>
              </div>
              <div className="p-3.5 flex justify-between gap-4">
                <span className="text-slate-500">Air Purifier</span>
                <span className="font-semibold text-slate-900 text-right">
                  {draft.home.airPurifier === 'available' ? 'Available' : 'None'}
                </span>
              </div>
              <div className="p-3.5 flex justify-between gap-4">
                <span className="text-slate-500">Cooking & Sealing</span>
                <span className="font-semibold text-slate-900 text-right">
                  {getCookingLabel(draft.home.cookingFuel)} · {getSealingLabel(draft.home.windowSealing)} sealing
                </span>
              </div>
              <div className="p-3.5 flex justify-between gap-4">
                <span className="text-slate-500">Commute</span>
                <span className="font-semibold text-slate-900 text-right">
                  {getCommuteLabel(draft.commuteMode)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{step === 0 ? 'Cancel' : 'Back'}</span>
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onComplete(draft)}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Generate My AirShield Plan</span>
          </button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Family Profile"
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      >
        {content}
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-50 py-10 px-4">{content}</div>;
};
