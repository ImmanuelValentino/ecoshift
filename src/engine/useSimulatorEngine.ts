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
  CountryCode,
  DailyUsageRecord,
  FaultInjection,
  MobileNotification,
  RelayState,
  ScheduleSlot,
  SocketId,
  SocketState,
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
  calculateMultiSocketMonthlyProjection,
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
const MAX_SOCKET_POWER_W = 2400;

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

function getSteadyStateTempForTotalPower(totalWatts: number): number {
  if (totalWatts <= 0) return AMBIENT_PLUG_TEMP_C;
  if (totalWatts <= 500) return 35.0;
  if (totalWatts <= 1500) return 46.5;
  if (totalWatts <= 2400) return 52.5;
  return 57.5; // All 4 standard appliances (2,815W) stay safely in 35C-58C range
}

const INITIAL_DAILY_HISTORY: DailyUsageRecord[] = [
  { dayLabel: 'Wed', s1Kwh: 2.15, s2Kwh: 4.80, s3Kwh: 1.25, s4Kwh: 0.21 },
  { dayLabel: 'Thu', s1Kwh: 1.90, s2Kwh: 5.10, s3Kwh: 1.35, s4Kwh: 0.19 },
  { dayLabel: 'Fri', s1Kwh: 2.30, s2Kwh: 4.50, s3Kwh: 1.18, s4Kwh: 0.24 },
  { dayLabel: 'Sat', s1Kwh: 2.65, s2Kwh: 5.45, s3Kwh: 1.42, s4Kwh: 0.22 },
  { dayLabel: 'Sun', s1Kwh: 2.40, s2Kwh: 4.95, s3Kwh: 1.30, s4Kwh: 0.18 },
];

function createInitialSockets(): SocketState[] {
  return APPLIANCE_PRESETS.map((appliance) => {
    if (appliance.socketId === 1) {
      return {
        socketId: 1,
        appliance,
        isOn: true,
        activeDurationSeconds: 288,
        activeSessionKwh: 0.12,
        dailyKwh: 0.42,
        autoCutoffMinutes: null,
        remainingCutoffSeconds: null,
      };
    }
    const seedDaily =
      appliance.socketId === 2 ? 0.95 : appliance.socketId === 3 ? 0.28 : 0.065;
    return {
      socketId: appliance.socketId,
      appliance,
      isOn: false,
      activeDurationSeconds: 0,
      activeSessionKwh: 0,
      dailyKwh: seedDaily,
      autoCutoffMinutes: null,
      remainingCutoffSeconds: null,
    };
  });
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
  const [sockets, setSockets] = useState<SocketState[]>(createInitialSockets);
  const [dailyHistory, setDailyHistory] = useState<DailyUsageRecord[]>(INITIAL_DAILY_HISTORY);
  const [isSafetyLocked, setIsSafetyLocked] = useState<boolean>(false);
  const [clockSeconds, setClockSeconds] = useState<number>(INITIAL_CLOCK_SECONDS);
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(60);
  const [faultInjection, setFaultInjection] = useState<FaultInjection>('NONE');
  const [plugTemperatureC, setPlugTemperatureC] = useState<number>(INITIAL_PLUG_TEMP_C);

  const [autoOnOffPeak, setAutoOnOffPeak] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(DEFAULT_SCHEDULES);

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

  const stateRef = useRef({
    country,
    sockets,
    isSafetyLocked,
    clockSeconds,
    speedMultiplier,
    faultInjection,
    plugTemperatureC,
    autoOnOffPeak,
    schedules,
    tickCount,
    voltageHistory,
  });

  stateRef.current = {
    country,
    sockets,
    isSafetyLocked,
    clockSeconds,
    speedMultiplier,
    faultInjection,
    plugTemperatureC,
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
      targetLabel: string,
      sensorSnapshot: { voltageV: number; temperatureC: number; powerW: number },
      singleSocketId?: SocketId
    ) => {
      if (type === 'OVERLOAD' && singleSocketId !== undefined) {
        // Per-socket overload: only cut off the overloaded socket
        setSockets((prev) =>
          prev.map((s) =>
            s.socketId === singleSocketId
              ? {
                  ...s,
                  isOn: false,
                  activeDurationSeconds: 0,
                  activeSessionKwh: 0,
                  autoCutoffMinutes: null,
                  remainingCutoffSeconds: null,
                }
              : s
          )
        );
      } else {
        setIsSafetyLocked(true);
        setSockets((prev) =>
          prev.map((s) => ({
            ...s,
            isOn: false,
            activeDurationSeconds: 0,
            activeSessionKwh: 0,
            autoCutoffMinutes: null,
            remainingCutoffSeconds: null,
          }))
        );
      }

      const eventTitleMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: 'Undervoltage Detected (<198V)',
        OVERVOLTAGE: 'Overvoltage Surge Detected (>242V)',
        OVERLOAD: 'Socket Overload (>2,400W)',
        OVERHEAT: 'Thermal Overheat (>=70°C)',
      };

      const detailMap: Record<AnomalyType, string> = {
        UNDERVOLTAGE: `${measuredValue} sag violated SPLN 1:1995 (<198V). All active sockets cut off (${targetLabel}).`,
        OVERVOLTAGE: `${measuredValue} surge violated SPLN 1:1995 (>242V). All active sockets cut off (${targetLabel}).`,
        OVERLOAD: `${measuredValue} on ${targetLabel} exceeded SNI IEC 60884-1 2,400W/socket limit. Socket cut off.`,
        OVERHEAT: `Plug temperature reached ${measuredValue} (limit 70°C). All sockets cut off (${targetLabel}).`,
      };

      pushNotification(
        'WhatsApp: EcoShift Guard',
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
        applianceName: targetLabel,
        actionTaken:
          type === 'OVERLOAD' && singleSocketId !== undefined
            ? `S${singleSocketId} Cut Off + WhatsApp Sent`
            : 'All Sockets Cut Off + WhatsApp Sent',
      };
      setAnomalyLogs((prev) => [logEntry, ...prev].slice(0, 20));
    },
    [pushNotification, pushWhatsAppAlert]
  );

  const triggerFault = useCallback(
    (fault: FaultInjection) => {
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);
      const currentVoltage =
        s.voltageHistory[s.voltageHistory.length - 1]?.voltage ?? s.country.nominalVoltage;
      const activeNames =
        s.sockets
          .filter((sock) => sock.isOn)
          .map((sock) => `S${sock.socketId} ${sock.appliance.shortName}`)
          .join(', ') || '4-Socket Strip';
      const currentPower = s.sockets.reduce(
        (sum, sock) => sum + (sock.isOn ? sock.appliance.wattage : 0),
        0
      );

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
        executeSafetyTrip('UNDERVOLTAGE', `${measured.toFixed(1)} V`, clock.formattedFull, activeNames, {
          voltageV: measured,
          temperatureC: s.plugTemperatureC,
          powerW: currentPower,
        });
      } else if (fault === 'OVERVOLTAGE') {
        const measured = 264.8;
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: measured, isAnomaly: true },
        ]);
        executeSafetyTrip('OVERVOLTAGE', `${measured.toFixed(1)} V`, clock.formattedFull, activeNames, {
          voltageV: measured,
          temperatureC: s.plugTemperatureC,
          powerW: currentPower,
        });
      } else if (fault === 'OVERLOAD') {
        const measured = 2480;
        const vDuringFault = Number((s.country.nominalVoltage - 4.2).toFixed(1));
        const targetSocket =
          s.sockets.find((sock) => sock.isOn) ?? s.sockets[0];
        setVoltageHistory((prev) => [
          ...prev.slice(-(MAX_VOLTAGE_POINTS - 1)),
          { tick: s.tickCount + 1, voltage: vDuringFault, isAnomaly: true },
        ]);
        executeSafetyTrip(
          'OVERLOAD',
          `${measured.toLocaleString('en-US')} W`,
          clock.formattedFull,
          `Socket ${targetSocket.socketId} (${targetSocket.appliance.shortName})`,
          {
            voltageV: vDuringFault,
            temperatureC: s.plugTemperatureC,
            powerW: measured,
          },
          targetSocket.socketId
        );
      } else if (fault === 'OVERHEAT') {
        const overheatTemp = 74.6;
        setPlugTemperatureC(overheatTemp);
        executeSafetyTrip(
          'OVERHEAT',
          `${overheatTemp.toFixed(1)} °C`,
          clock.formattedFull,
          activeNames,
          {
            voltageV: currentVoltage,
            temperatureC: overheatTemp,
            powerW: currentPower,
          }
        );
      }
    },
    [executeSafetyTrip]
  );

  const emitWeatherWhatsAppIfExtreme = useCallback(
    (nextWeather: WeatherState) => {
      if (nextWeather.condition !== 'HEAVY_RAIN' && nextWeather.condition !== 'THUNDERSTORM') {
        return;
      }
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);
      const currentVoltage =
        s.voltageHistory[s.voltageHistory.length - 1]?.voltage ?? s.country.nominalVoltage;
      const currentPower = s.sockets.reduce(
        (sum, sock) => sum + (sock.isOn ? sock.appliance.wattage : 0),
        0
      );
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

    if (s.plugTemperatureC >= 70) {
      setPlugTemperatureC(42.0);
    }
    setIsSafetyLocked(false);
    pushNotification(
      'Safety Lock Cleared',
      `4-Socket Strip reset safely. Voltage ${s.country.nominalVoltage}V, Temp ${Math.min(42, s.plugTemperatureC).toFixed(1)}°C.`,
      'info',
      clock.formattedFull
    );
  }, [pushNotification]);

  const toggleSocket = useCallback(
    (socketId: SocketId) => {
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);
      const target = s.sockets.find((sock) => sock.socketId === socketId);
      if (!target) return;

      if (s.isSafetyLocked) {
        if (s.faultInjection !== 'NONE') {
          pushNotification(
            'Safety Lockout Active',
            'Grid or thermal fault is still active. Restore Normal state before switching sockets ON.',
            'critical',
            clock.formattedFull
          );
          return;
        }
        setIsSafetyLocked(false);
      }

      if (target.isOn) {
        // Turn OFF & reset active session metrics
        setSockets((prev) =>
          prev.map((sock) =>
            sock.socketId === socketId
              ? {
                  ...sock,
                  isOn: false,
                  activeDurationSeconds: 0,
                  activeSessionKwh: 0,
                  autoCutoffMinutes: null,
                  remainingCutoffSeconds: null,
                }
              : sock
          )
        );
        return;
      }

      // Turning ON: check individual socket against 2,400W SNI IEC 60884-1 per-socket limit
      if (target.appliance.wattage > MAX_SOCKET_POWER_W) {
        const currentVoltage =
          s.voltageHistory[s.voltageHistory.length - 1]?.voltage ?? s.country.nominalVoltage;
        executeSafetyTrip(
          'OVERLOAD',
          `${target.appliance.wattage.toLocaleString('en-US')} W`,
          clock.formattedFull,
          `Socket ${socketId} (${target.appliance.shortName})`,
          {
            voltageV: currentVoltage,
            temperatureC: s.plugTemperatureC,
            powerW: target.appliance.wattage,
          },
          socketId
        );
        return;
      }

      setSockets((prev) =>
        prev.map((sock) =>
          sock.socketId === socketId
            ? {
                ...sock,
                isOn: true,
                activeDurationSeconds: 0,
                activeSessionKwh: 0,
              }
            : sock
        )
      );
    },
    [executeSafetyTrip, pushNotification]
  );

  const setSocketCutoffTimer = useCallback(
    (socketId: SocketId, minutes: number | null) => {
      const s = stateRef.current;
      const clock = decodeClock(s.clockSeconds);
      const target = s.sockets.find((sock) => sock.socketId === socketId);
      if (!target) return;

      if (minutes === null || minutes <= 0) {
        setSockets((prev) =>
          prev.map((sock) =>
            sock.socketId === socketId
              ? { ...sock, autoCutoffMinutes: null, remainingCutoffSeconds: null }
              : sock
          )
        );
        return;
      }

      if (s.isSafetyLocked) {
        pushNotification(
          'Safety Lockout Active',
          'Reset safety lock before setting a socket timer.',
          'critical',
          clock.formattedFull
        );
        return;
      }

      if (target.appliance.wattage > MAX_SOCKET_POWER_W) {
        const currentVoltage =
          s.voltageHistory[s.voltageHistory.length - 1]?.voltage ?? s.country.nominalVoltage;
        executeSafetyTrip(
          'OVERLOAD',
          `${target.appliance.wattage.toLocaleString('en-US')} W`,
          clock.formattedFull,
          `Socket ${socketId} (${target.appliance.shortName})`,
          {
            voltageV: currentVoltage,
            temperatureC: s.plugTemperatureC,
            powerW: target.appliance.wattage,
          },
          socketId
        );
        return;
      }

      setSockets((prev) =>
        prev.map((sock) =>
          sock.socketId === socketId
            ? {
                ...sock,
                isOn: true,
                autoCutoffMinutes: minutes,
                remainingCutoffSeconds: minutes * 60,
              }
            : sock
        )
      );
    },
    [executeSafetyTrip, pushNotification]
  );

  const jumpToTime = useCallback(
    (hour: number, minute: number) => {
      const s = stateRef.current;
      const current = decodeClock(s.clockSeconds);
      const nextSeconds = current.dayIndex * 86400 + hour * 3600 + minute * 60;
      setClockSeconds(nextSeconds);

      const targetMinuteOfDay = hour * 60 + minute;
      const enteringOffPeak = isOffPeakMinute(targetMinuteOfDay, s.country);
      const targetClock = decodeClock(nextSeconds);

      if (s.autoOnOffPeak && enteringOffPeak && !s.isSafetyLocked) {
        const s1 = s.sockets.find((sock) => sock.socketId === 1);
        if (s1 && !s1.isOn) {
          setSockets((prev) =>
            prev.map((sock) =>
              sock.socketId === 1
                ? { ...sock, isOn: true, activeDurationSeconds: 0, activeSessionKwh: 0 }
                : sock
            )
          );
          pushNotification(
            'Off-Peak Auto-On Activated',
            `Entered ${s.country.shortName} off-peak (${s.country.offPeakWindowLabel}). Socket 1 (Water Heater) turned ON.`,
            'info',
            targetClock.formattedFull
          );
        }
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
    setSockets(createInitialSockets());
    setDailyHistory(INITIAL_DAILY_HISTORY);
    setIsSafetyLocked(false);
    setClockSeconds(INITIAL_CLOCK_SECONDS);
    setSpeedMultiplier(60);
    setFaultInjection('NONE');
    setPlugTemperatureC(INITIAL_PLUG_TEMP_C);
    setAutoOnOffPeak(true);
    setSchedules(DEFAULT_SCHEDULES);
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
      const isNewDay = prevClock.dayIndex !== nextClock.dayIndex;

      if (isNewDay) {
        const s1 = s.sockets.find((sock) => sock.socketId === 1)?.dailyKwh ?? 0;
        const s2 = s.sockets.find((sock) => sock.socketId === 2)?.dailyKwh ?? 0;
        const s3 = s.sockets.find((sock) => sock.socketId === 3)?.dailyKwh ?? 0;
        const s4 = s.sockets.find((sock) => sock.socketId === 4)?.dailyKwh ?? 0;
        setDailyHistory((prev) => [
          ...prev.slice(1),
          {
            dayLabel: prevClock.dayName,
            s1Kwh: Number(s1.toFixed(3)),
            s2Kwh: Number(s2.toFixed(3)),
            s3Kwh: Number(s3.toFixed(3)),
            s4Kwh: Number(s4.toFixed(3)),
          },
        ]);
      }

      const totalActiveWatts = s.sockets.reduce(
        (sum, sock) => sum + (sock.isOn ? sock.appliance.wattage : 0),
        0
      );

      // Realistic combined thermal physics (SNI IEC 60884-1)
      let updatedTemp = s.plugTemperatureC;
      if (s.faultInjection === 'OVERHEAT') {
        updatedTemp = 74.6 + Math.sin(nextTick * 0.5) * 0.4;
        setPlugTemperatureC(Number(updatedTemp.toFixed(1)));
      } else {
        const targetTemp = getSteadyStateTempForTotalPower(totalActiveWatts);
        const speedFactor = Math.min(
          0.14,
          0.008 + Math.log10(Math.max(1, s.speedMultiplier)) * 0.028
        );
        updatedTemp = Number(
          (s.plugTemperatureC + (targetTemp - s.plugTemperatureC) * speedFactor).toFixed(1)
        );
        setPlugTemperatureC(updatedTemp);

        // Auto-trip if natural combined load pushes plug temperature >= 70C
        if (updatedTemp >= 70 && !s.isSafetyLocked && totalActiveWatts > 0) {
          const activeNames =
            s.sockets
              .filter((sock) => sock.isOn)
              .map((sock) => `S${sock.socketId} ${sock.appliance.shortName}`)
              .join(', ') || '4-Socket Strip';
          executeSafetyTrip(
            'OVERHEAT',
            `${updatedTemp.toFixed(1)} °C`,
            nextClock.formattedFull,
            activeNames,
            {
              voltageV: liveVoltage,
              temperatureC: updatedTemp,
              powerW: totalActiveWatts,
            }
          );
          return;
        }
      }

      // Update per-socket duration, activeSessionKwh, dailyKwh, and countdown timers
      const expiredSocketLabels: string[] = [];
      setSockets((prev) =>
        prev.map((sock) => {
          const baseDaily = isNewDay ? 0 : sock.dailyKwh;
          if (!sock.isOn) {
            return isNewDay ? { ...sock, dailyKwh: 0 } : sock;
          }

          const addedKwh = (sock.appliance.wattage * deltaSimSeconds) / 3600000;
          const nextRemaining =
            sock.remainingCutoffSeconds !== null
              ? sock.remainingCutoffSeconds - deltaSimSeconds
              : null;

          if (nextRemaining !== null && nextRemaining <= 0) {
            expiredSocketLabels.push(`S${sock.socketId} (${sock.appliance.shortName})`);
            return {
              ...sock,
              isOn: false,
              activeDurationSeconds: 0,
              activeSessionKwh: 0,
              dailyKwh: baseDaily + addedKwh,
              autoCutoffMinutes: null,
              remainingCutoffSeconds: null,
            };
          }

          return {
            ...sock,
            activeDurationSeconds: sock.activeDurationSeconds + deltaSimSeconds,
            activeSessionKwh: sock.activeSessionKwh + addedKwh,
            dailyKwh: baseDaily + addedKwh,
            remainingCutoffSeconds: nextRemaining,
          };
        })
      );

      if (expiredSocketLabels.length > 0) {
        pushNotification(
          'Socket Timer Auto-Cutoff',
          `Countdown completed. ${expiredSocketLabels.join(', ')} switched OFF.`,
          'info',
          nextClock.formattedFull
        );
      }

      if (s.isSafetyLocked) return;

      // Priority 3: Off-Peak Auto-On entry detection (Socket 1 Water Heater)
      const prevOffPeak = isOffPeakMinute(prevClock.minuteOfDay, s.country);
      const nextOffPeak = isOffPeakMinute(nextClock.minuteOfDay, s.country);
      if (s.autoOnOffPeak && !prevOffPeak && nextOffPeak) {
        const s1 = s.sockets.find((sock) => sock.socketId === 1);
        if (s1 && !s1.isOn) {
          setSockets((prev) =>
            prev.map((sock) =>
              sock.socketId === 1
                ? { ...sock, isOn: true, activeDurationSeconds: 0, activeSessionKwh: 0 }
                : sock
            )
          );
          pushNotification(
            'Off-Peak Auto-On Triggered',
            `Entered ${s.country.shortName} off-peak (${s.country.offPeakWindowLabel}). Socket 1 (Water Heater) turned ON.`,
            'info',
            nextClock.formattedFull
          );
          return;
        }
      }

      // Priority 4: Daily Schedule Start/End match per Socket
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
            const targetSock = s.sockets.find((sock) => sock.socketId === slot.socketId);
            if (!targetSock) continue;

            if (checkMinOfDay === startMin && !targetSock.isOn) {
              setSockets((prev) =>
                prev.map((sock) =>
                  sock.socketId === slot.socketId
                    ? { ...sock, isOn: true, activeDurationSeconds: 0, activeSessionKwh: 0 }
                    : sock
                )
              );
              pushNotification(
                'Schedule Auto-On',
                `${slot.label} started at ${slot.startTime}. Socket ${slot.socketId} (${targetSock.appliance.shortName}) turned ON.`,
                'info',
                nextClock.formattedFull
              );
              return;
            }
            if (checkMinOfDay === endMin && targetSock.isOn) {
              setSockets((prev) =>
                prev.map((sock) =>
                  sock.socketId === slot.socketId
                    ? {
                        ...sock,
                        isOn: false,
                        activeDurationSeconds: 0,
                        activeSessionKwh: 0,
                        autoCutoffMinutes: null,
                        remainingCutoffSeconds: null,
                      }
                    : sock
                )
              );
              pushNotification(
                'Schedule Auto-Off',
                `${slot.label} ended at ${slot.endTime}. Socket ${slot.socketId} (${targetSock.appliance.shortName}) switched OFF.`,
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
  }, [executeSafetyTrip, pushNotification]);

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

  const activeSockets = useMemo(() => sockets.filter((s) => s.isOn), [sockets]);
  const totalPowerWatts = useMemo(
    () => activeSockets.reduce((sum, s) => sum + s.appliance.wattage, 0),
    [activeSockets]
  );
  const totalCurrentAmps = useMemo(
    () => (liveVoltage > 0 ? totalPowerWatts / liveVoltage : 0),
    [totalPowerWatts, liveVoltage]
  );
  const totalDailyKwh = useMemo(
    () => sockets.reduce((sum, s) => sum + s.dailyKwh, 0),
    [sockets]
  );

  const relayState: RelayState = isSafetyLocked
    ? 'TRIPPED'
    : activeSockets.length > 0
      ? 'ON'
      : 'OFF';

  const monthlyProjection = useMemo(
    () => calculateMultiSocketMonthlyProjection(sockets, country, schedules, autoOnOffPeak),
    [sockets, country, schedules, autoOnOffPeak]
  );

  return {
    // Core state
    countryCode,
    country,
    sockets,
    dailyHistory,
    activeSockets,
    isSafetyLocked,
    relayState,
    clock,
    isCurrentlyOffPeak,
    speedMultiplier,
    faultInjection,
    plugTemperatureC,
    thermalStatus,
    voltageStatus,
    weather,
    autoOnOffPeak,
    schedules,
    notifications,
    activeBanner,
    whatsappMessages,
    anomalyLogs,
    voltageHistory,

    // Aggregate Telemetry
    liveVoltage,
    totalPowerWatts,
    totalCurrentAmps,
    totalDailyKwh,
    monthlyProjection,

    // Actions
    selectCountry,
    toggleSocket,
    setSocketCutoffTimer,
    resetSafetyLock,
    setSpeedMultiplier,
    jumpToTime,
    triggerFault,
    setWeatherMode,
    setAutoOnOffPeak,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    dismissBanner,
    resetDemo,
  };
}

export type SimulatorEngine = ReturnType<typeof useSimulatorEngine>;
