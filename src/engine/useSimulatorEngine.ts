import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APPLIANCE_PRESETS, DAY_NAMES_SHORT, DEFAULT_SCHEDULES } from '../data/appliances';
import { COUNTRY_CONFIGS } from '../data/countries';
import {
  AnomalyEvent,
  AnomalyType,
  ApplianceId,
  CountryCode,
  FaultInjection,
  MobileNotification,
  RelayState,
  ScheduleSlot,
  SpeedMultiplier,
  VoltagePoint,
} from '../types/simulator';
import {
  calculateMonthlyProjection,
  isOffPeakMinute,
  parseTimeToMinutes,
} from './billingCalculator';

const WEEK_SECONDS = 7 * 86400;
// Start Monday 14:30:00 (Day 1 = Mon)
const INITIAL_CLOCK_SECONDS = 1 * 86400 + 14 * 3600 + 30 * 60;
const TICK_MS = 250;
const MAX_VOLTAGE_POINTS = 32;

export function decodeClock(totalSeconds: number) {
  const wrapped = ((Math.floor(totalSeconds) % WEEK_SECONDS) + WEEK_SECONDS) % WEEK_SECONDS;
  const dayIndex = Math.floor(wrapped / 86400);
  const secondsInDay = wrapped % 86400;
  const hour = Math.floor(secondsInDay / 3600);
  const minute = Math.floor((secondsInDay % 3600) / 60);
  const second = secondsInDay % 60;
  const minuteOfDay = hour * 60 + minute;

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  const dayName = DAY_NAMES_SHORT[dayIndex];

  return {
    dayIndex,
    dayName,
    hour,
    minute,
    second,
    minuteOfDay,
    formattedTime: `${hh}:${mm}:${ss}`,
    formattedShort: `${dayName} ${hh}:${mm}`,
    formattedFull: `${dayName} ${hh}:${mm}:${ss}`,
    isDaytime: hour >= 6 && hour < 18,
  };
}

function buildInitialVoltageHistory(nominalVoltage: number): VoltagePoint[] {
  return Array.from({ length: MAX_VOLTAGE_POINTS }, (_, idx) => ({
    tick: idx,
    voltage: Number((nominalVoltage + Math.sin(idx * 0.45) * 0.9).toFixed(1)),
    isAnomaly: false,
  }));
}

export function useSimulatorEngine() {
  const [countryCode, setCountryCode] = useState<CountryCode>('ID');
  const [applianceId, setApplianceId] = useState<ApplianceId>('water_heater');
  const [relayState, setRelayState] = useState<RelayState>('ON');
  const [clockSeconds, setClockSeconds] = useState<number>(INITIAL_CLOCK_SECONDS);
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(60);
  const [faultInjection, setFaultInjection] = useState<FaultInjection>('NONE');

  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null);
  const [autoOnOffPeak, setAutoOnOffPeak] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(DEFAULT_SCHEDULES);
  const [sessionKwh, setSessionKwh] = useState<number>(0.42);

  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [activeBanner, setActiveBanner] = useState<MobileNotification | null>(null);
  const [anomalyLogs, setAnomalyLogs] = useState<AnomalyEvent[]>([]);
  const [voltageHistory, setVoltageHistory] = useState<VoltagePoint[]>(() =>
    buildInitialVoltageHistory(COUNTRY_CONFIGS.ID.nominalVoltage)
  );
  const [tickCount, setTickCount] = useState<number>(MAX_VOLTAGE_POINTS);

  const country = COUNTRY_CONFIGS[countryCode];
  const appliance = useMemo(
    () => APPLIANCE_PRESETS.find((a) => a.id === applianceId) ?? APPLIANCE_PRESETS[0],
    [applianceId]
  );

  // Refs for reading latest state inside interval without recreating it every tick
  const stateRef = useRef({
    country,
    appliance,
    relayState,
    clockSeconds,
    speedMultiplier,
    faultInjection,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    tickCount,
  });

  stateRef.current = {
    country,
    appliance,
    relayState,
    clockSeconds,
    speedMultiplier,
    faultInjection,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    tickCount,
  };

  const bannerTimeoutRef = useRef<number | null>(null);

  const pushNotification = useCallback(
    (title: string, message: string, severity: 'critical' | 'info', timestamp: string) => {
      const notif: MobileNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        timestamp,
        severity,
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 12));
      setActiveBanner(notif);

      if (bannerTimeoutRef.current !== null) {
        window.clearTimeout(bannerTimeoutRef.current);
      }
      bannerTimeoutRef.current = window.setTimeout(() => {
        setActiveBanner((current) => (current?.id === notif.id ? null : current));
      }, 6500);
    },
    []
  );

  const dismissBanner = useCallback(() => {
    setActiveBanner(null);
    if (bannerTimeoutRef.current !== null) {
      window.clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
  }, []);

  const executeSafetyTrip = useCallback(
    (type: AnomalyType, measuredValue: string, timestamp: string, appName: string) => {
      setRelayState('TRIPPED');
      setTimerRemainingSeconds(null);

      const titleMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: 'Power Cut Off: Undervoltage Sag',
        OVERVOLTAGE: 'Power Cut Off: Voltage Surge',
        OVERLOAD: 'Power Cut Off: Overload Detected',
      };

      const detailMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: `${measuredValue} sag detected. Relay opened in <50ms to protect ${appName}.`,
        OVERVOLTAGE: `${measuredValue} surge detected. Relay opened in <50ms to protect ${appName}.`,
        OVERLOAD: `${measuredValue} spike exceeded 2,200W limit. Relay opened to protect ${appName}.`,
      };

      pushNotification(titleMap[type], detailMap[type], 'critical', timestamp);

      const logEntry: AnomalyEvent = {
        id: `anom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        simulatedTimestamp: timestamp,
        type,
        measuredValue,
        applianceName: appName,
        actionTaken: 'Auto-Cutoff + Mobile Alert Sent',
      };
      setAnomalyLogs((prev) => [logEntry, ...prev].slice(0, 20));
    },
    [pushNotification]
  );

  // Instant fault injection trigger (called from DemoControlBar)
  const triggerFault = useCallback(
    (fault: FaultInjection) => {
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);

      if (fault === 'NONE') {
        setFaultInjection('NONE');
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: s.country.nominalVoltage, isAnomaly: false },
        ]);
        return;
      }

      setFaultInjection(fault);

      if (fault === 'UNDERVOLTAGE') {
        const measured = 176.4;
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: measured, isAnomaly: true },
        ]);
        executeSafetyTrip('UNDERVOLTAGE', `${measured.toFixed(1)} V`, clock.formattedFull, s.appliance.name);
      } else if (fault === 'OVERVOLTAGE') {
        const measured = 264.8;
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: measured, isAnomaly: true },
        ]);
        executeSafetyTrip('OVERVOLTAGE', `${measured.toFixed(1)} V`, clock.formattedFull, s.appliance.name);
      } else if (fault === 'OVERLOAD') {
        const measured = 2480;
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: s.country.nominalVoltage - 4.2, isAnomaly: true },
        ]);
        executeSafetyTrip('OVERLOAD', `${measured.toLocaleString('en-US')} W`, clock.formattedFull, s.appliance.name);
      }
    },
    [executeSafetyTrip]
  );

  const toggleRelay = useCallback(() => {
    const s = stateRef.current;
    const clock = decodeClock(s.clockSeconds);

    if (s.relayState === 'TRIPPED') {
      if (s.faultInjection !== 'NONE') {
        pushNotification(
          'Safety Lockout Active',
          'Grid anomaly is still present. Restore Normal Voltage before resetting safety lock.',
          'critical',
          clock.formattedFull
        );
        return;
      }
      setRelayState('OFF');
      pushNotification(
        'Safety Lock Reset',
        `Grid voltage verified normal (${s.country.nominalVoltage}V). Plug is ready in standby.`,
        'info',
        clock.formattedFull
      );
      return;
    }

    if (s.relayState === 'ON') {
      setRelayState('OFF');
      setTimerRemainingSeconds(null);
    } else {
      setRelayState('ON');
    }
  }, [pushNotification]);

  const resetSafetyLock = useCallback(() => {
    const s = stateRef.current;
    const clock = decodeClock(s.clockSeconds);

    if (s.faultInjection !== 'NONE') {
      // Automatically inform user that voltage must be normal first
      pushNotification(
        'Grid Voltage Unstable',
        'Restore Normal Voltage in the Demo Control Bar before clearing Safety Lock.',
        'critical',
        clock.formattedFull
      );
      return;
    }

    setRelayState('OFF');
    pushNotification(
      'Safety Lock Cleared',
      `EcoShift Smart Plug reset safely. Voltage nominal at ${s.country.nominalVoltage}V.`,
      'info',
      clock.formattedFull
    );
  }, [pushNotification]);

  const setCountdownMinutes = useCallback((minutes: number | null) => {
    if (minutes === null || minutes <= 0) {
      setTimerRemainingSeconds(null);
      return;
    }
    setTimerRemainingSeconds(minutes * 60);
    // If plug is OFF (not tripped), turn it ON when user starts a countdown timer
    setRelayState((prev) => (prev === 'OFF' ? 'ON' : prev));
  }, []);

  const jumpToTime = useCallback(
    (hour: number, minute: number) => {
      const s = stateRef.current;
      const current = decodeClock(s.clockSeconds);
      const nextSeconds = current.dayIndex * 86400 + hour * 3600 + minute * 60;
      setClockSeconds(nextSeconds);

      const targetMinuteOfDay = hour * 60 + minute;
      const enteringOffPeak = isOffPeakMinute(targetMinuteOfDay, s.country);
      const targetClock = decodeClock(nextSeconds);

      if (s.autoOnOffPeak && enteringOffPeak && s.relayState === 'OFF') {
        setRelayState('ON');
        pushNotification(
          'Off-Peak Auto-On Activated',
          `Entered ${s.country.shortName} off-peak window (${s.country.offPeakWindowLabel}). ${s.appliance.name} turned ON.`,
          'info',
          targetClock.formattedFull
        );
      }
    },
    [pushNotification]
  );

  const selectCountry = useCallback((code: CountryCode) => {
    setCountryCode(code);
    const nextCountry = COUNTRY_CONFIGS[code];
    setVoltageHistory(buildInitialVoltageHistory(nextCountry.nominalVoltage));
  }, []);

  const addSchedule = useCallback((slot: Omit<ScheduleSlot, 'id'>) => {
    const newSlot: ScheduleSlot = {
      ...slot,
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setSchedules((prev) => [...prev, newSlot]);
  }, []);

  const toggleSchedule = useCallback((id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const resetDemo = useCallback(() => {
    setCountryCode('ID');
    setApplianceId('water_heater');
    setRelayState('ON');
    setClockSeconds(INITIAL_CLOCK_SECONDS);
    setSpeedMultiplier(60);
    setFaultInjection('NONE');
    setTimerRemainingSeconds(null);
    setAutoOnOffPeak(true);
    setSchedules(DEFAULT_SCHEDULES);
    setSessionKwh(0.42);
    setNotifications([]);
    setActiveBanner(null);
    setAnomalyLogs([]);
    setVoltageHistory(buildInitialVoltageHistory(COUNTRY_CONFIGS.ID.nominalVoltage));
    setTickCount(MAX_VOLTAGE_POINTS);
  }, []);

  // Main 250ms simulation tick loop
  useEffect(() => {
    const timer = window.setInterval(() => {
      const s = stateRef.current;
      const nextTick = s.tickCount + 1;
      setTickCount(nextTick);

      // Compute instantaneous voltage for sparkline
      let liveVoltage = s.country.nominalVoltage + Math.sin(nextTick * 0.45) * 1.1;
      let isVoltageAnomaly = false;

      if (s.faultInjection === 'UNDERVOLTAGE') {
        liveVoltage = 176.4 + Math.sin(nextTick * 0.9) * 1.4;
        isVoltageAnomaly = true;
      } else if (s.faultInjection === 'OVERVOLTAGE') {
        liveVoltage = 264.8 + Math.sin(nextTick * 0.9) * 1.6;
        isVoltageAnomaly = true;
      } else if (s.faultInjection === 'OVERLOAD') {
        liveVoltage = s.country.nominalVoltage - 4.2 + Math.sin(nextTick * 0.8) * 1.2;
        isVoltageAnomaly = true;
      }

      setVoltageHistory((prev) => [
        ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
        { tick: nextTick, voltage: Number(liveVoltage.toFixed(1)), isAnomaly: isVoltageAnomaly },
      ]);

      if (s.speedMultiplier === 0) return;

      const deltaSimSeconds = (TICK_MS / 1000) * s.speedMultiplier;
      const prevClockSeconds = s.clockSeconds;
      const nextClockSeconds = (prevClockSeconds + deltaSimSeconds) % WEEK_SECONDS;
      setClockSeconds(nextClockSeconds);

      const prevClock = decodeClock(prevClockSeconds);
      const nextClock = decodeClock(nextClockSeconds);

      // Accumulate session energy if relay is ON
      if (s.relayState === 'ON') {
        const addedKwh = (s.appliance.wattage * deltaSimSeconds) / 3600000;
        setSessionKwh((prev) => prev + addedKwh);
      }

      // Priority 2: Countdown timer auto-cutoff
      if (s.relayState === 'ON' && s.timerRemainingSeconds !== null) {
        const remaining = s.timerRemainingSeconds - deltaSimSeconds;
        if (remaining <= 0) {
          setTimerRemainingSeconds(null);
          setRelayState('OFF');
          pushNotification(
            'Timer Auto-Cutoff Complete',
            `Countdown finished. ${s.appliance.name} was automatically switched OFF.`,
            'info',
            nextClock.formattedFull
          );
          return;
        } else {
          setTimerRemainingSeconds(remaining);
        }
      }

      // Do not auto-turn ON if safety lockout is active
      if (s.relayState === 'TRIPPED') return;

      // Priority 3: Off-Peak Auto-On entry detection
      const prevOffPeak = isOffPeakMinute(prevClock.minuteOfDay, s.country);
      const nextOffPeak = isOffPeakMinute(nextClock.minuteOfDay, s.country);
      if (s.autoOnOffPeak && !prevOffPeak && nextOffPeak && s.relayState === 'OFF') {
        setRelayState('ON');
        pushNotification(
          'Off-Peak Auto-On Triggered',
          `Entered ${s.country.shortName} off-peak window (${s.country.offPeakWindowLabel}). ${s.appliance.name} turned ON.`,
          'info',
          nextClock.formattedFull
        );
        return;
      }

      // Priority 4: Daily Schedule Start/End match
      // Check all minute marks crossed in this tick (important at 300x / 1800x speed!)
      const prevAbsMinute = Math.floor(prevClockSeconds / 60);
      const nextAbsMinute = Math.floor((prevClockSeconds + deltaSimSeconds) / 60);
      if (nextAbsMinute > prevAbsMinute) {
        const minutesCrossed = Math.min(nextAbsMinute - prevAbsMinute, 60);
        for (let step = 1; step <= minutesCrossed; step++) {
          const checkAbsMin = (prevAbsMinute + step) % (7 * 1440);
          const checkDay = Math.floor(checkAbsMin / 1440);
          const checkMinOfDay = checkAbsMin % 1440;

          for (const slot of s.schedules) {
            if (!slot.enabled || !slot.days.includes(checkDay)) continue;
            const startMin = parseTimeToMinutes(slot.startTime);
            const endMin = parseTimeToMinutes(slot.endTime);

            if (checkMinOfDay === startMin && s.relayState === 'OFF') {
              setRelayState('ON');
              pushNotification(
                'Schedule Auto-On',
                `${slot.label} started at ${slot.startTime}. ${s.appliance.name} turned ON.`,
                'info',
                nextClock.formattedFull
              );
              return;
            }
            if (checkMinOfDay === endMin && s.relayState === 'ON') {
              setRelayState('OFF');
              pushNotification(
                'Schedule Auto-Off',
                `${slot.label} ended at ${slot.endTime}. ${s.appliance.name} switched OFF.`,
                'info',
                nextClock.formattedFull
              );
              return;
            }
          }
        }
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [pushNotification]);

  const clock = useMemo(() => decodeClock(clockSeconds), [clockSeconds]);
  const isCurrentlyOffPeak = useMemo(
    () => isOffPeakMinute(clock.minuteOfDay, country),
    [clock.minuteOfDay, country]
  );

  const liveVoltage =
    voltageHistory[voltageHistory.length - 1]?.voltage ?? country.nominalVoltage;

  const activePowerW = relayState === 'ON' ? appliance.wattage : 0;
  const activeCurrentA =
    relayState === 'ON' && liveVoltage > 0 ? activePowerW / liveVoltage : 0;

  const monthlyProjection = useMemo(
    () => calculateMonthlyProjection(appliance, country, schedules, autoOnOffPeak),
    [appliance, country, schedules, autoOnOffPeak]
  );

  return {
    // Core state
    countryCode,
    country,
    applianceId,
    appliance,
    relayState,
    clock,
    isCurrentlyOffPeak,
    speedMultiplier,
    faultInjection,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    sessionKwh,
    notifications,
    activeBanner,
    anomalyLogs,
    voltageHistory,

    // Telemetry
    liveVoltage,
    activePowerW,
    activeCurrentA,
    monthlyProjection,

    // Actions
    selectCountry,
    setApplianceId,
    toggleRelay,
    resetSafetyLock,
    setSpeedMultiplier,
    jumpToTime,
    triggerFault,
    setCountdownMinutes,
    setAutoOnOffPeak,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    dismissBanner,
    resetDemo,
  };
}

export type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;

