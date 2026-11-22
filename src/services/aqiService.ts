import { buildDemoAirQualityDataset } from '../data/demoData';
import type {
  AirQualityDataset,
  HourlyForecastPoint,
  Location,
} from '../types/airshield';
import {
  formatDayLabel,
  formatHourLabel,
  getAqiCategoryKey,
  getLocationCurrentHourIsoPrefix,
} from '../utils/aqiUtils';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const AIR_QUALITY_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const CACHE_STORAGE_KEY = 'airshield_aqi_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes fresh window

interface CachedEntry {
  dataset: AirQualityDataset;
  savedAtMs: number;
}

const memoryCache = new Map<string, CachedEntry>();

interface OpenMeteoGeoResult {
  id?: number;
  name?: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

interface OpenMeteoAirQualityResponse {
  timezone?: string;
  hourly?: {
    time?: Array<string | null>;
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
    us_aqi?: Array<number | null>;
    ozone?: Array<number | null>;
    nitrogen_dioxide?: Array<number | null>;
  };
}

function getLocationCacheKey(loc: Pick<Location, 'latitude' | 'longitude'>): string {
  return `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;
}

function readLocalCache(key: string): CachedEntry | null {
  const inMem = memoryCache.get(key);
  if (inMem) return inMem;

  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, CachedEntry>;
    const entry = parsed[key];
    if (entry && entry.dataset && Array.isArray(entry.dataset.hourly)) {
      memoryCache.set(key, entry);
      return entry;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function writeLocalCache(key: string, dataset: AirQualityDataset): void {
  const entry: CachedEntry = { dataset, savedAtMs: Date.now() };
  memoryCache.set(key, entry);
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    const parsed: Record<string, CachedEntry> = raw ? JSON.parse(raw) : {};
    parsed[key] = entry;
    // Keep cache compact (last 6 locations)
    const keys = Object.keys(parsed);
    if (keys.length > 6) {
      keys
        .sort((a, b) => (parsed[a]?.savedAtMs ?? 0) - (parsed[b]?.savedAtMs ?? 0))
        .slice(0, keys.length - 6)
        .forEach((oldKey) => delete parsed[oldKey]);
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota errors
  }
}

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<{ results: Location[]; error?: string }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { results: [] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const onParentAbort = () => controller.abort();
  signal?.addEventListener('abort', onParentAbort);

  try {
    const url = new URL(GEOCODING_ENDPOINT);
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '8');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      return {
        results: [],
        error: 'City search is temporarily unavailable. You can pick a preset city below.',
      };
    }

    const data = (await res.json()) as { results?: OpenMeteoGeoResult[] };
    const rawList = Array.isArray(data.results) ? data.results : [];

    const results: Location[] = rawList
      .filter(
        (item) =>
          typeof item.name === 'string' &&
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number'
      )
      .map((item) => ({
        id: String(item.id ?? `${item.latitude}_${item.longitude}`),
        name: item.name as string,
        region: typeof item.admin1 === 'string' ? item.admin1 : undefined,
        country: typeof item.country === 'string' ? item.country : 'Unknown',
        countryCode: typeof item.country_code === 'string' ? item.country_code : undefined,
        latitude: item.latitude as number,
        longitude: item.longitude as number,
        timezone: typeof item.timezone === 'string' ? item.timezone : 'auto',
      }));

    return { results };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError' && signal?.aborted) {
      return { results: [] };
    }
    return {
      results: [],
      error: 'Unable to reach city search right now. Check connection or pick a preset city.',
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onParentAbort);
  }
}

function safeNumber(val: unknown): number | null {
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

function estimateUsAqiFromPm25(pm25: number | null): number | null {
  if (pm25 === null || pm25 < 0) return null;
  const breakpoints = [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ];
  for (const bp of breakpoints) {
    if (pm25 <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
      );
    }
  }
  return 500;
}

export function normalizeOpenMeteoResponse(
  raw: OpenMeteoAirQualityResponse,
  location: Location
): AirQualityDataset | null {
  const hourly = raw?.hourly;
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    return null;
  }

  const resolvedTz =
    typeof raw.timezone === 'string' && raw.timezone.length > 0
      ? raw.timezone
      : location.timezone && location.timezone !== 'auto'
      ? location.timezone
      : 'UTC';

  const currentHourPrefix = getLocationCurrentHourIsoPrefix(resolvedTz);

  const rawPoints: Array<{
    time: string;
    usAqi: number;
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
  }> = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i];
    if (typeof t !== 'string' || !t) continue;

    const pm25 = safeNumber(hourly.pm2_5?.[i]);
    const pm10 = safeNumber(hourly.pm10?.[i]);
    const o3 = safeNumber(hourly.ozone?.[i]);
    const no2 = safeNumber(hourly.nitrogen_dioxide?.[i]);
    const usAqiRaw = safeNumber(hourly.us_aqi?.[i]);
    const resolvedAqi = usAqiRaw ?? estimateUsAqiFromPm25(pm25);

    if (resolvedAqi === null && pm25 === null && pm10 === null) {
      continue;
    }

    rawPoints.push({
      time: t,
      usAqi: Math.max(0, Math.round(resolvedAqi ?? 0)),
      pm25: Math.max(0, Math.round(pm25 ?? 0)),
      pm10: Math.max(0, Math.round(pm10 ?? 0)),
      o3: Math.max(0, Math.round(o3 ?? 0)),
      no2: Math.max(0, Math.round(no2 ?? 0)),
    });
  }

  if (rawPoints.length === 0) {
    return null;
  }

  let startIndex = rawPoints.findIndex((p) => p.time >= currentHourPrefix);
  if (startIndex === -1) {
    startIndex = 0;
  }

  const windowPoints = rawPoints.slice(startIndex, startIndex + 48);
  const effectivePoints = windowPoints.length >= 6 ? windowPoints : rawPoints.slice(0, 48);

  const normalizedHourly: HourlyForecastPoint[] = effectivePoints.map((pt, idx) => ({
    time: pt.time,
    hourLabel: formatHourLabel(pt.time),
    dayLabel: formatDayLabel(pt.time),
    usAqi: pt.usAqi,
    pm25: pt.pm25,
    pm10: pt.pm10,
    o3: pt.o3,
    no2: pt.no2,
    categoryKey: getAqiCategoryKey(pt.usAqi),
    status: pt.usAqi >= 301 ? 'Lockdown Hour' : pt.usAqi >= 151 ? 'Limit Exposure' : 'Use Caution',
    isCurrentHour: idx === 0,
    isBestWindow: false,
    isPeakHour: false,
  }));

  const currentIdx = rawPoints.findIndex((p) => p.time === effectivePoints[0].time);
  const rawCurrentIdx = currentIdx >= 0 ? currentIdx : 0;

  return {
    location: {
      ...location,
      timezone: resolvedTz,
    },
    current: {
      time: effectivePoints[0].time,
      usAqi: safeNumber(hourly.us_aqi?.[rawCurrentIdx]) ?? effectivePoints[0].usAqi,
      pm25: safeNumber(hourly.pm2_5?.[rawCurrentIdx]),
      pm10: safeNumber(hourly.pm10?.[rawCurrentIdx]),
      o3: safeNumber(hourly.ozone?.[rawCurrentIdx]),
      no2: safeNumber(hourly.nitrogen_dioxide?.[rawCurrentIdx]),
    },
    hourly: normalizedHourly,
    source: 'live',
    fetchedAt: new Date().toISOString(),
    timezone: resolvedTz,
  };
}

export interface FetchAirQualityResult {
  dataset: AirQualityDataset;
  warning?: string;
}

export async function fetchAirQuality(
  location: Location,
  options: { forceRefresh?: boolean } = {}
): Promise<FetchAirQualityResult> {
  const cacheKey = getLocationCacheKey(location);
  const cached = readLocalCache(cacheKey);

  if (!options.forceRefresh && cached && Date.now() - cached.savedAtMs < CACHE_TTL_MS) {
    return { dataset: cached.dataset };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);

  try {
    const url = new URL(AIR_QUALITY_ENDPOINT);
    url.searchParams.set('latitude', String(location.latitude));
    url.searchParams.set('longitude', String(location.longitude));
    url.searchParams.set('hourly', 'pm2_5,pm10,us_aqi,ozone,nitrogen_dioxide');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '3');

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = (await res.json()) as OpenMeteoAirQualityResponse;
    const normalized = normalizeOpenMeteoResponse(json, location);
    if (!normalized) {
      throw new Error('Malformed Open-Meteo response');
    }

    writeLocalCache(cacheKey, normalized);
    return { dataset: normalized };
  } catch {
    // Prefer preserving last valid live data for this city over wiping with demo data
    if (cached) {
      return {
        dataset: {
          ...cached.dataset,
          source: 'cached',
        },
        warning:
          'Unable to refresh live air data right now. Showing your most recent valid reading for this city.',
      };
    }

    return {
      dataset: buildDemoAirQualityDataset(location, true),
      warning:
        'Live air data is temporarily unavailable. AirShield has switched to its offline dataset so you can still explore the experience.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
