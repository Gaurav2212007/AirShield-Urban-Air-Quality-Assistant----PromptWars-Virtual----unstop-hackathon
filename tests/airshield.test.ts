import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAqiCategoryKey,
  getAqiSeverity,
  getHumanHeadlineForAqi,
  formatPollutant,
} from '../src/utils/aqiUtils.js';
import { classifyHourStatus } from '../src/utils/forecastAnalyzer.js';
import {
  VULNERABILITY_OPTIONS,
  COMMUTE_OPTIONS,
  PURIFIER_OPTIONS,
} from '../src/utils/profileLabels.js';

describe('AirShield Real Source Code Tests', () => {
  test('getAqiCategoryKey classifies AQI thresholds and null/undefined safely', () => {
    const lowKey = getAqiCategoryKey(35);
    const highKey = getAqiCategoryKey(350);
    const nullKey = getAqiCategoryKey(null);
    const undefKey = getAqiCategoryKey(undefined);

    assert.ok(typeof lowKey === 'string' && lowKey.length > 0);
    assert.ok(typeof highKey === 'string' && highKey.length > 0);
    assert.notEqual(lowKey, highKey);
    assert.ok(typeof nullKey === 'string');
    assert.ok(typeof undefKey === 'string');
  });

  test('getAqiSeverity and getHumanHeadlineForAqi return valid metadata and headlines', () => {
    const meta = getAqiSeverity(180);
    assert.ok(meta && typeof meta === 'object');

    const headline = getHumanHeadlineForAqi(280);
    assert.ok(typeof headline === 'string' && headline.length > 5);
  });

  test('formatPollutant handles valid numbers, null, and undefined', () => {
    const valid = formatPollutant(42.6);
    const missing = formatPollutant(null);
    const undef = formatPollutant(undefined);

    assert.ok(typeof valid === 'string' && valid.includes('43'));
    assert.ok(typeof missing === 'string' && missing.length > 0);
    assert.ok(typeof undef === 'string' && undef.length > 0);
  });

  test('classifyHourStatus categorizes hourly AQI values', () => {
    const goodHour = classifyHourStatus(40, true, false);
    const severeHour = classifyHourStatus(360, false, true);

    assert.ok(typeof goodHour === 'string' && goodHour.length > 0);
    assert.ok(typeof severeHour === 'string' && severeHour.length > 0);
    assert.notEqual(goodHour, severeHour);
  });

  test('profileLabels exports non-empty options with no restricted city strings', () => {
    assert.ok(VULNERABILITY_OPTIONS.length > 0);
    assert.ok(COMMUTE_OPTIONS.length > 0);
    assert.ok(PURIFIER_OPTIONS.length > 0);

    const serialized = JSON.stringify({
      VULNERABILITY_OPTIONS,
      COMMUTE_OPTIONS,
      PURIFIER_OPTIONS,
    });
    assert.equal(/pune|maharashtra/i.test(serialized), false);
  });
});