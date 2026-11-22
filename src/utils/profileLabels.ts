import type {
  AirPurifierStatus,
  CommuteMode,
  CookingFuel,
  Vulnerability,
  WindowSealing,
} from '../types/airshield';

export const VULNERABILITY_OPTIONS: Array<{
  id: Vulnerability;
  label: string;
  detail: string;
}> = [
  { id: 'kids', label: 'Toddlers / Kids', detail: 'Developing lungs, higher breathing rate' },
  { id: 'elderly', label: 'Elderly', detail: 'Higher cardiopulmonary sensitivity' },
  { id: 'asthma_copd', label: 'Asthma / COPD', detail: 'Airway reactivity to PM2.5 & NO2' },
  { id: 'pregnant', label: 'Pregnant Women', detail: 'Extra protection from fine particulates' },
  { id: 'pets', label: 'Pets', detail: 'Short low-level outdoor walks needed' },
  { id: 'none', label: 'No special vulnerability', detail: 'General adult household' },
];

export const PURIFIER_OPTIONS: Array<{ id: AirPurifierStatus; label: string; detail: string }> = [
  { id: 'available', label: 'Available', detail: 'HEPA or mechanical indoor purifier' },
  { id: 'none', label: 'None', detail: 'Relying on sealing & low-cost defense' },
];

export const COOKING_FUEL_OPTIONS: Array<{ id: CookingFuel; label: string; detail: string }> = [
  { id: 'gas_lpg', label: 'Gas / LPG', detail: 'Combustion NO2 & cooking aerosols' },
  { id: 'induction_electric', label: 'Induction / Electric', detail: 'No combustion gases indoors' },
  { id: 'other', label: 'Other', detail: 'Mixed or solid/kerosene backup' },
];

export const SEALING_OPTIONS: Array<{ id: WindowSealing; label: string; detail: string }> = [
  { id: 'poor', label: 'Poor', detail: 'Noticeable drafts or loose frames' },
  { id: 'average', label: 'Average', detail: 'Standard frames, minor door gaps' },
  { id: 'good', label: 'Good', detail: 'Tight gaskets and weatherstripping' },
];

export const COMMUTE_OPTIONS: Array<{ id: CommuteMode; label: string; detail: string }> = [
  { id: 'walking_two_wheeler', label: 'Walking / Two-Wheeler', detail: 'Direct roadside air exposure' },
  { id: 'public_transit', label: 'Public Transit', detail: 'Curbside stops & shared stations' },
  { id: 'car', label: 'Car', detail: 'Cabin filtration & idling control' },
  { id: 'wfh', label: 'Work From Home', detail: 'Focus on indoor workday routine' },
];

export function getVulnerabilityLabel(v: Vulnerability): string {
  return VULNERABILITY_OPTIONS.find((o) => o.id === v)?.label ?? v;
}

export function getCommuteLabel(c: CommuteMode): string {
  return COMMUTE_OPTIONS.find((o) => o.id === c)?.label ?? c;
}

export function getCookingLabel(c: CookingFuel): string {
  return COOKING_FUEL_OPTIONS.find((o) => o.id === c)?.label ?? c;
}

export function getSealingLabel(s: WindowSealing): string {
  return SEALING_OPTIONS.find((o) => o.id === s)?.label ?? s;
}
