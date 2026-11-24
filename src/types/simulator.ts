export type CountryCode = 'ID' | 'UK' | 'MY' | 'SG' | 'DE';

export interface CountryTariffConfig {
  code: CountryCode;
  name: string;
  shortName: string;
  currencySymbol: string;
  currencyCode: string;
  isTOU: boolean;
  regulationLabel: string;
  regulationNote: string;
  nominalVoltage: number;
  peakRate: number;
  offPeakRate: number;
  offPeakStartMinutes: number; // minutes from 00:00 (e.g., 22*60 = 1320, 0*60+30 = 30)
  offPeakEndMinutes: number; // minutes from 00:00 (e.g., 5*60 = 300, 7*60+30 = 450)
  offPeakWindowLabel: string;
  peakWindowLabel: string;
  peakCarbonGPerKwh: number;
  offPeakCarbonGPerKwh: number;
}

export type ApplianceId = 'water_heater' | 'ac' | 'dispenser' | 'charger';

export interface AppliancePreset {
  id: ApplianceId;
  name: string;
  shortName: string;
  wattage: number;
  category: string;
  description: string;
  defaultDailyHours: number;
}

export type RelayState = 'ON' | 'OFF' | 'TRIPPED';

export type SpeedMultiplier = 0 | 1 | 60 | 300 | 1800;

export type FaultInjection = 'NONE' | 'UNDERVOLTAGE' | 'OVERVOLTAGE' | 'OVERLOAD';

export interface ScheduleSlot {
  id: string;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  enabled: boolean;
  label: string;
}

export type AnomalyType = 'UNDERVOLTAGE' | 'OVERVOLTAGE' | 'OVERLOAD';

export interface AnomalyEvent {
  id: string;
  simulatedTimestamp: string;
  type: AnomalyType;
  measuredValue: string;
  applianceName: string;
  actionTaken: string;
}

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'info';
  read: boolean;
}

export interface MonthlyProjection {
  dailyPeakHours: number;
  dailyOffPeakHours: number;
  monthlyPeakKwh: number;
  monthlyOffPeakKwh: number;
  monthlyTotalKwh: number;
  peakCost: number;
  offPeakCost: number;
  totalMonthlyBill: number;
  offPeakSavings: number;
  co2AvoidedKg: number;
  peakLoadShavedKw: number;
  usedScheduleBasis: boolean;
}

export interface VoltagePoint {
  tick: number;
  voltage: number;
  isAnomaly: boolean;
}

