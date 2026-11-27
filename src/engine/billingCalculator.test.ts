import { describe, expect, it } from 'vitest';
import { APPLIANCE_PRESETS, DEFAULT_SCHEDULES } from '../data/appliances';
import { COUNTRY_CONFIGS } from '../data/countries';
import {
  calculateMonthlyProjection,
  formatCurrency,
  isOffPeakTime,
} from './billingCalculator';

describe('billingCalculator', () => {
  const waterHeater = APPLIANCE_PRESETS[0]; // 1500W

  it('detects overnight off-peak windows accurately (ID 22:00-05:00)', () => {
    const id = COUNTRY_CONFIGS.ID;
    expect(isOffPeakTime(22, 0, id)).toBe(true);
    expect(isOffPeakTime(23, 30, id)).toBe(true);
    expect(isOffPeakTime(4, 59, id)).toBe(true);
    expect(isOffPeakTime(5, 0, id)).toBe(false);
    expect(isOffPeakTime(19, 30, id)).toBe(false);
  });

  it('detects UK Economy 7 off-peak window accurately (00:30-07:30)', () => {
    const uk = COUNTRY_CONFIGS.UK;
    expect(isOffPeakTime(0, 29, uk)).toBe(false);
    expect(isOffPeakTime(0, 30, uk)).toBe(true);
    expect(isOffPeakTime(3, 0, uk)).toBe(true);
    expect(isOffPeakTime(7, 29, uk)).toBe(true);
    expect(isOffPeakTime(7, 30, uk)).toBe(false);
  });

  it('returns Rp 0 monetary off-peak savings for Indonesia Flat Tariff but positive CO2 avoided', () => {
    const proj = calculateMonthlyProjection(
      waterHeater,
      COUNTRY_CONFIGS.ID,
      DEFAULT_SCHEDULES,
      true
    );
    expect(proj.offPeakSavings).toBe(0);
    expect(formatCurrency(proj.offPeakSavings, COUNTRY_CONFIGS.ID)).toBe('Rp 0');
    expect(proj.monthlyOffPeakKwh).toBeCloseTo(45, 2); // 1.5kW * 1h * 30 days
    expect(proj.co2AvoidedKg).toBeGreaterThan(0);
    expect(proj.totalMonthlyBill).toBeCloseTo(45 * 1444.7, 1);
  });

  it('calculates positive monetary off-peak savings for TOU countries (UK, MY, SG, DE)', () => {
    const ukProj = calculateMonthlyProjection(
      waterHeater,
      COUNTRY_CONFIGS.UK,
      [
        {
          id: 'uk-night',
          socketId: 1,
          label: 'UK Economy 7 Heating',
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '01:00',
          endTime: '02:00',
          enabled: true,
        },
      ],
      true
    );
    expect(ukProj.monthlyOffPeakKwh).toBeCloseTo(45, 2);
    expect(ukProj.offPeakSavings).toBeCloseTo(45 * (0.29 - 0.13), 2);
    expect(ukProj.totalMonthlyBill).toBeCloseTo(45 * 0.13, 2);
    expect(ukProj.co2AvoidedKg).toBeCloseTo((45 * (260 - 140)) / 1000, 2);
  });
});

