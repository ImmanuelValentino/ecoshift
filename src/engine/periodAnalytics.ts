import {
  ChartBarDatum,
  ChartPeriodMode,
  CountryTariffConfig,
  PeriodAnalyticsSummary,
  ScheduleSlot,
  SocketId,
  SocketState,
} from '../types/simulator';
import { calculateScheduleDailyHours } from './billingCalculator';

const DAY_NAMES_MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const MIN_WEEKLY_OFFSET = -51; // 52 weeks total (1 year)
export const MIN_MONTHLY_OFFSET = -11; // 12 months total (1 year)

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function seededFactor(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateDeterministicDayKwh(daySeed: number): {
  s1Kwh: number;
  s2Kwh: number;
  s3Kwh: number;
  s4Kwh: number;
} {
  const f1 = seededFactor(daySeed * 4 + 1);
  const f2 = seededFactor(daySeed * 4 + 2);
  const f3 = seededFactor(daySeed * 4 + 3);
  const f4 = seededFactor(daySeed * 4 + 4);

  // Realistic daily usage profiles matching 1,500W, 900W, 350W, 65W appliances
  const s1Kwh = Number((1.75 + f1 * 1.15).toFixed(3)); // ~1.75 - 2.90 kWh
  const s2Kwh = Number((4.10 + f2 * 1.65).toFixed(3)); // ~4.10 - 5.75 kWh
  const s3Kwh = Number((1.05 + f3 * 0.55).toFixed(3)); // ~1.05 - 1.60 kWh
  const s4Kwh = Number((0.16 + f4 * 0.12).toFixed(3)); // ~0.16 - 0.28 kWh

  return { s1Kwh, s2Kwh, s3Kwh, s4Kwh };
}

function getSocketOffPeakShare(
  socketId: SocketId,
  country: CountryTariffConfig,
  schedules: ScheduleSlot[],
  autoOnOffPeak: boolean
): number {
  const sockSchedules = schedules.filter((s) => s.socketId === socketId);
  const sched = calculateScheduleDailyHours(sockSchedules, country);
  if (sched.hasActiveSchedules) {
    const total = sched.dailyPeakHours + sched.dailyOffPeakHours;
    return total > 0 ? sched.dailyOffPeakHours / total : 0.5;
  }

  if (socketId === 1) return autoOnOffPeak ? 0.78 : 0.32;
  if (socketId === 2) return autoOnOffPeak ? 0.65 : 0.3;
  if (socketId === 3) return 0.28;
  return autoOnOffPeak ? 0.45 : 0.35;
}

function buildBarMetrics(
  id: string,
  label: string,
  tooltipLabel: string,
  kwh: { s1Kwh: number; s2Kwh: number; s3Kwh: number; s4Kwh: number },
  country: CountryTariffConfig,
  offPeakShares: Record<SocketId, number>
): ChartBarDatum {
  const totalKwh = kwh.s1Kwh + kwh.s2Kwh + kwh.s3Kwh + kwh.s4Kwh;
  const offPeakKwh =
    kwh.s1Kwh * offPeakShares[1] +
    kwh.s2Kwh * offPeakShares[2] +
    kwh.s3Kwh * offPeakShares[3] +
    kwh.s4Kwh * offPeakShares[4];
  const peakKwh = Math.max(0, totalKwh - offPeakKwh);

  const peakCost = peakKwh * country.peakRate;
  const offPeakCost = offPeakKwh * country.offPeakRate;
  const cost = peakCost + offPeakCost;
  const savings = country.isTOU
    ? offPeakKwh * (country.peakRate - country.offPeakRate)
    : 0;
  const co2AvoidedKg =
    (offPeakKwh * (country.peakCarbonGPerKwh - country.offPeakCarbonGPerKwh)) / 1000;

  return {
    id,
    label,
    tooltipLabel,
    s1Kwh: kwh.s1Kwh,
    s2Kwh: kwh.s2Kwh,
    s3Kwh: kwh.s3Kwh,
    s4Kwh: kwh.s4Kwh,
    totalKwh,
    peakKwh,
    offPeakKwh,
    peakCost,
    offPeakCost,
    cost,
    savings,
    co2AvoidedKg,
  };
}

function formatWeekRangeLabel(monday: Date, sunday: Date): string {
  const mDay = monday.getDate();
  const mMon = MONTH_NAMES_SHORT[monday.getMonth()];
  const mYear = monday.getFullYear();

  const sDay = sunday.getDate();
  const sMon = MONTH_NAMES_SHORT[sunday.getMonth()];
  const sYear = sunday.getFullYear();

  if (mYear === sYear) {
    return `${mDay} ${mMon} - ${sDay} ${sMon} ${sYear}`;
  }
  return `${mDay} ${mMon} ${mYear} - ${sDay} ${sMon} ${sYear}`;
}

export function buildPeriodAnalytics(params: {
  mode: ChartPeriodMode;
  periodOffset: number;
  referenceDate: Date;
  sockets: SocketState[];
  completedSimulatedDays: Record<number, { s1Kwh: number; s2Kwh: number; s3Kwh: number; s4Kwh: number }>;
  simulatedDaysElapsed: number;
  country: CountryTariffConfig;
  schedules: ScheduleSlot[];
  autoOnOffPeak: boolean;
}): PeriodAnalyticsSummary {
  const {
    mode,
    periodOffset,
    referenceDate,
    sockets,
    completedSimulatedDays,
    simulatedDaysElapsed,
    country,
    schedules,
    autoOnOffPeak,
  } = params;

  const offPeakShares: Record<SocketId, number> = {
    1: getSocketOffPeakShare(1, country, schedules, autoOnOffPeak),
    2: getSocketOffPeakShare(2, country, schedules, autoOnOffPeak),
    3: getSocketOffPeakShare(3, country, schedules, autoOnOffPeak),
    4: getSocketOffPeakShare(4, country, schedules, autoOnOffPeak),
  };

  const liveTodayKwh = {
    s1Kwh: sockets[0]?.dailyKwh ?? 0,
    s2Kwh: sockets[1]?.dailyKwh ?? 0,
    s3Kwh: sockets[2]?.dailyKwh ?? 0,
    s4Kwh: sockets[3]?.dailyKwh ?? 0,
  };

  const bars: ChartBarDatum[] = [];
  let periodLabel = '';

  const todayMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  if (mode === 'weekly') {
    const clampedOffset = Math.max(MIN_WEEKLY_OFFSET, Math.min(0, periodOffset));
    const jsDay = todayMidnight.getDay();
    const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
    const currentMonday = addDays(todayMidnight, diffToMonday);
    const targetMonday = addDays(currentMonday, clampedOffset * 7);
    const targetSunday = addDays(targetMonday, 6);
    const todayMonIdx = jsDay === 0 ? 6 : jsDay - 1;

    periodLabel = formatWeekRangeLabel(targetMonday, targetSunday);

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const barDate = addDays(targetMonday, dayIdx);
      const dayLabel = DAY_NAMES_MON_FIRST[dayIdx];
      const tooltipLabel = `${dayLabel}, ${barDate.getDate()} ${MONTH_NAMES_SHORT[barDate.getMonth()]}`;
      const epochDay = Math.floor(barDate.getTime() / 86400000);

      let kwh: { s1Kwh: number; s2Kwh: number; s3Kwh: number; s4Kwh: number };

      if (clampedOffset === 0) {
        const simTargetIdx = dayIdx - todayMonIdx;
        if (simTargetIdx < 0) {
          kwh = generateDeterministicDayKwh(epochDay);
        } else if (simTargetIdx === simulatedDaysElapsed) {
          kwh = liveTodayKwh;
        } else if (simTargetIdx < simulatedDaysElapsed) {
          kwh = completedSimulatedDays[simTargetIdx] ?? generateDeterministicDayKwh(epochDay);
        } else {
          // Upcoming days later this week remain 0 until simulated time reaches them
          kwh = { s1Kwh: 0, s2Kwh: 0, s3Kwh: 0, s4Kwh: 0 };
        }
      } else {
        kwh = generateDeterministicDayKwh(epochDay);
      }

      bars.push(
        buildBarMetrics(
          `w-${clampedOffset}-${dayIdx}`,
          dayLabel,
          tooltipLabel,
          kwh,
          country,
          offPeakShares
        )
      );
    }

    const totalKwh = bars.reduce((sum, b) => sum + b.totalKwh, 0);
    const totalPeakKwh = bars.reduce((sum, b) => sum + b.peakKwh, 0);
    const totalOffPeakKwh = bars.reduce((sum, b) => sum + b.offPeakKwh, 0);
    const peakCost = bars.reduce((sum, b) => sum + b.peakCost, 0);
    const offPeakCost = bars.reduce((sum, b) => sum + b.offPeakCost, 0);
    const totalBill = bars.reduce((sum, b) => sum + b.cost, 0);
    const totalOffPeakSavings = bars.reduce((sum, b) => sum + b.savings, 0);
    const totalCo2AvoidedKg = bars.reduce((sum, b) => sum + b.co2AvoidedKg, 0);
    const peakLoadShavedKw = sockets.reduce(
      (sum, sock) => sum + (sock.isOn || offPeakShares[sock.socketId] > 0.4 ? sock.appliance.wattage / 1000 : 0),
      0
    );

    return {
      mode: 'weekly',
      periodOffset: clampedOffset,
      periodLabel,
      isCurrentPeriod: clampedOffset === 0,
      canGoBack: clampedOffset > MIN_WEEKLY_OFFSET,
      canGoForward: clampedOffset < 0,
      bars,
      totalKwh,
      totalPeakKwh,
      totalOffPeakKwh,
      peakCost,
      offPeakCost,
      totalBill,
      totalOffPeakSavings,
      totalCo2AvoidedKg,
      peakLoadShavedKw,
    };
  }

  // Monthly Mode: 4 weekly bars (Week 1 .. Week 4), max 12 months back (-11 .. 0)
  const clampedOffset = Math.max(MIN_MONTHLY_OFFSET, Math.min(0, periodOffset));
  const targetMonthDate = new Date(
    todayMidnight.getFullYear(),
    todayMidnight.getMonth() + clampedOffset,
    1
  );
  const year = targetMonthDate.getFullYear();
  const month = targetMonthDate.getMonth();
  periodLabel = `${MONTH_NAMES_FULL[month]} ${year}`;

  const monthSeedBase = year * 12 + month;

  for (let wIdx = 0; wIdx < 4; wIdx++) {
    const weekLabel = `Week ${wIdx + 1}`;
    const agg = { s1Kwh: 0, s2Kwh: 0, s3Kwh: 0, s4Kwh: 0 };

    if (clampedOffset === 0 && wIdx === 3) {
      // Current month's Week 4 combines deterministic prior week days + live real-time socket usage
      for (let d = 0; d < 6; d++) {
        const sample = generateDeterministicDayKwh(monthSeedBase * 31 + wIdx * 7 + d);
        agg.s1Kwh += sample.s1Kwh;
        agg.s2Kwh += sample.s2Kwh;
        agg.s3Kwh += sample.s3Kwh;
        agg.s4Kwh += sample.s4Kwh;
      }
      const completedExtra = Object.values(completedSimulatedDays).reduce(
        (acc, item) => ({
          s1Kwh: acc.s1Kwh + item.s1Kwh,
          s2Kwh: acc.s2Kwh + item.s2Kwh,
          s3Kwh: acc.s3Kwh + item.s3Kwh,
          s4Kwh: acc.s4Kwh + item.s4Kwh,
        }),
        { s1Kwh: 0, s2Kwh: 0, s3Kwh: 0, s4Kwh: 0 }
      );
      agg.s1Kwh += completedExtra.s1Kwh + liveTodayKwh.s1Kwh;
      agg.s2Kwh += completedExtra.s2Kwh + liveTodayKwh.s2Kwh;
      agg.s3Kwh += completedExtra.s3Kwh + liveTodayKwh.s3Kwh;
      agg.s4Kwh += completedExtra.s4Kwh + liveTodayKwh.s4Kwh;
    } else {
      const daysInSlot = wIdx === 3 ? 8 : 7; // ~30 days across 4 weeks
      for (let d = 0; d < daysInSlot; d++) {
        const sample = generateDeterministicDayKwh(monthSeedBase * 31 + wIdx * 7 + d);
        agg.s1Kwh += sample.s1Kwh;
        agg.s2Kwh += sample.s2Kwh;
        agg.s3Kwh += sample.s3Kwh;
        agg.s4Kwh += sample.s4Kwh;
      }
    }

    bars.push(
      buildBarMetrics(
        `m-${clampedOffset}-${wIdx}`,
        weekLabel,
        weekLabel,
        {
          s1Kwh: Number(agg.s1Kwh.toFixed(3)),
          s2Kwh: Number(agg.s2Kwh.toFixed(3)),
          s3Kwh: Number(agg.s3Kwh.toFixed(3)),
          s4Kwh: Number(agg.s4Kwh.toFixed(3)),
        },
        country,
        offPeakShares
      )
    );
  }

  const totalKwh = bars.reduce((sum, b) => sum + b.totalKwh, 0);
  const totalPeakKwh = bars.reduce((sum, b) => sum + b.peakKwh, 0);
  const totalOffPeakKwh = bars.reduce((sum, b) => sum + b.offPeakKwh, 0);
  const peakCost = bars.reduce((sum, b) => sum + b.peakCost, 0);
  const offPeakCost = bars.reduce((sum, b) => sum + b.offPeakCost, 0);
  const totalBill = bars.reduce((sum, b) => sum + b.cost, 0);
  const totalOffPeakSavings = bars.reduce((sum, b) => sum + b.savings, 0);
  const totalCo2AvoidedKg = bars.reduce((sum, b) => sum + b.co2AvoidedKg, 0);
  const peakLoadShavedKw = sockets.reduce(
    (sum, sock) => sum + (sock.isOn || offPeakShares[sock.socketId] > 0.4 ? sock.appliance.wattage / 1000 : 0),
    0
  );

  return {
    mode: 'monthly',
    periodOffset: clampedOffset,
    periodLabel,
    isCurrentPeriod: clampedOffset === 0,
    canGoBack: clampedOffset > MIN_MONTHLY_OFFSET,
    canGoForward: clampedOffset < 0,
    bars,
    totalKwh,
    totalPeakKwh,
    totalOffPeakKwh,
    peakCost,
    offPeakCost,
    totalBill,
    totalOffPeakSavings,
    totalCo2AvoidedKg,
    peakLoadShavedKw,
  };
}
