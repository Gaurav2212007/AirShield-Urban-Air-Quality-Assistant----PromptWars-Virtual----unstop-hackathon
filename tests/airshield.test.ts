import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAqiCategoryKey,
  getAqiSeverity,
  getHumanHeadlineForAqi,
  formatHourLabel,
  formatDayLabel,
  getLocationLocalClockString,
  getLocationCurrentHourIsoPrefix,
  formatRelativeMinutes,
  formatPollutant,
} from '../src/utils/aqiUtils.js';
import {
  classifyHourStatus,
  annotateHourlyForecast,
  analyzeForecast,
} from '../src/utils/forecastAnalyzer.js';
import { generateDeterministicPlan } from '../src/utils/fallbackPlanEngine.js';
import {
  VULNERABILITY_OPTIONS,
  PURIFIER_OPTIONS,
  COOKING_FUEL_OPTIONS,
  SEALING_OPTIONS,
  COMMUTE_OPTIONS,
  getVulnerabilityLabel,
  getCommuteLabel,
  getCookingLabel,
  getSealingLabel,
} from '../src/utils/profileLabels.js';
import { normalizeOpenMeteoResponse } from '../src/services/aqiService.js';
import {
  validateAirPlan,
  buildAirCoachContext,
  generateDeterministicCoachAnswer,
} from '../src/services/geminiService.js';
import type {
  AirQualityDataset,
  FamilyProfile,
  HourlyForecastPoint,
  Location,
} from '../src/types/airshield.js';

const mockLocation: Location = {
  id: 'delhi-in',
  name: 'New Delhi',
  region: 'Delhi',
  country: 'India',
  countryCode: 'IN',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
};

function buildMockHourly(baseAqi: number, spikeAtEvening = true): HourlyForecastPoint[] {
  const hours: HourlyForecastPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const hourStr = String(i).padStart(2, '0');
    const time = `2026-11-23T${hourStr}:00`;
    let usAqi = baseAqi;
    if (i >= 5 && i <= 8) usAqi = Math.max(25, Math.round(baseAqi * 0.55));
    if (spikeAtEvening && i >= 18 && i <= 21) usAqi = Math.min(480, Math.round(baseAqi * 1.45));

    hours.push({
      time,
      hourLabel: `${hourStr}:00`,
      dayLabel: 'Today',
      usAqi,
      pm25: Math.round(usAqi * 0.6),
      pm10: Math.round(usAqi * 0.9),
      o3: 32,
      no2: 28,
      categoryKey: getAqiCategoryKey(usAqi),
      status: 'Use Caution',
      isCurrentHour: i === 10,
      isBestWindow: false,
      isPeakHour: false,
    });
  }
  return hours;
}

function buildMockDataset(baseAqi: number, spikeAtEvening = true): AirQualityDataset {
  const hourly = buildMockHourly(baseAqi, spikeAtEvening);
  return {
    location: mockLocation,
    current: {
      time: '2026-11-23T10:00',
      usAqi: baseAqi,
      pm25: Math.round(baseAqi * 0.6),
      pm10: Math.round(baseAqi * 0.9),
      o3: 32,
      no2: 28,
    },
    hourly,
    source: 'live',
    fetchedAt: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
  };
}

const vulnerableProfile: FamilyProfile = {
  location: mockLocation,
  vulnerabilities: ['kids', 'elderly', 'asthma_copd', 'pregnant'],
  home: {
    airPurifier: 'none',
    cookingFuel: 'gas_lpg',
    windowSealing: 'poor',
    hasBalcony: true,
    hasIndoorPlants: true,
  },
  commuteMode: 'walking_two_wheeler',
  updatedAt: '2026-11-23T09:00:00Z',
};

const lowRiskProfile: FamilyProfile = {
  location: mockLocation,
  vulnerabilities: ['none'],
  home: {
    airPurifier: 'available',
    cookingFuel: 'induction_electric',
    windowSealing: 'good',
    hasBalcony: false,
    hasIndoorPlants: false,
  },
  commuteMode: 'wfh',
  updatedAt: '2026-11-23T09:00:00Z',
};

describe('1. aqiUtils Thresholds, Formatting & Time Helpers', () => {
  test('getAqiCategoryKey maps all 6 EPA AQI bands and null/undefined', () => {
    assert.equal(getAqiCategoryKey(25), 'good');
    assert.equal(getAqiCategoryKey(75), 'moderate');
    assert.equal(getAqiCategoryKey(125), 'sensitive');
    assert.equal(getAqiCategoryKey(175), 'unhealthy');
    assert.equal(getAqiCategoryKey(250), 'very_unhealthy');
    assert.equal(getAqiCategoryKey(380), 'hazardous');
    assert.equal(getAqiCategoryKey(null), 'moderate');
    assert.equal(getAqiCategoryKey(undefined), 'moderate');
  });

  test('getAqiSeverity and getHumanHeadlineForAqi cover all severity levels', () => {
    for (const val of [30, 80, 130, 180, 260, 410, null]) {
      const meta = getAqiSeverity(val);
      const headline = getHumanHeadlineForAqi(val);
      assert.ok(meta && typeof meta.label === 'string');
      assert.ok(typeof headline === 'string' && headline.length > 5);
    }
  });

  test('time and pollutant formatting helpers handle valid and edge inputs', () => {
    assert.ok(formatHourLabel('2026-11-23T08:00').length > 0);
    assert.ok(formatHourLabel('invalid-date').length > 0);
    assert.ok(formatDayLabel('2026-11-23T08:00').length > 0);
    assert.ok(formatDayLabel('invalid-date').length > 0);
    assert.ok(getLocationLocalClockString('Asia/Kolkata').length > 0);
    assert.ok(getLocationLocalClockString('Invalid/Timezone').length > 0);
    assert.ok(getLocationCurrentHourIsoPrefix('Asia/Kolkata').includes('T'));
    assert.ok(formatRelativeMinutes(new Date(Date.now() - 120_000).toISOString()).length > 0);
    assert.ok(formatRelativeMinutes('bad-timestamp').length > 0);
    assert.ok(formatPollutant(42.6).includes('43'));
    assert.ok(formatPollutant(null).length > 0);
    assert.ok(formatPollutant(undefined).length > 0);
  });
});

describe('2. forecastAnalyzer & Exposure Window Detection', () => {
  test('classifyHourStatus handles clean windows, caution, limit exposure, and lockdown', () => {
    assert.equal(classifyHourStatus(40, true, true), 'Best Window');
    assert.equal(classifyHourStatus(90, false, true), 'Use Caution');
    assert.equal(classifyHourStatus(180, false, false), 'Limit Exposure');
    assert.equal(classifyHourStatus(340, false, false), 'Lockdown Hour');
  });

  test('analyzeForecast computes windows, trend, readiness score, and annotated hours across AQI levels', () => {
    const highDataset = buildMockDataset(240, true);
    const { analysis: highAnalysis, annotatedHourly } = analyzeForecast(highDataset, vulnerableProfile);

    assert.equal(annotatedHourly.length, 24);
    assert.equal(highAnalysis.currentAqi, 240);
    assert.ok(highAnalysis.bestWindow.minAqi <= highAnalysis.worstWindow.maxAqi);
    assert.ok(highAnalysis.readinessScore >= 0 && highAnalysis.readinessScore <= 100);
    assert.ok(highAnalysis.readinessFactors.length > 0);
    assert.ok(highAnalysis.exposureBudget.recommendedMaxOutdoorMinutes >= 0);

    const cleanDataset = buildMockDataset(42, false);
    const { analysis: cleanAnalysis } = analyzeForecast(cleanDataset, lowRiskProfile);
    assert.equal(cleanAnalysis.hasCleanWindow, true);
    assert.ok(cleanAnalysis.readinessScore > highAnalysis.readinessScore);

    const reannotated = annotateHourlyForecast(
      cleanDataset.hourly,
      cleanAnalysis.bestWindow,
      cleanAnalysis.worstWindow,
      cleanAnalysis.hasCleanWindow
    );
    assert.equal(reannotated.length, 24);
  });
});

describe('3. fallbackPlanEngine Deterministic Guidance', () => {
  test('generateDeterministicPlan produces complete valid AirPlan for severe & good conditions', () => {
    for (const [aqi, profile] of [
      [340, vulnerableProfile],
      [185, vulnerableProfile],
      [85, lowRiskProfile],
      [35, lowRiskProfile],
    ] as const) {
      const dataset = buildMockDataset(aqi, aqi > 100);
      const { analysis } = analyzeForecast(dataset, profile);
      const plan = generateDeterministicPlan(dataset, profile, analysis);

      assert.equal(validateAirPlan(plan), true);
      assert.equal(plan.generatedBy, 'deterministic');
      assert.ok(plan.indoorHacks.length > 0);
      assert.ok(plan.commuteRecommendations.length > 0);
      assert.ok(plan.microHabits.length > 0);
      assert.ok(plan.topPriorities.length > 0);
    }
  });
});

describe('4. profileLabels & Data Hygiene', () => {
  test('all option arrays and label getters return valid strings without restricted city names', () => {
    assert.ok(VULNERABILITY_OPTIONS.length >= 5);
    assert.ok(PURIFIER_OPTIONS.length >= 2);
    assert.ok(COOKING_FUEL_OPTIONS.length >= 2);
    assert.ok(SEALING_OPTIONS.length >= 3);
    assert.ok(COMMUTE_OPTIONS.length >= 4);

    assert.ok(getVulnerabilityLabel('asthma_copd').length > 0);
    assert.ok(getCommuteLabel('walking_two_wheeler').length > 0);
    assert.ok(getCookingLabel('gas_lpg').length > 0);
    assert.ok(getSealingLabel('poor').length > 0);

    const allText = JSON.stringify({
      VULNERABILITY_OPTIONS,
      PURIFIER_OPTIONS,
      COOKING_FUEL_OPTIONS,
      SEALING_OPTIONS,
      COMMUTE_OPTIONS,
    });
    assert.equal(/pune|maharashtra/i.test(allText), false);
  });
});

describe('5. aqiService Normalization & geminiService Validation / Air Coach', () => {
  test('normalizeOpenMeteoResponse handles valid payloads and rejects empty/malformed ones', () => {
    assert.equal(normalizeOpenMeteoResponse({}, mockLocation), null);
    assert.equal(normalizeOpenMeteoResponse({ hourly: { time: [] } }, mockLocation), null);

    const validNormalized = normalizeOpenMeteoResponse(
      {
        timezone: 'Asia/Kolkata',
        hourly: {
          time: ['2026-11-23T10:00', '2026-11-23T11:00'],
          us_aqi: [165, 152],
          pm2_5: [82.4, 75.0],
          pm10: [120.1, 110.5],
          ozone: [41.2, 44.0],
          nitrogen_dioxide: [33.5, 30.2],
        },
      },
      mockLocation
    );

    assert.ok(validNormalized !== null);
    assert.equal(validNormalized?.hourly.length, 2);
    assert.equal(validNormalized?.source, 'live');
  });

  test('validateAirPlan rejects malformed objects and Air Coach builds context & answers', () => {
    assert.equal(validateAirPlan(null), false);
    assert.equal(validateAirPlan({}), false);
    assert.equal(validateAirPlan({ overallAssessment: { headline: 'x' } }), false);

    const dataset = buildMockDataset(210, true);
    const { analysis } = analyzeForecast(dataset, vulnerableProfile);
    const ctx = buildAirCoachContext(dataset, vulnerableProfile, analysis);

    assert.equal(ctx.location.city, 'New Delhi');
    assert.equal(ctx.currentAirQuality.usAqi, 210);

    for (const q of [
      'When is the safest window to go outside today?',
      'How can I reduce indoor smoke while cooking?',
      'What mask should I wear for my two-wheeler commute?',
      'Is it safe for my kids and elderly parents right now?',
    ]) {
      const answer = generateDeterministicCoachAnswer(q, dataset, vulnerableProfile, analysis);
      assert.ok(typeof answer === 'string' && answer.length > 20);
    }
  });
});