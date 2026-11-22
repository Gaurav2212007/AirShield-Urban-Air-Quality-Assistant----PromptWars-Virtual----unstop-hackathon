import type {
  AirQualityDataset,
  FamilyProfile,
  ForecastAnalysis,
  HourExposureStatus,
  HourlyForecastPoint,
  ReadinessFactor,
  WindowSummary,
} from '../types/airshield';
import { getAqiCategoryKey, getAqiSeverity } from './aqiUtils';

function findBestWindow(hours: HourlyForecastPoint[], span = 3): WindowSummary {
  if (hours.length === 0) {
    return {
      start: '',
      end: '',
      startLabel: '--:--',
      endLabel: '--:--',
      avgAqi: 0,
      maxAqi: 0,
      minAqi: 0,
    };
  }
  const effectiveSpan = Math.min(span, hours.length);
  let bestIdx = 0;
  let bestAvg = Infinity;

  for (let i = 0; i <= hours.length - effectiveSpan; i++) {
    const slice = hours.slice(i, i + effectiveSpan);
    const avg = slice.reduce((acc, h) => acc + h.usAqi, 0) / effectiveSpan;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestIdx = i;
    }
  }

  const chosen = hours.slice(bestIdx, bestIdx + effectiveSpan);
  const last = chosen[chosen.length - 1];
  return {
    start: chosen[0].time,
    end: last.time,
    startLabel: chosen[0].hourLabel,
    endLabel: last.hourLabel,
    avgAqi: Math.round(bestAvg),
    maxAqi: Math.max(...chosen.map((h) => h.usAqi)),
    minAqi: Math.min(...chosen.map((h) => h.usAqi)),
  };
}

function findWorstWindow(hours: HourlyForecastPoint[], span = 3): WindowSummary {
  if (hours.length === 0) {
    return {
      start: '',
      end: '',
      startLabel: '--:--',
      endLabel: '--:--',
      avgAqi: 0,
      maxAqi: 0,
      minAqi: 0,
    };
  }
  const effectiveSpan = Math.min(span, hours.length);
  let worstIdx = 0;
  let worstAvg = -Infinity;

  for (let i = 0; i <= hours.length - effectiveSpan; i++) {
    const slice = hours.slice(i, i + effectiveSpan);
    const avg = slice.reduce((acc, h) => acc + h.usAqi, 0) / effectiveSpan;
    if (avg > worstAvg) {
      worstAvg = avg;
      worstIdx = i;
    }
  }

  const chosen = hours.slice(worstIdx, worstIdx + effectiveSpan);
  const last = chosen[chosen.length - 1];
  return {
    start: chosen[0].time,
    end: last.time,
    startLabel: chosen[0].hourLabel,
    endLabel: last.hourLabel,
    avgAqi: Math.round(worstAvg),
    maxAqi: Math.max(...chosen.map((h) => h.usAqi)),
    minAqi: Math.min(...chosen.map((h) => h.usAqi)),
  };
}

export function classifyHourStatus(
  aqi: number,
  isInBestWindow: boolean,
  hasCleanWindow: boolean
): HourExposureStatus {
  if (aqi >= 301) return 'Lockdown Hour';
  if (aqi >= 201) {
    return isInBestWindow && !hasCleanWindow ? 'Limit Exposure' : 'Lockdown Hour';
  }
  if (aqi >= 151) {
    return isInBestWindow ? 'Use Caution' : 'Limit Exposure';
  }
  if (aqi >= 101) {
    return isInBestWindow ? 'Best Window' : 'Use Caution';
  }
  return isInBestWindow || aqi <= 75 ? 'Best Window' : 'Use Caution';
}

export function annotateHourlyForecast(
  hourly: HourlyForecastPoint[],
  bestWindow: WindowSummary,
  worstWindow: WindowSummary,
  hasCleanWindow: boolean
): HourlyForecastPoint[] {
  const next24 = hourly.slice(0, 24);
  const peakAqi = next24.length > 0 ? Math.max(...next24.map((h) => h.usAqi)) : 0;

  return hourly.map((h, idx) => {
    const inBest =
      idx < 24 &&
      bestWindow.start !== '' &&
      h.time >= bestWindow.start &&
      h.time <= bestWindow.end;
    const inWorstPeak = idx < 24 && h.usAqi >= peakAqi - 5 && worstWindow.maxAqi > 100;
    return {
      ...h,
      categoryKey: getAqiCategoryKey(h.usAqi),
      status: classifyHourStatus(h.usAqi, inBest, hasCleanWindow),
      isBestWindow: inBest,
      isPeakHour: inWorstPeak,
    };
  });
}

export function analyzeForecast(
  dataset: AirQualityDataset,
  profile: FamilyProfile
): { analysis: ForecastAnalysis; annotatedHourly: HourlyForecastPoint[] } {
  const next24 = dataset.hourly.slice(0, 24);
  const currentAqi = Math.round(
    dataset.current.usAqi ?? next24[0]?.usAqi ?? 150
  );
  const currentCategory = getAqiCategoryKey(currentAqi);

  const aqiList = next24.map((h) => h.usAqi);
  const minAqi = aqiList.length > 0 ? Math.min(...aqiList) : currentAqi;
  const maxAqi = aqiList.length > 0 ? Math.max(...aqiList) : currentAqi;
  const avgAqi =
    aqiList.length > 0
      ? Math.round(aqiList.reduce((sum, v) => sum + v, 0) / aqiList.length)
      : currentAqi;

  const bestWindow = findBestWindow(next24, 3);
  const worstWindow = findWorstWindow(next24, 3);
  const hasCleanWindow = bestWindow.avgAqi <= 100;

  // Trend detection across next 6 hours
  const nearTerm = next24.slice(0, 6);
  let trendDirection: ForecastAnalysis['trendDirection'] = 'steady';
  if (nearTerm.length >= 4) {
    const delta = nearTerm[nearTerm.length - 1].usAqi - nearTerm[0].usAqi;
    if (maxAqi - minAqi >= 90 && maxAqi >= 250) {
      trendDirection = 'inversion_spike';
    } else if (delta >= 25) {
      trendDirection = 'rising';
    } else if (delta <= -25) {
      trendDirection = 'falling';
    }
  }

  let trendNarrative = '';
  if (trendDirection === 'inversion_spike') {
    trendNarrative = `Strong winter inversion pattern ahead: US AQI peaks around ${worstWindow.startLabel}–${worstWindow.endLabel} (avg ${worstWindow.avgAqi}) and dips toward ${bestWindow.startLabel}–${bestWindow.endLabel} (avg ${bestWindow.avgAqi}).`;
  } else if (trendDirection === 'rising') {
    trendNarrative = `Pollution is expected to rise over the next few hours, peaking around ${worstWindow.startLabel}–${worstWindow.endLabel} at US AQI ~${worstWindow.maxAqi}.`;
  } else if (trendDirection === 'falling') {
    trendNarrative = `Conditions are projected to gradually ease toward ${bestWindow.startLabel}–${bestWindow.endLabel} (avg US AQI ${bestWindow.avgAqi}).`;
  } else {
    trendNarrative = `Pollution levels remain relatively elevated and steady between US AQI ${minAqi} and ${maxAqi} over the next 24 hours.`;
  }

  const bestSeverityLabel = getAqiSeverity(bestWindow.avgAqi).label;
  const windowNarrative = hasCleanWindow
    ? `Best outdoor window is ${bestWindow.startLabel}–${bestWindow.endLabel} (avg US AQI ${bestWindow.avgAqi}, ${bestSeverityLabel}).`
    : `No genuinely clean outdoor window is available in the next 24 hours. The least-polluted period is ${bestWindow.startLabel}–${bestWindow.endLabel} (avg US AQI ${bestWindow.avgAqi}, ${bestSeverityLabel}), so outdoor exposure should still be minimized.`;

  // Household Readiness Score (product-generated indicator, not medical)
  let score = 78;
  const factors: ReadinessFactor[] = [];

  if (currentAqi >= 301) {
    score -= 28;
    factors.push({
      label: 'Hazardous ambient air',
      impact: '-28',
      status: 'risk',
    });
  } else if (currentAqi >= 201) {
    score -= 20;
    factors.push({
      label: 'Very unhealthy ambient air',
      impact: '-20',
      status: 'risk',
    });
  } else if (currentAqi >= 151) {
    score -= 12;
    factors.push({
      label: 'Unhealthy ambient air',
      impact: '-12',
      status: 'risk',
    });
  } else if (currentAqi <= 50) {
    score += 12;
    factors.push({
      label: 'Clean outdoor baseline',
      impact: '+12',
      status: 'positive',
    });
  }

  if (profile.home.airPurifier === 'available') {
    score += 16;
    factors.push({
      label: 'Indoor air purifier available',
      impact: '+16',
      status: 'positive',
    });
  } else {
    score -= 12;
    factors.push({
      label: 'No air purifier in home',
      impact: '-12',
      status: 'risk',
    });
  }

  if (profile.home.windowSealing === 'good') {
    score += 8;
    factors.push({
      label: 'Good window sealing',
      impact: '+8',
      status: 'positive',
    });
  } else if (profile.home.windowSealing === 'poor') {
    score -= 10;
    factors.push({
      label: 'Poor window sealing',
      impact: '-10',
      status: 'risk',
    });
  } else {
    factors.push({
      label: 'Average window sealing',
      impact: '0',
      status: 'neutral',
    });
  }

  if (profile.home.cookingFuel === 'gas_lpg') {
    score -= 5;
    factors.push({
      label: 'Gas/LPG indoor cooking emissions',
      impact: '-5',
      status: 'risk',
    });
  } else if (profile.home.cookingFuel === 'induction_electric') {
    score += 4;
    factors.push({
      label: 'Electric/induction cooking',
      impact: '+4',
      status: 'positive',
    });
  }

  const sensitiveCount = profile.vulnerabilities.filter((v) => v !== 'none').length;
  if (sensitiveCount > 0 && currentAqi > 100) {
    const penalty = Math.min(12, sensitiveCount * 4);
    score -= penalty;
    factors.push({
      label: `${sensitiveCount} sensitive group${sensitiveCount > 1 ? 's' : ''} in household`,
      impact: `-${penalty}`,
      status: 'risk',
    });
  }

  if (profile.commuteMode === 'wfh') {
    score += 8;
    factors.push({
      label: 'Work-from-home commute flexibility',
      impact: '+8',
      status: 'positive',
    });
  } else if (profile.commuteMode === 'walking_two_wheeler' && currentAqi > 150) {
    score -= 8;
    factors.push({
      label: 'Exposed walking / two-wheeler commute',
      impact: '-8',
      status: 'risk',
    });
  }

  const readinessScore = Math.max(12, Math.min(98, Math.round(score)));
  const readinessSummary =
    readinessScore >= 75
      ? 'Your home setup is well-positioned to buffer outdoor spikes.'
      : readinessScore >= 50
      ? 'Moderate protection: focus on sealing drafts and timing outdoor trips.'
      : 'High exposure vulnerability: prioritize creating one sealed clean room immediately.';

  // Next Best Action
  let nextBestAction = '';
  if (currentAqi >= 301) {
    if (profile.home.airPurifier === 'available') {
      nextBestAction =
        'Keep all windows shut, run your purifier on medium-high in the main occupied room, and postpone outdoor errands.';
    } else if (profile.home.windowSealing === 'poor') {
      nextBestAction =
        'Close exterior doors and seal window/door gaps with damp towels to create one lower-infiltration room for the next 3 hours.';
    } else {
      nextBestAction =
        'Keep the household indoors with windows shut; avoid frying or indoor smoke until pollution dips.';
    }
  } else if (currentAqi >= 201) {
    nextBestAction = `Avoid outdoor play now; if essential errands cannot wait, aim for ${bestWindow.startLabel}–${bestWindow.endLabel} when AQI dips toward ${bestWindow.avgAqi}.`;
  } else if (currentAqi >= 101) {
    nextBestAction = `Sensitive family members should limit brisk outdoor exertion right now and plan short outings near ${bestWindow.startLabel}–${bestWindow.endLabel}.`;
  } else {
    nextBestAction =
      'Air quality is currently favorable for brief cross-ventilation before evening traffic or winter cooling sets in.';
  }

  // Conceptual Exposure Guidance (behavioral planning indicator, not medical)
  const hasAsthmaOrKids =
    profile.vulnerabilities.includes('asthma_copd') ||
    profile.vulnerabilities.includes('kids') ||
    profile.vulnerabilities.includes('elderly') ||
    profile.vulnerabilities.includes('pregnant');

  let recommendedMaxOutdoorMinutes = 180;
  let statusLabel = 'Open Routine';
  let guidance = 'Normal outdoor routines are reasonable; stay hydrated and monitor evening trends.';

  if (currentAqi >= 301) {
    recommendedMaxOutdoorMinutes = hasAsthmaOrKids ? 10 : 20;
    statusLabel = 'Essential Transit Only';
    guidance =
      'Keep non-essential outdoor time near zero today. Limit trips strictly to unavoidable transit.';
  } else if (currentAqi >= 201) {
    recommendedMaxOutdoorMinutes = hasAsthmaOrKids ? 20 : 40;
    statusLabel = 'Strict Indoor Bias';
    guidance =
      'Batch quick errands into the least-polluted window and move children’s play indoors.';
  } else if (currentAqi >= 151) {
    recommendedMaxOutdoorMinutes = hasAsthmaOrKids ? 35 : 60;
    statusLabel = 'Short Outings Only';
    guidance =
      'Keep outdoor blocks brief and avoid roadside exercise or heavy exertion.';
  } else if (currentAqi >= 101) {
    recommendedMaxOutdoorMinutes = hasAsthmaOrKids ? 60 : 120;
    statusLabel = 'Paced Outdoor Time';
    guidance =
      'Sensitive members should pace exertion and avoid peak rush-hour corridors.';
  }

  const annotatedHourly = annotateHourlyForecast(
    dataset.hourly,
    bestWindow,
    worstWindow,
    hasCleanWindow
  );

  return {
    analysis: {
      currentAqi,
      currentCategory,
      minAqi,
      maxAqi,
      avgAqi,
      bestWindow,
      worstWindow,
      hasCleanWindow,
      trendDirection,
      trendNarrative,
      windowNarrative,
      readinessScore,
      readinessSummary,
      readinessFactors: factors,
      nextBestAction,
      exposureBudget: {
        recommendedMaxOutdoorMinutes,
        statusLabel,
        guidance,
      },
    },
    annotatedHourly,
  };
}
