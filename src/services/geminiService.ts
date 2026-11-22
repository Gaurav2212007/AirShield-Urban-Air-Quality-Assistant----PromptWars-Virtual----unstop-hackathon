import type {
  AirPlan,
  AirQualityDataset,
  ChatMessage,
  FamilyProfile,
  ForecastAnalysis,
} from '../types/airshield';
import { getAqiSeverity } from '../utils/aqiUtils';
import { generateDeterministicPlan } from '../utils/fallbackPlanEngine';

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((item) => typeof item === 'string');
}

export function validateAirPlan(candidate: unknown): candidate is AirPlan {
  if (!candidate || typeof candidate !== 'object') return false;
  const obj = candidate as Record<string, unknown>;

  const oa = obj.overallAssessment as Record<string, unknown> | undefined;
  if (
    !oa ||
    !isNonEmptyString(oa.headline) ||
    !isNonEmptyString(oa.summary) ||
    !['low', 'moderate', 'high', 'critical'].includes(String(oa.priority))
  ) {
    return false;
  }

  if (!Array.isArray(obj.safeWindows) || !Array.isArray(obj.lockdownHours)) {
    return false;
  }

  if (!Array.isArray(obj.indoorHacks) || obj.indoorHacks.length === 0) {
    return false;
  }
  for (const hack of obj.indoorHacks) {
    const h = hack as Record<string, unknown>;
    if (
      !h ||
      !isNonEmptyString(h.title) ||
      !['free', 'low', 'medium'].includes(String(h.cost)) ||
      !['easy', 'moderate'].includes(String(h.difficulty)) ||
      !isStringArray(h.steps) ||
      !isNonEmptyString(h.whyItHelps) ||
      !isNonEmptyString(h.personalizedReason) ||
      typeof h.safetyNote !== 'string'
    ) {
      return false;
    }
  }

  if (!Array.isArray(obj.commuteRecommendations) || obj.commuteRecommendations.length === 0) {
    return false;
  }
  for (const rec of obj.commuteRecommendations) {
    const r = rec as Record<string, unknown>;
    if (
      !r ||
      !isNonEmptyString(r.title) ||
      !['high', 'medium', 'low'].includes(String(r.priority)) ||
      !isNonEmptyString(r.action) ||
      !isNonEmptyString(r.reason)
    ) {
      return false;
    }
  }

  if (!Array.isArray(obj.microHabits) || obj.microHabits.length === 0) {
    return false;
  }
  if (!Array.isArray(obj.topPriorities) || obj.topPriorities.length === 0) {
    return false;
  }

  return true;
}

export interface GeneratePlanResult {
  plan: AirPlan;
  warning?: string;
}

export async function generatePersonalizedPlan(
  dataset: AirQualityDataset,
  profile: FamilyProfile,
  analysis: ForecastAnalysis
): Promise<GeneratePlanResult> {
  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: dataset.location,
        source: dataset.source,
        current: dataset.current,
        hourly: dataset.hourly.slice(0, 24).map((h) => ({
          time: h.time,
          usAqi: h.usAqi,
          pm25: h.pm25,
          pm10: h.pm10,
          o3: h.o3,
          no2: h.no2,
          status: h.status,
        })),
        analysis: {
          currentAqi: analysis.currentAqi,
          minAqi: analysis.minAqi,
          maxAqi: analysis.maxAqi,
          avgAqi: analysis.avgAqi,
          bestWindow: analysis.bestWindow,
          worstWindow: analysis.worstWindow,
          hasCleanWindow: analysis.hasCleanWindow,
          trendDirection: analysis.trendDirection,
        },
        familyProfile: profile,
      }),
    });

    if (!res.ok) {
      throw new Error(`Plan API returned ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Plan API returned non-JSON content-type: ${contentType}`);
    }

    const json = (await res.json()) as { plan?: unknown };
    if (validateAirPlan(json.plan)) {
      return {
        plan: {
          ...json.plan,
          generatedBy: 'gemini',
          generatedAt: new Date().toISOString(),
        },
      };
    }

    throw new Error('Invalid structured plan format');
  } catch {
    return {
      plan: generateDeterministicPlan(dataset, profile, analysis),
      warning:
        'Live AI synthesis is temporarily unavailable. Showing your personalized plan from AirShield’s deterministic safety engine.',
    };
  }
}

export interface AirCoachContextPayload {
  location: {
    city: string;
    region?: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  currentAirQuality: {
    usAqi: number;
    pm25: number | null;
    pm10: number | null;
    ozone: number | null;
    nitrogenDioxide: number | null;
    timestamp: string;
  };
  hourlyForecast: Array<{
    time: string;
    hourLabel: string;
    usAqi: number;
    pm25: number;
    pm10: number;
    status: string;
  }>;
  familyProfile: {
    vulnerabilities: string[];
    airPurifier: string;
    cookingFuel: string;
    windowSealing: string;
    balcony: boolean;
    indoorPlants: boolean;
    commuteMode: string;
  };
  dataMode: 'live' | 'demo';
  bestWindow: {
    startLabel: string;
    endLabel: string;
    avgAqi: number;
    hasCleanWindow: boolean;
  };
}

export function buildAirCoachContext(
  dataset: AirQualityDataset,
  profile: FamilyProfile,
  analysis: ForecastAnalysis
): AirCoachContextPayload {
  return {
    location: {
      city: dataset.location.name,
      region: dataset.location.region,
      country: dataset.location.country,
      latitude: dataset.location.latitude,
      longitude: dataset.location.longitude,
    },
    currentAirQuality: {
      usAqi: analysis.currentAqi,
      pm25: dataset.current.pm25,
      pm10: dataset.current.pm10,
      ozone: dataset.current.o3,
      nitrogenDioxide: dataset.current.no2,
      timestamp: dataset.current.time,
    },
    hourlyForecast: dataset.hourly.slice(0, 24).map((h) => ({
      time: h.time,
      hourLabel: h.hourLabel,
      usAqi: h.usAqi,
      pm25: h.pm25,
      pm10: h.pm10,
      status: h.status,
    })),
    familyProfile: {
      vulnerabilities: profile.vulnerabilities,
      airPurifier: profile.home.airPurifier,
      cookingFuel: profile.home.cookingFuel,
      windowSealing: profile.home.windowSealing,
      balcony: profile.home.hasBalcony,
      indoorPlants: profile.home.hasIndoorPlants,
      commuteMode: profile.commuteMode,
    },
    dataMode: dataset.source === 'demo' ? 'demo' : 'live',
    bestWindow: {
      startLabel: analysis.bestWindow.startLabel,
      endLabel: analysis.bestWindow.endLabel,
      avgAqi: analysis.bestWindow.avgAqi,
      hasCleanWindow: analysis.hasCleanWindow,
    },
  };
}

export function generateDeterministicCoachAnswer(
  question: string,
  dataset: AirQualityDataset,
  profile: FamilyProfile,
  analysis: ForecastAnalysis
): string {
  const q = question.toLowerCase();
  const aqi = analysis.currentAqi;
  const severity = getAqiSeverity(aqi);
  const hasKids = profile.vulnerabilities.includes('kids');
  const hasSensitive = profile.vulnerabilities.some((v) => v !== 'none');
  const noPurifier = profile.home.airPurifier === 'none';

  const prefix = "Air Coach is offline — using AirShield's local safety guidance.\n\n";
  const windowNote = analysis.hasCleanWindow
    ? `The cleanest window ahead is ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel} (avg US AQI ${analysis.bestWindow.avgAqi}).`
    : `No genuinely clean outdoor window is projected in the next 24 hours; the least-polluted window is ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel} (avg US AQI ${analysis.bestWindow.avgAqi}), where exposure should still be minimized.`;

  if (q.includes('kid') || q.includes('child') || q.includes('play') || q.includes('outside')) {
    if (aqi >= 201) {
      return `${prefix}Outdoor air in ${dataset.location.name} is currently ${severity.label} (US AQI ${aqi}). ${
        hasKids
          ? 'Because your household includes children, avoid non-essential outdoor play right now and move activities indoors.'
          : 'Keep outdoor activity minimal right now.'
      } ${windowNote}`;
    }
    if (aqi >= 101) {
      return `${prefix}Air quality is ${severity.label} (US AQI ${aqi}). ${
        hasSensitive
          ? 'Keep outdoor play short and low-intensity for sensitive family members.'
          : 'Short outdoor breaks are better than vigorous exercise right now.'
      } ${windowNote}`;
    }
    return `${prefix}Air quality is currently ${severity.label} (US AQI ${aqi}), which is suitable for outdoor play. ${windowNote}`;
  }

  if (q.includes('window') || q.includes('ventilat')) {
    if (aqi >= 151) {
      return `${prefix}Keep exterior windows closed right now (US AQI ${aqi}, ${severity.label}). ${
        profile.home.windowSealing === 'poor'
          ? 'Since your window sealing is poor, roll damp towels along leaky sills and door gaps.'
          : 'Keep balcony and exterior doors latched.'
      } ${
        profile.home.cookingFuel === 'gas_lpg'
          ? 'When cooking on Gas/LPG, use your kitchen exhaust rather than opening bedroom windows.'
          : ''
      } ${windowNote}`;
    }
    return `${prefix}Current US AQI is ${aqi} (${severity.label}). Brief cross-ventilation is reasonable if needed, especially near ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel}.`;
  }

  if (q.includes('purifier')) {
    return `${prefix}${
      noPurifier
        ? 'Without an air purifier, focus on ₹0 containment: close exterior windows, seal door/window drafts with damp towels, designate one inner bedroom as a cleaner shelter room, damp-mop dust instead of dry sweeping, and avoid all indoor smoke/incense.'
        : 'Since you have an air purifier, keep doors/windows shut in your main occupied room and run the purifier continuously on medium-high during peaks.'
    } Current US AQI is ${aqi} (${severity.label}).`;
  }

  if (q.includes('walk') || q.includes('bus') || q.includes('transit') || q.includes('commut')) {
    return `${prefix}At US AQI ${aqi} (${severity.label}), minimizing time waiting near roadside tailpipes is key. Time essential trips closer to ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel}, take quieter side streets when walking, and wear a well-fitted N95/FFP2 respirator if AQI is above 150.`;
  }

  if (q.includes('least polluted') || q.includes('best time') || q.includes('when')) {
    return `${prefix}${windowNote} Peak pollution is projected around ${analysis.worstWindow.startLabel}–${analysis.worstWindow.endLabel} (up to US AQI ${analysis.worstWindow.maxAqi}).`;
  }

  return `${prefix}Right now in ${dataset.location.name}, US AQI is ${aqi} (${severity.label}). Next best action: ${analysis.nextBestAction} ${windowNote}`;
}

export async function askAirCoach(
  question: string,
  context: AirCoachContextPayload,
  recentMessages: ChatMessage[] = []
): Promise<{ answer: string; sourcesUsed: string[]; timestamp: string }> {
  const trimmedQuestion = question.trim().slice(0, 600);
  if (!trimmedQuestion) {
    throw new Error('Please enter a question for Air Coach.');
  }
  if (!context || !context.location || !context.currentAirQuality) {
    throw new Error('City air quality data is not loaded yet.');
  }

  // Plain fetch without AbortController/signal so React rerenders never trigger "signal is aborted without reason"
  const res = await fetch('/api/air-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: trimmedQuestion,
      context,
      recentMessages: recentMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content.slice(0, 500),
      })),
    }),
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let friendly = 'Air Coach is temporarily unavailable. Please try again.';
    if (contentType.includes('application/json')) {
      try {
        const errJson = (await res.json()) as { error?: string };
        if (errJson?.error && typeof errJson.error === 'string') {
          friendly = errJson.error;
        }
      } catch {
        // Keep friendly fallback
      }
    } else {
      await res.text().catch(() => '');
      friendly = 'Air Coach could not connect to its AI service. Please try again.';
    }

    if (res.status === 429) {
      friendly = 'Air Coach is temporarily busy. Please try again in a moment.';
    } else if (res.status === 401 || res.status === 403) {
      friendly = 'Air Coach is not configured correctly. Check the Gemini server configuration.';
    }
    throw new Error(friendly);
  }

  if (!contentType.includes('application/json')) {
    await res.text().catch(() => '');
    throw new Error('Air Coach could not connect to its AI service. Please try again.');
  }

  const data = (await res.json()) as {
    answer?: string;
    reply?: string;
    sourcesUsed?: string[];
    timestamp?: string;
  };
  const answerText = (data.answer ?? data.reply ?? '').trim();
  if (!answerText) {
    throw new Error('Air Coach returned an empty response. Please try again.');
  }

  return {
    answer: answerText,
    sourcesUsed: Array.isArray(data.sourcesUsed) ? data.sourcesUsed : [],
    timestamp: data.timestamp || new Date().toISOString(),
  };
}
