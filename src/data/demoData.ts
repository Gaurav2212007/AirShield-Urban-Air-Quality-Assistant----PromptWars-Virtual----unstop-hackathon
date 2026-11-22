import type {
  AirQualityDataset,
  FamilyProfile,
  HourlyForecastPoint,
  Location,
} from '../types/airshield';
import {
  formatDayLabel,
  formatHourLabel,
  getAqiCategoryKey,
  getLocationCurrentHourIsoPrefix,
} from '../utils/aqiUtils';

export const DEMO_LOCATION: Location = {
  id: 'demo-delhi-in',
  name: 'Delhi',
  region: 'National Capital Territory',
  country: 'India',
  countryCode: 'IN',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
};

export const POPULAR_CITIES: Location[] = [
  DEMO_LOCATION,
  {
    id: 'preset-New Delhi-in',
    name: 'New Delhi',
    region: 'Metro',
    country: 'India',
    countryCode: 'IN',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'preset-mumbai-in',
    name: 'Mumbai',
    region: 'Metro',
    country: 'India',
    countryCode: 'IN',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'preset-lahore-pk',
    name: 'Lahore',
    region: 'Punjab',
    country: 'Pakistan',
    countryCode: 'PK',
    latitude: 31.5204,
    longitude: 74.3587,
    timezone: 'Asia/Karachi',
  },
  {
    id: 'preset-beijing-cn',
    name: 'Beijing',
    region: 'Beijing',
    country: 'China',
    countryCode: 'CN',
    latitude: 39.9042,
    longitude: 116.4074,
    timezone: 'Asia/Shanghai',
  },
  {
    id: 'preset-london-gb',
    name: 'London',
    region: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5072,
    longitude: -0.1276,
    timezone: 'Europe/London',
  },
  {
    id: 'preset-newyork-us',
    name: 'New York',
    region: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
  {
    id: 'preset-tokyo-jp',
    name: 'Tokyo',
    region: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  },
];

export const DEMO_FAMILY_PROFILE: FamilyProfile = {
  location: DEMO_LOCATION,
  vulnerabilities: ['kids', 'elderly'],
  home: {
    airPurifier: 'none',
    cookingFuel: 'gas_lpg',
    windowSealing: 'poor',
    hasBalcony: true,
    hasIndoorPlants: true,
  },
  commuteMode: 'public_transit',
  updatedAt: new Date().toISOString(),
};

// Realistic winter inversion hourly AQI curve anchored around severe winter smog (~340 current)
const WINTER_INVERSION_CURVE: Array<{
  hour: number;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}> = [
  { hour: 0, aqi: 356, pm25: 224, pm10: 348, o3: 24, no2: 88 },
  { hour: 1, aqi: 368, pm25: 234, pm10: 360, o3: 22, no2: 91 },
  { hour: 2, aqi: 374, pm25: 240, pm10: 368, o3: 20, no2: 90 },
  { hour: 3, aqi: 379, pm25: 246, pm10: 374, o3: 19, no2: 86 },
  { hour: 4, aqi: 382, pm25: 249, pm10: 380, o3: 18, no2: 84 },
  { hour: 5, aqi: 386, pm25: 253, pm10: 385, o3: 19, no2: 87 },
  { hour: 6, aqi: 378, pm25: 244, pm10: 376, o3: 22, no2: 92 },
  { hour: 7, aqi: 362, pm25: 229, pm10: 355, o3: 26, no2: 96 },
  { hour: 8, aqi: 348, pm25: 218, pm10: 342, o3: 32, no2: 94 },
  { hour: 9, aqi: 326, pm25: 198, pm10: 316, o3: 38, no2: 86 },
  { hour: 10, aqi: 294, pm25: 174, pm10: 282, o3: 45, no2: 74 },
  { hour: 11, aqi: 262, pm25: 151, pm10: 246, o3: 52, no2: 64 },
  { hour: 12, aqi: 238, pm25: 134, pm10: 220, o3: 58, no2: 56 },
  { hour: 13, aqi: 222, pm25: 122, pm10: 204, o3: 62, no2: 52 },
  { hour: 14, aqi: 218, pm25: 119, pm10: 198, o3: 64, no2: 50 },
  { hour: 15, aqi: 234, pm25: 131, pm10: 216, o3: 59, no2: 58 },
  { hour: 16, aqi: 268, pm25: 156, pm10: 254, o3: 50, no2: 68 },
  { hour: 17, aqi: 308, pm25: 186, pm10: 296, o3: 40, no2: 79 },
  { hour: 18, aqi: 340, pm25: 210, pm10: 330, o3: 42, no2: 78 },
  { hour: 19, aqi: 364, pm25: 231, pm10: 356, o3: 33, no2: 86 },
  { hour: 20, aqi: 384, pm25: 251, pm10: 378, o3: 28, no2: 94 },
  { hour: 21, aqi: 396, pm25: 264, pm10: 392, o3: 25, no2: 98 },
  { hour: 22, aqi: 390, pm25: 258, pm10: 384, o3: 24, no2: 95 },
  { hour: 23, aqi: 372, pm25: 238, pm10: 366, o3: 23, no2: 90 },
];

export function buildDemoAirQualityDataset(
  targetLocation: Location = DEMO_LOCATION,
  isOfflineFallback = false
): AirQualityDataset {
  const tz = targetLocation.timezone || 'Asia/Kolkata';
  const currentPrefix = getLocationCurrentHourIsoPrefix(tz);
  const [datePart, timePart] = currentPrefix.split('T');
  const currentHourNum = parseInt(timePart?.slice(0, 2) || '18', 10);

  const baseDate = new Date(`${datePart}T00:00:00Z`);
  const hourly: HourlyForecastPoint[] = [];

  for (let offset = 0; offset < 48; offset++) {
    const absHour = currentHourNum + offset;
    const dayOffset = Math.floor(absHour / 24);
    const hourOfDay = absHour % 24;
    const d = new Date(baseDate.getTime() + dayOffset * 86400000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(hourOfDay).padStart(2, '0');
    const isoTime = `${yyyy}-${mm}-${dd}T${hh}:00`;

    // Use exact benchmark anchor (AQI 340, PM2.5 210, PM10 330, O3 42, NO2 78) at offset 0
    // so the severe winter smog benchmark is immediately coherent regardless of clock hour,
    // while projecting the realistic inversion curve across subsequent hours.
    const patternIndex = (18 + offset) % 24;
    const sample = WINTER_INVERSION_CURVE[patternIndex];
    const day2Dampening = offset >= 24 ? 0.96 : 1;

    const usAqi = Math.round(sample.aqi * day2Dampening);
    const pm25 = Math.round(sample.pm25 * day2Dampening);
    const pm10 = Math.round(sample.pm10 * day2Dampening);
    const o3 = Math.round(sample.o3);
    const no2 = Math.round(sample.no2);

    hourly.push({
      time: isoTime,
      hourLabel: formatHourLabel(isoTime),
      dayLabel: formatDayLabel(isoTime),
      usAqi,
      pm25,
      pm10,
      o3,
      no2,
      categoryKey: getAqiCategoryKey(usAqi),
      status:
        usAqi >= 301
          ? 'Lockdown Hour'
          : usAqi >= 240
          ? 'Limit Exposure'
          : 'Use Caution',
      isCurrentHour: offset === 0,
      isBestWindow: false,
      isPeakHour: false,
    });
  }

  const first = hourly[0];
  return {
    location: targetLocation,
    current: {
      time: first.time,
      usAqi: first.usAqi,
      pm25: first.pm25,
      pm10: first.pm10,
      o3: first.o3,
      no2: first.no2,
    },
    hourly,
    source: 'demo',
    fetchedAt: new Date().toISOString(),
    timezone: tz,
    isOfflineFallback,
  };
}
