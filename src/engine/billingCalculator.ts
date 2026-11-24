import {
  AppliancePreset,
  CountryTariffConfig,
  MonthlyProjection,
  ScheduleSlot,
} from '../types/simulator';

export function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(':');
  const h = Number.parseInt(hStr ?? '0', 10);
  const m = Number.parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return ((h % 24) + 24) % 24 * 60 + (((m % 60) + 60) % 60);
}

export function isOffPeakMinute(minuteOfDay: number, country: CountryTariffConfig): boolean {
  const normalized = ((minuteOfDay % 1440) + 1440) % 1440;
  const { offPeakStartMinutes, offPeakEndMinutes } = country;
  if (offPeakStartMinutes > offPeakEndMinutes) {
    // Window crosses midnight (e.g., 22:00 -> 05:00)
    return normalized >= offPeakStartMinutes || normalized < offPeakEndMinutes;
  }
  // Same-day window (e.g., 00:30 -> 07:30)
  return normalized >= offPeakStartMinutes && normalized < offPeakEndMinutes;
}

export function isOffPeakTime(
  hour: number,
  minute: number,
  country: CountryTariffConfig
): boolean {
  return isOffPeakMinute(hour * 60 + minute, country);
}

export function calculateScheduleDailyHours(
  schedules: ScheduleSlot[],
  country: CountryTariffConfig
): { dailyPeakHours: number; dailyOffPeakHours: number; hasActiveSchedules: boolean } {
  const enabledSchedules = schedules.filter((s) => s.enabled && s.days.length > 0);
  if (enabledSchedules.length === 0) {
    return { dailyPeakHours: 0, dailyOffPeakHours: 0, hasActiveSchedules: false };
  }

  // Track unique active minutes across a 7-day week (7 * 1440 = 10080 minutes)
  // so overlapping schedules don't double-count energy.
  const activeWeekMinutes = new Uint8Array(7 * 1440);

  for (const slot of enabledSchedules) {
    const startMin = parseTimeToMinutes(slot.startTime);
    const endMin = parseTimeToMinutes(slot.endTime);
    if (startMin === endMin) continue;

    const duration =
      endMin > startMin ? endMin - startMin : 1440 - startMin + endMin;

    for (const day of slot.days) {
      if (day < 0 || day > 6) continue;
      for (let offset = 0; offset < duration; offset++) {
        const weekMinute = (day * 1440 + startMin + offset) % (7 * 1440);
        activeWeekMinutes[weekMinute] = 1;
      }
    }
  }

  let weeklyPeakMinutes = 0;
  let weeklyOffPeakMinutes = 0;

  for (let i = 0; i < activeWeekMinutes.length; i++) {
    if (activeWeekMinutes[i] === 1) {
      const minuteOfDay = i % 1440;
      if (isOffPeakMinute(minuteOfDay, country)) {
        weeklyOffPeakMinutes++;
      } else {
        weeklyPeakMinutes++;
      }
    }
  }

  const totalWeeklyMinutes = weeklyPeakMinutes + weeklyOffPeakMinutes;
  if (totalWeeklyMinutes === 0) {
    return { dailyPeakHours: 0, dailyOffPeakHours: 0, hasActiveSchedules: false };
  }

  return {
    dailyPeakHours: weeklyPeakMinutes / 7 / 60,
    dailyOffPeakHours: weeklyOffPeakMinutes / 7 / 60,
    hasActiveSchedules: true,
  };
}

export function calculateMonthlyProjection(
  appliance: AppliancePreset,
  country: CountryTariffConfig,
  schedules: ScheduleSlot[],
  autoOnOffPeak: boolean
): MonthlyProjection {
  const sched = calculateScheduleDailyHours(schedules, country);

  let dailyPeakHours: number;
  let dailyOffPeakHours: number;
  let usedScheduleBasis: boolean;

  if (sched.hasActiveSchedules) {
    dailyPeakHours = sched.dailyPeakHours;
    dailyOffPeakHours = sched.dailyOffPeakHours;
    usedScheduleBasis = true;
  } else {
    usedScheduleBasis = false;
    if (autoOnOffPeak) {
      dailyOffPeakHours = appliance.defaultDailyHours * 0.75;
      dailyPeakHours = appliance.defaultDailyHours * 0.25;
    } else {
      dailyPeakHours = appliance.defaultDailyHours * 0.8;
      dailyOffPeakHours = appliance.defaultDailyHours * 0.2;
    }
  }

  const monthlyPeakKwh = (appliance.wattage * dailyPeakHours * 30) / 1000;
  const monthlyOffPeakKwh = (appliance.wattage * dailyOffPeakHours * 30) / 1000;
  const monthlyTotalKwh = monthlyPeakKwh + monthlyOffPeakKwh;

  const peakCost = monthlyPeakKwh * country.peakRate;
  const offPeakCost = monthlyOffPeakKwh * country.offPeakRate;
  const totalMonthlyBill = peakCost + offPeakCost;

  // Strict regulatory rule: Indonesia (Flat) = Rp 0 monetary arbitrage
  const offPeakSavings = country.isTOU
    ? monthlyOffPeakKwh * (country.peakRate - country.offPeakRate)
    : 0;

  const co2AvoidedKg =
    (monthlyOffPeakKwh * (country.peakCarbonGPerKwh - country.offPeakCarbonGPerKwh)) / 1000;

  const peakLoadShavedKw = dailyOffPeakHours > 0 ? appliance.wattage / 1000 : 0;

  return {
    dailyPeakHours,
    dailyOffPeakHours,
    monthlyPeakKwh,
    monthlyOffPeakKwh,
    monthlyTotalKwh,
    peakCost,
    offPeakCost,
    totalMonthlyBill,
    offPeakSavings,
    co2AvoidedKg,
    peakLoadShavedKw,
    usedScheduleBasis,
  };
}

export function formatCurrency(amount: number, country: CountryTariffConfig): string {
  if (country.code === 'ID') {
    const rounded = Math.round(amount);
    return `${country.currencySymbol}${rounded.toLocaleString('en-US')}`;
  }
  return `${country.currencySymbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRate(rate: number, country: CountryTariffConfig): string {
  if (country.code === 'ID') {
    return `${country.currencySymbol}${rate.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}/kWh`;
  }
  return `${country.currencySymbol}${rate.toFixed(2)}/kWh`;
}

