import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APPLIANCE_PRESETS, DAY_NAMES_SHORT, DEFAULT_SCHEDULES } from '../data/appliances';
import { COUNTRY_CONFIGS } from '../data/countries';
import {
  buildFallbackWeatherState,
  buildPresetWeatherState,
  fetchLiveWeatherForCountry,
} from '../services/weatherService';
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
  ThermalStatus,
  VoltagePoint,
  VoltageStatus,
  WeatherMode,
  WeatherState,
  WhatsAppEventType,
  WhatsAppMessage,
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
const AMBIENT_PLUG_TEMP_C = 28.0;
const INITIAL_PLUG_TEMP_C = 34.5;

export function getThermalStatus(tempC: number): ThermalStatus {
  if (tempC >= 70) return 'OVERHEAT';
  if (tempC >= 56) return 'WARM';
  return 'NORMAL';
}

export function getVoltageStatus(voltage: number): VoltageStatus {
  if (voltage < 198) return 'UNDERVOLTAGE';
  if (voltage > 242) return 'OVERVOLTAGE';
  if (voltage >= 232) return 'HIGH_WARNING';
  return 'NORMAL';
}

function getSteadyStateTempForWattage(wattage: number): number {
  if (wattage >= 1400) return 66.5; // Water Heater: climbs into Warm (56-69C) under sustained run
  if (wattage >= 800) return 58.0; // AC: reaches Warm advisory band
  if (wattage >= 300) return 41.5; // Dispenser: stays Normal
  return 32.5; // Charger: stays cool
}

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
  const [plugTemperatureC, setPlugTemperatureC] = useState<number>(INITIAL_PLUG_TEMP_C);

  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null);
  const [autoOnOffPeak, setAutoOnOffPeak] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(DEFAULT_SCHEDULES);
  const [sessionKwh, setSessionKwh] = useState<number>(0.42);

  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [activeBanner, setActiveBanner] = useState<MobileNotification | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [anomalyLogs, setAnomalyLogs] = useState<AnomalyEvent[]>([]);
  const [voltageHistory, setVoltageHistory] = useState<VoltagePoint[]>(() =>
    buildInitialVoltageHistory(COUNTRY_CONFIGS.ID.nominalVoltage)
  );
  const [tickCount, setTickCount] = useState<number>(MAX_VOLTAGE_POINTS);

  const [weather, setWeather] = useState<WeatherState>(() =>
    buildFallbackWeatherState(COUNTRY_CONFIGS.ID)
  );

  const country = COUNTRY_CONFIGS[countryCode];
  const appliance = useMemo(
    () => APPLIANCE_PRESETS.find((a) => a.id === applianceId) ?? APPLIANCE_PRESETS[0],
    [applianceId]
  );

  const stateRef = useRef({
    country,
    appliance,
    relayState,
    clockSeconds,
    speedMultiplier,
    faultInjection,
    plugTemperatureC,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    tickCount,
    voltageHistory,
  });

  stateRef.current = {
    country,
    appliance,
    relayState,
    clockSeconds,
    speedMultiplier,
    faultInjection,
    plugTemperatureC,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    tickCount,
    voltageHistory,
  };

  const bannerTimeoutRef = useRef<number | null>(null);

  const pushNotification = useCallback(
    (
      title: string,
      message: string,
      severity: 'critical' | 'warning' | 'info',
      timestamp: string,
      channel: 'ECOSHIFT' | 'WHATSAPP' = 'ECOSHIFT'
    ) => {
      const notif: MobileNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        timestamp,
        severity,
        channel,
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 15));
      setActiveBanner(notif);

      if (bannerTimeoutRef.current !== null) {
        window.clearTimeout(bannerTimeoutRef.current);
      }
      bannerTimeoutRef.current = window.setTimeout(() => {
        setActiveBanner((current) => (current?.id === notif.id ? null : current));
      }, 7000);
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

  const pushWhatsAppAlert = useCallback(
    (params: {
      eventType: WhatsAppEventType;
      eventTitle: string;
      voltageV: number;
      temperatureC: number;
      powerW: number;
      simulatedTime: string;
      actionStatus: string;
      severity: 'critical' | 'warning';
      detail: string;
    }) => {
      const msg: WhatsAppMessage = {
        id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...params,
      };
      setWhatsappMessages((prev) => [msg, ...prev].slice(0, 20));
    },
    []
  );

  const executeSafetyTrip = useCallback(
    (
      type: AnomalyType,
      measuredValue: string,
      timestamp: string,
      appName: string,
      sensorSnapshot: { voltageV: number; temperatureC: number; powerW: number }
    ) => {
      setRelayState('TRIPPED');
      setTimerRemainingSeconds(null);

      const titleMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: 'WhatsApp: EcoShift Guard',
        OVERVOLTAGE: 'WhatsApp: EcoShift Guard',
        OVERLOAD: 'WhatsApp: EcoShift Guard',
        OVERHEAT: 'WhatsApp: EcoShift Guard',
      };

      const eventTitleMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: 'Undervoltage Detected (<198V)',
        OVERVOLTAGE: 'Overvoltage Surge Detected (>242V)',
        OVERLOAD: 'Socket Overload (>2,400W)',
        OVERHEAT: 'Thermal Overheat (>=70°C)',
      };

      const detailMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: `${measuredValue} sag violated SPLN 1:1995 (<198V). Power cut off to protect ${appName}.`,
        OVERVOLTAGE: `${measuredValue} surge violated SPLN 1:1995 (>242V). Power cut off to protect ${appName}.`,
        OVERLOAD: `${measuredValue} exceeded SNI IEC 60884-1 2,400W capacity. Power cut off for ${appName}.`,
        OVERHEAT: `Plug temperature reached ${measuredValue} (SNI IEC 60884-1 limit 70°C). Power cut off for ${appName}.`,
      };

      pushNotification(
        titleMap[type],
        detailMap[type],
        'critical',
        timestamp,
        'WHATSAPP'
      );

      pushWhatsAppAlert({
        eventType: type,
        eventTitle: eventTitleMap[type],
        voltageV: sensorSnapshot.voltageV,
        temperatureC: sensorSnapshot.temperatureC,
        powerW: sensorSnapshot.powerW,
        simulatedTime: timestamp,
        actionStatus: 'Power Automatically Cut Off',
        severity: 'critical',
        detail: detailMap[type],
      });

      const logEntry: AnomalyEvent = {
        id: `anom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        simulatedTimestamp: timestamp,
        type,
        measuredValue,
        applianceName: appName,
        actionTaken: 'Auto-Cutoff + WhatsApp Alert Sent',
      };
      setAnomalyLogs((prev) => [logEntry, ...prev].slice(0, 20));
    },
    [pushNotification, pushWhatsAppAlert]
  );

  // Instant fault injection trigger (called from DemoControlBar)
  const triggerFault = useCallback(
    (fault: FaultInjection) => {
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);
      const currentVoltage =
        s.voltageHistory[s.voltageHistory.length - 1]?.voltage ?? s.country.nominalVoltage;

      if (fault === 'NONE') {
        setFaultInjection('NONE');
        setPlugTemperatureC((prev) => (prev >= 70 ? 36.0 : prev));
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
        executeSafetyTrip('UNDERVOLTAGE', `${measured.toFixed(1)} V`, clock.formattedFull, s.appliance.name, {
          voltageV: measured,
          temperatureC: s.plugTemperatureC,
          powerW: s.relayState === 'ON' ? s.appliance.wattage : 0,
        });
      } else if (fault === 'OVERVOLTAGE') {
        const measured = 264.8;
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: measured, isAnomaly: true },
        ]);
        executeSafetyTrip('OVERVOLTAGE', `${measured.toFixed(1)} V`, clock.formattedFull, s.appliance.name, {
          voltageV: measured,
          temperatureC: s.plugTemperatureC,
          powerW: s.relayState === 'ON' ? s.appliance.wattage : 0,
        });
      } else if (fault === 'OVERLOAD') {
        const measured = 2480;
        const vDuringFault = Number((s.country.nominalVoltage - 4.2).toFixed(1));
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: vDuringFault, isAnomaly: true },
        ]);
        executeSafetyTrip(
          'OVERLOAD',
          `${measured.toLocaleString('en-US')} W`,
          clock.formattedFull,
          s.appliance.name,
          {
            voltageV: vDuringFault,
            temperatureC: s.plugTemperatureC,
            powerW: measured,
          }
        );
      } else if (fault === 'OVERHEAT') {
        const overheatTemp = 74.6;
        setPlugTemperatureC(overheatTemp);
        executeSafetyTrip(
          'OVERHEAT',
          `${overheatTemp.toFixed(1)} °C`,
          clock.formattedFull,
          s.appliance.name,
          {
            voltageV: currentVoltage,
            temperatureC: overheatTemp,
            powerW: s.relayState === 'ON' ? s.appliance.wattage : 0,
          }
        );
      }
    },
    [executeSafetyTrip]
  );

  // Weather Mode & Live API handling
  const emitWeatherWhatsAppIfExtreme = useCallback(
    (nextWeather: WeatherState) => {
      if (nextWeather.condition !== 'HEAVY_RAIN' && nextWeather.condition !== 'THUNDERSTORM') {
        return;
      }
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);
      const currentVoltage =
        s.voltageHistory[s.voltageHistory.length - 1]?.voltage ?? s.country.nominalVoltage;
      const currentPower = s.relayState === 'ON' ? s.appliance.wattage : 0;
      const isStorm = nextWeather.condition === 'THUNDERSTORM';
      const title = isStorm
        ? `Thunderstorm Alert (${nextWeather.city})`
        : `Heavy Rain Advisory (${nextWeather.city})`;
      const detail = isStorm
        ? `Severe thunderstorm detected in ${nextWeather.city}. Lightning surge protection is active on standby.`
        : `Heavy rainfall detected in ${nextWeather.city}. Grid surge monitoring heightened.`;

      pushNotification('WhatsApp: EcoShift Guard', detail, 'warning', clock.formattedFull, 'WHATSAPP');
      pushWhatsAppAlert({
        eventType: 'EXTREME_WEATHER',
        eventTitle: title,
        voltageV: currentVoltage,
        temperatureC: s.plugTemperatureC,
        powerW: currentPower,
        simulatedTime: clock.formattedFull,
        actionStatus: 'Lightning Protection Standby',
        severity: 'warning',
        detail,
      });
    },
    [pushNotification, pushWhatsAppAlert]
  );

  const setWeatherMode = useCallback(
    async (mode: WeatherMode) => {
      const s = stateRef.current;
      if (mode === 'LIVE_API') {
        setWeather((prev) => ({ ...prev, mode: 'LIVE_API', isLoading: true }));
        const result = await fetchLiveWeatherForCountry(s.country);
        setWeather(result);
        emitWeatherWhatsAppIfExtreme(result);
        return;
      }
      const preset = buildPresetWeatherState(mode, s.country);
      setWeather(preset);
      emitWeatherWhatsAppIfExtreme(preset);
    },
    [emitWeatherWhatsAppIfExtreme]
  );

  // Fetch initial weather on mount (with clean fallback if key missing)
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    fetchLiveWeatherForCountry(COUNTRY_CONFIGS.ID, controller.signal)
      .then((res) => {
        if (mounted) {
          setWeather(res);
          emitWeatherWhatsAppIfExtreme(res);
        }
      })
      .catch(() => {
        // Ignore abort errors
      });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [emitWeatherWhatsAppIfExtreme]);

  const toggleRelay = useCallback(() => {
    const s = stateRef.current;
    const clock = decodeClock(s.clockSeconds);

    if (s.relayState === 'TRIPPED') {
      if (s.faultInjection !== 'NONE') {
        pushNotification(
          'Safety Lockout Active',
          'Grid or thermal fault is still active. Restore Normal state before resetting safety lock.',
          'critical',
          clock.formattedFull
        );
        return;
      }
      setRelayState('OFF');
      pushNotification(
        'Safety Lock Reset',
        `Grid voltage (${s.country.nominalVoltage}V) and plug temperature (${s.plugTemperatureC.toFixed(1)}°C) verified safe.`,
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
      pushNotification(
        'Fault Still Active',
        'Restore Normal state in the Demo Control Bar before clearing Safety Lock.',
        'critical',
        clock.formattedFull
      );
      return;
    }

    setRelayState('OFF');
    pushNotification(
      'Safety Lock Cleared',
      `EcoShift Smart Plug reset safely. Voltage ${s.country.nominalVoltage}V, Temp ${s.plugTemperatureC.toFixed(1)}°C.`,
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

  const selectCountry = useCallback(
    (code: CountryCode) => {
      setCountryCode(code);
      const nextCountry = COUNTRY_CONFIGS[code];
      setVoltageHistory(buildInitialVoltageHistory(nextCountry.nominalVoltage));

      setWeather((prev) => {
        if (prev.mode !== 'LIVE_API') {
          return buildPresetWeatherState(prev.condition, nextCountry);
        }
        return { ...prev, city: nextCountry.city, isLoading: true };
      });

      if (weather.mode === 'LIVE_API') {
        fetchLiveWeatherForCountry(nextCountry)
          .then((res) => {
            setWeather(res);
            emitWeatherWhatsAppIfExtreme(res);
          })
          .catch(() => {
            // fallback handled inside fetchLiveWeatherForCountry
          });
      }
    },
    [weather.mode, emitWeatherWhatsAppIfExtreme]
  );

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
    setPlugTemperatureC(INITIAL_PLUG_TEMP_C);
    setTimerRemainingSeconds(null);
    setAutoOnOffPeak(true);
    setSchedules(DEFAULT_SCHEDULES);
    setSessionKwh(0.42);
    setNotifications([]);
    setActiveBanner(null);
    setWhatsappMessages([]);
    setAnomalyLogs([]);
    setVoltageHistory(buildInitialVoltageHistory(COUNTRY_CONFIGS.ID.nominalVoltage));
    setTickCount(MAX_VOLTAGE_POINTS);
    setWeather(buildFallbackWeatherState(COUNTRY_CONFIGS.ID));
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

      // Realistic thermal simulation (SNI IEC 60884-1)
      if (s.faultInjection === 'OVERHEAT') {
        setPlugTemperatureC(74.6 + Math.sin(nextTick * 0.5) * 0.4);
      } else {
        const targetTemp =
          s.relayState === 'ON'
            ? getSteadyStateTempForWattage(s.appliance.wattage)
            : AMBIENT_PLUG_TEMP_C;
        const speedFactor = Math.min(0.14, 0.008 + Math.log10(Math.max(1, s.speedMultiplier)) * 0.028);
        const nextTemp = s.plugTemperatureC + (targetTemp - s.plugTemperatureC) * speedFactor;
        setPlugTemperatureC(Number(nextTemp.toFixed(1)));
      }

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

  const voltageStatus = useMemo(() => getVoltageStatus(liveVoltage), [liveVoltage]);
  const thermalStatus = useMemo(
    () => getThermalStatus(plugTemperatureC),
    [plugTemperatureC]
  );

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
    plugTemperatureC,
    thermalStatus,
    voltageStatus,
    weather,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    sessionKwh,
    notifications,
    activeBanner,
    whatsappMessages,
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
    setWeatherMode,
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
