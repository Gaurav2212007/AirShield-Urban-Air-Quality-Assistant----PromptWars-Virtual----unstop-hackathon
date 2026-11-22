import type { AqiCategoryKey } from '../types/airshield';

export interface AqiSeverityMeta {
  key: AqiCategoryKey;
  label: string;
  shortLabel: string;
  range: string;
  description: string;
  guidance: string;
  badgeClasses: string;
  surfaceClasses: string;
  accentHex: string;
  textColorClass: string;
  borderColorClass: string;
}

export const AQI_SEVERITY_MAP: Record<AqiCategoryKey, AqiSeverityMeta> = {
  good: {
    key: 'good',
    label: 'Good',
    shortLabel: 'Good',
    range: '0–50',
    description: 'Air quality poses little or no risk for most households.',
    guidance: 'Normal outdoor routines and cross-ventilation are appropriate.',
    badgeClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    surfaceClasses: 'bg-emerald-50/70 border-emerald-200',
    accentHex: '#15803D',
    textColorClass: 'text-emerald-800',
    borderColorClass: 'border-emerald-200',
  },
  moderate: {
    key: 'moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    range: '51–100',
    description: 'Acceptable overall, though unusually sensitive people may feel mild irritation.',
    guidance: 'Outdoor play and commuting are generally fine; watch evening rises.',
    badgeClasses: 'bg-amber-50 text-amber-800 border-amber-200',
    surfaceClasses: 'bg-amber-50/60 border-amber-200',
    accentHex: '#B45309',
    textColorClass: 'text-amber-800',
    borderColorClass: 'border-amber-200',
  },
  sensitive: {
    key: 'sensitive',
    label: 'Unhealthy for Sensitive Groups',
    shortLabel: 'Sensitive Risk',
    range: '101–150',
    description: 'Kids, older adults, pregnant people, and those with asthma/COPD may experience symptoms.',
    guidance: 'Shorten strenuous outdoor activity for sensitive family members.',
    badgeClasses: 'bg-orange-50 text-orange-800 border-orange-200',
    surfaceClasses: 'bg-orange-50/70 border-orange-200',
    accentHex: '#C2410C',
    textColorClass: 'text-orange-800',
    borderColorClass: 'border-orange-200',
  },
  unhealthy: {
    key: 'unhealthy',
    label: 'Unhealthy',
    shortLabel: 'Unhealthy',
    range: '151–200',
    description: 'Everyone may begin to experience respiratory irritation; sensitive groups face greater risk.',
    guidance: 'Keep outdoor sessions brief and move vigorous exercise indoors.',
    badgeClasses: 'bg-rose-50 text-rose-800 border-rose-200',
    surfaceClasses: 'bg-rose-50/70 border-rose-200',
    accentHex: '#BE123C',
    textColorClass: 'text-rose-800',
    borderColorClass: 'border-rose-200',
  },
  very_unhealthy: {
    key: 'very_unhealthy',
    label: 'Very Unhealthy',
    shortLabel: 'Very Unhealthy',
    range: '201–300',
    description: 'Health alert: significant risk of respiratory and cardiovascular strain across the household.',
    guidance: 'Avoid outdoor play and non-essential errands; keep indoor air sealed and filtered.',
    badgeClasses: 'bg-red-50 text-red-900 border-red-300',
    surfaceClasses: 'bg-red-50/80 border-red-300',
    accentHex: '#991B1B',
    textColorClass: 'text-red-900',
    borderColorClass: 'border-red-300',
  },
  hazardous: {
    key: 'hazardous',
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    range: '301–500',
    description: 'Emergency conditions: severe winter smog affects every member of the household.',
    guidance: 'Minimize all outdoor exposure, seal drafts, and run indoor filtration if available.',
    badgeClasses: 'bg-stone-900 text-rose-100 border-stone-800',
    surfaceClasses: 'bg-rose-950/5 border-rose-400',
    accentHex: '#7F1D1D',
    textColorClass: 'text-rose-950',
    borderColorClass: 'border-rose-400',
  },
};

export function getAqiCategoryKey(aqi: number | null | undefined): AqiCategoryKey {
  if (aqi === null || aqi === undefined || Number.isNaN(aqi)) return 'moderate';
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export function getAqiSeverity(aqi: number | null | undefined): AqiSeverityMeta {
  return AQI_SEVERITY_MAP[getAqiCategoryKey(aqi)];
}

export function getHumanHeadlineForAqi(aqi: number | null | undefined): string {
  const key = getAqiCategoryKey(aqi);
  switch (key) {
    case 'good':
      return 'Air is clean right now.';
    case 'moderate':
      return 'Air is acceptable, with mild risk for sensitive lungs.';
    case 'sensitive':
      return 'Sensitive family members should take it easy outdoors.';
    case 'unhealthy':
      return 'Air is unhealthy right now. Keep outdoor time short.';
    case 'very_unhealthy':
      return 'Air is very unhealthy. Shift activities indoors.';
    case 'hazardous':
      return 'Air is hazardous right now. Outdoor exposure should be minimized.';
  }
}

export function formatHourLabel(isoOrLocal: string): string {
  const match = isoOrLocal.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  const date = new Date(isoOrLocal);
  if (!Number.isNaN(date.getTime())) {
    return date.toTimeString().slice(0, 5);
  }
  return isoOrLocal;
}

export function formatDayLabel(isoOrLocal: string): string {
  const datePart = isoOrLocal.split('T')[0];
  const parsed = new Date(`${datePart}T12:00:00Z`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  return datePart;
}

export function getLocationLocalClockString(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function getLocationCurrentHourIsoPrefix(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const hour = map.hour === '24' ? '00' : map.hour;
    return `${map.year}-${map.month}-${map.day}T${hour}:00`;
  } catch {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
  }
}

export function formatRelativeMinutes(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) return 'just now';
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin === 0) return 'just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr} hr ago`;
}

export function formatPollutant(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value)}`;
}
