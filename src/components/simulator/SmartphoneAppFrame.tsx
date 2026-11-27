import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Battery,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  CloudRain,
  LayoutDashboard,
  MessageCircle,
  PlugZap,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import { DAY_NAMES_SHORT } from '../../data/appliances';
import { formatCurrency, formatRate } from '../../engine/billingCalculator';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { SocketId } from '../../types/simulator';

interface SmartphoneAppFrameProps {
  engine: SimulatorEngine;
}

type PhoneTab = 'dashboard' | 'socket' | 'schedule' | 'whatsapp';

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: 'Off', minutes: null },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
];

function formatDurationHMS(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function formatCountdown(totalSec: number): string {
  const clamped = Math.max(0, Math.ceil(totalSec));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDaysLabel(days: number[]): string {
  if (days.length === 7) return 'Every Day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }
  return days.map((d) => DAY_NAMES_SHORT[d]).join(', ');
}

export function SmartphoneAppFrame({ engine }: SmartphoneAppFrameProps) {
  const {
    clock,
    country,
    sockets,
    chartPeriodMode,
    periodAnalytics,
    activeSockets,
    isSafetyLocked,
    faultInjection,
    liveVoltage,
    totalPowerWatts,
    totalCurrentAmps,
    totalDailyKwh,
    plugTemperatureC,
    thermalStatus,
    voltageStatus,
    weather,
    autoOnOffPeak,
    schedules,
    activeBanner,
    whatsappMessages,
    setChartPeriodMode,
    stepPeriodOffset,
    toggleSocket,
    setSocketCutoffTimer,
    resetSafetyLock,
    setAutoOnOffPeak,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    dismissBanner,
  } = engine;

  const [activeTab, setActiveTab] = useState<PhoneTab>('dashboard');
  const [seenWhatsAppCount, setSeenWhatsAppCount] = useState(0);
  const [pinnedBarIdx, setPinnedBarIdx] = useState<number | null>(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const chartCardRef = useRef<HTMLDivElement | null>(null);
  const phoneScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = phoneScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atBottom || el.scrollHeight <= el.clientHeight) {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    setPinnedBarIdx(null);
    setHoveredBarIdx(null);
  }, [chartPeriodMode, periodAnalytics.periodOffset]);

  useEffect(() => {
    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (chartCardRef.current && !chartCardRef.current.contains(e.target as Node)) {
        setPinnedBarIdx(null);
        setHoveredBarIdx(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSocketId, setNewSocketId] = useState<SocketId>(1);
  const [newLabel, setNewLabel] = useState('Off-Peak Slot');
  const [newStart, setNewStart] = useState('23:00');
  const [newEnd, setNewEnd] = useState('01:00');
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (activeTab === 'whatsapp') {
      setSeenWhatsAppCount(whatsappMessages.length);
    }
  }, [activeTab, whatsappMessages.length]);

  const unreadWhatsApp =
    activeTab === 'whatsapp'
      ? 0
      : Math.max(0, whatsappMessages.length - seenWhatsAppCount);

  const isWarm = thermalStatus === 'WARM';
  const isOverheat = thermalStatus === 'OVERHEAT';
  const isStorm = weather.condition === 'THUNDERSTORM';
  const isHeavyRain = weather.condition === 'HEAVY_RAIN';
  const maxSocketDailyKwh = Math.max(0.01, ...sockets.map((s) => s.dailyKwh));

  const chartBars = periodAnalytics.bars;
  const rawMaxPeriodKwh = Math.max(
    1,
    ...chartBars.map((b) => b.totalKwh)
  );
  const yStep =
    rawMaxPeriodKwh <= 6
      ? 2
      : rawMaxPeriodKwh <= 15
        ? 5
        : rawMaxPeriodKwh <= 30
          ? 10
          : rawMaxPeriodKwh <= 60
            ? 20
            : Math.ceil(rawMaxPeriodKwh / 3 / 5) * 5;
  const yMax = yStep * 3;
  const yTicks = [yMax, yStep * 2, yStep, 0];

  const activeTooltipIdx = pinnedBarIdx !== null ? pinnedBarIdx : hoveredBarIdx;
  const tooltipBar =
    activeTooltipIdx !== null ? chartBars[activeTooltipIdx] ?? null : null;

  const getTooltipPositionClass = (idx: number, total: number): string => {
    if (idx === 0 || (total >= 7 && idx === 1)) {
      return 'left-0';
    }
    if (idx === total - 1 || (total >= 7 && idx === total - 2)) {
      return 'right-0';
    }
    return 'left-1/2 -translate-x-1/2';
  };

  const handleToggleDay = (dayIdx: number) => {
    setNewDays((prev) =>
      prev.includes(dayIdx)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIdx)
          : prev
        : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    addSchedule({
      socketId: newSocketId,
      label: newLabel.trim(),
      startTime: newStart,
      endTime: newEnd,
      days: newDays,
      enabled: true,
    });
    setShowAddForm(false);
    setNewLabel('Off-Peak Slot');
  };

  return (
    <div className="flex flex-col items-center justify-start w-full">
      {/* Sleek Modern Smartphone Bezel (Fixed Height Across All Tabs) */}
      <div className="relative h-[690px] w-full max-w-[390px] mx-auto rounded-[40px] bg-[#F5F5F7] border-[8px] border-[#1D1D1F] shadow-xl overflow-hidden flex flex-col">
        {/* Top Mobile / WhatsApp Push Notification Banner Overlay (z-30) */}
        {activeBanner && (
          <div
            key={activeBanner.id}
            role="alert"
            onClick={() => {
              if (activeBanner.channel === 'WHATSAPP') {
                setActiveTab('whatsapp');
              }
            }}
            className="animate-slide-down absolute top-2.5 left-2.5 right-2.5 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-black/[0.1] overflow-hidden cursor-pointer"
          >
            <div className="flex items-stretch">
              <div
                className={`w-1.5 shrink-0 ${
                  activeBanner.channel === 'WHATSAPP'
                    ? 'bg-[#25D366]'
                    : activeBanner.severity === 'critical'
                      ? 'bg-[#DC2626]'
                      : activeBanner.severity === 'warning'
                        ? 'bg-[#D97706]'
                        : 'bg-[#10B981]'
                }`}
              />
              <div className="p-3 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeBanner.channel === 'WHATSAPP' ? (
                      <MessageCircle className="w-4 h-4 text-[#075E54] shrink-0" />
                    ) : activeBanner.severity === 'critical' ? (
                      <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    )}
                    <p className="text-xs font-bold text-[#1D1D1F] truncate">
                      {activeBanner.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissBanner();
                    }}
                    className="text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] leading-snug text-[#424245] mt-1">
                  {activeBanner.message}
                </p>
                <p className="font-mono text-[10px] text-[#86868B] mt-1 tabular-nums">
                  {activeBanner.channel === 'WHATSAPP'
                    ? `Tap to open WhatsApp · ${activeBanner.timestamp}`
                    : `EcoShift Alert · ${activeBanner.timestamp}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Fixed Top Header (Status Bar + Dynamic Island) */}
        <div className="shrink-0 bg-white px-5 pt-3 pb-2 flex items-center justify-between border-b border-black/[0.05]">
          <span className="font-mono text-[11px] font-semibold text-[#1D1D1F] tabular-nums">
            {clock.formattedTime.slice(0, 5)}
          </span>
          <div className="w-20 h-4 bg-[#1D1D1F] rounded-full" />
          <div className="flex items-center gap-1.5 text-[#1D1D1F]">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 2. Scrollable Screen Body */}
        <div
          ref={phoneScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain phone-scroll"
        >
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="px-4 py-3 space-y-2.5">
              {/* Extreme Weather Warning inside Phone */}
              {(isStorm || isHeavyRain) && (
                <div
                  className={`rounded-2xl px-3 py-2 border flex items-center gap-2 ${
                    isStorm
                      ? 'bg-amber-50 border-amber-200 text-[#92400E]'
                      : 'bg-blue-50 border-blue-200 text-[#1E40AF]'
                  }`}
                >
                  {isStorm ? (
                    <CloudLightning className="w-4 h-4 shrink-0 text-[#D97706]" />
                  ) : (
                    <CloudRain className="w-4 h-4 shrink-0 text-[#2563EB]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">
                      {isStorm ? 'Thunderstorm Surge Risk' : 'Heavy Rain Advisory'}
                    </p>
                    <p className="text-[10px] opacity-85 truncate">
                      {weather.city} · Lightning Protection Standby
                    </p>
                  </div>
                </div>
              )}

              {/* Safety Lockout Quick Reset */}
              {isSafetyLocked && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#DC2626]">
                      Safety Lockout Active
                    </p>
                    <p className="text-[10px] text-[#991B1B] truncate">
                      {faultInjection !== 'NONE'
                        ? 'Restore Normal state first'
                        : 'Conditions safe to unlock'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetSafetyLock}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer hover:bg-red-700"
                  >
                    Reset Lock
                  </button>
                </div>
              )}

              {/* Active Sockets Summary Card (Clickable -> Socket Tab) */}
              <button
                type="button"
                onClick={() => setActiveTab('socket')}
                className="w-full text-left bg-white rounded-2xl p-3 border border-black/[0.06] shadow-2xs hover:border-emerald-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                    Active Sockets
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#047857]">
                    Manage
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#1D1D1F] truncate">
                    {activeSockets.length > 0
                      ? activeSockets
                          .map((s) => `S${s.socketId} ${s.appliance.shortName}`)
                          .join(' • ')
                      : 'All 4 Sockets Standby'}
                  </p>
                  <span className="font-mono text-xs font-bold text-[#047857] shrink-0 tabular-nums">
                    {totalPowerWatts.toLocaleString('en-US')} W
                  </span>
                </div>
              </button>

              {/* Stacked Bar Chart: Daily Usage by Socket (kWh) with Weekly/Monthly & 1-Year History */}
              <div
                ref={chartCardRef}
                onClick={(e) => {
                  // Clicking empty background inside card closes tooltip
                  if ((e.target as HTMLElement).closest('button[data-chart-bar]') === null &&
                      (e.target as HTMLElement).closest('[data-chart-nav]') === null) {
                    setPinnedBarIdx(null);
                    setHoveredBarIdx(null);
                  }
                }}
                className="bg-white rounded-2xl p-3 border border-black/[0.06] space-y-2 relative"
              >
                {/* Header Row + Weekly/Monthly Mode Switch */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#1D1D1F]">
                    Daily Usage by Socket (kWh)
                  </span>
                  <div
                    data-chart-nav="true"
                    className="inline-flex bg-[#F5F5F7] p-0.5 rounded-lg border border-black/[0.05]"
                  >
                    <button
                      type="button"
                      onClick={() => setChartPeriodMode('weekly')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                        chartPeriodMode === 'weekly'
                          ? 'bg-white text-[#1D1D1F] shadow-2xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriodMode('monthly')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                        chartPeriodMode === 'monthly'
                          ? 'bg-white text-[#1D1D1F] shadow-2xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Period Navigation Bar (< Date Range / Month >) */}
                <div
                  data-chart-nav="true"
                  className="flex items-center justify-between gap-1.5 bg-[#F5F5F7] rounded-xl px-2 py-1"
                >
                  <button
                    type="button"
                    disabled={!periodAnalytics.canGoBack}
                    onClick={() => stepPeriodOffset(-1)}
                    aria-label="Previous period"
                    className="p-1 rounded-lg text-[#1D1D1F] hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[10px] font-semibold text-[#1D1D1F] truncate tabular-nums">
                      {periodAnalytics.periodLabel}
                    </span>
                    {periodAnalytics.isCurrentPeriod && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#047857] text-[9px] font-bold">
                        Current
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!periodAnalytics.canGoForward}
                    onClick={() => stepPeriodOffset(1)}
                    aria-label="Next period"
                    className="p-1 rounded-lg text-[#1D1D1F] hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Compact 4-Socket Legend */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] font-medium text-[#424245]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#10B981]" />
                    S1 Heater
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#3B82F6]" />
                    S2 AC
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#F59E0B]" />
                    S3 Dispenser
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#6366F1]" />
                    S4 Charger
                  </span>
                </div>

                {/* Chart Plot Area: Y-Axis (kWh) + Stacked Bars + Edge-Clamped Floating Tooltip */}
                <div className="relative pt-1">
                  {/* Floating Tooltip Overlay */}
                  {tooltipBar && activeTooltipIdx !== null && (
                    <div
                      role="status"
                      className={`pointer-events-none absolute -top-1 z-20 w-[156px] rounded-xl bg-[#1D1D1F]/95 text-white px-2.5 py-2 shadow-lg border border-white/10 ${getTooltipPositionClass(
                        activeTooltipIdx,
                        chartBars.length
                      )}`}
                    >
                      <p className="text-[10px] font-bold text-white truncate">
                        {tooltipBar.tooltipLabel}
                      </p>
                      <div className="mt-1 space-y-0.5 font-mono text-[10px] tabular-nums">
                        <div className="flex items-center justify-between text-slate-200">
                          <span>Total</span>
                          <span className="font-bold text-white">
                            {tooltipBar.totalKwh.toFixed(2)} kWh
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-200">
                          <span>Cost</span>
                          <span className="font-bold text-white">
                            {formatCurrency(tooltipBar.cost, country)}
                          </span>
                        </div>
                        {country.isTOU && (
                          <div className="flex items-center justify-between text-[#34D399]">
                            <span>Savings</span>
                            <span className="font-bold">
                              {formatCurrency(tooltipBar.savings, country)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-stretch gap-1 h-[118px]">
                    {/* Y-Axis Unit Label ('kWh') + Numeric Scale */}
                    <div className="flex items-stretch gap-1 shrink-0 pb-4">
                      <span className="self-center -rotate-90 text-[8px] font-semibold uppercase tracking-wider text-[#6E6E73] select-none w-3 text-center">
                        kWh
                      </span>
                      <div className="flex flex-col justify-between text-right pr-1 font-mono text-[9px] text-[#86868B] tabular-nums select-none">
                        {yTicks.map((t) => (
                          <span key={t} className="leading-none">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Gridlines & Bars Container */}
                    <div
                      className="relative flex-1 flex flex-col"
                      onMouseLeave={() => setHoveredBarIdx(null)}
                    >
                      <div className="relative flex-1 flex items-end justify-between gap-1.5 px-1">
                        {/* Horizontal Grid Lines */}
                        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                          {yTicks.map((t) => (
                            <div
                              key={t}
                              className="w-full border-b border-[#E5E7EB]"
                            />
                          ))}
                        </div>

                        {/* Stacked Bars (Bottom-to-Top: S1 -> S2 -> S3 -> S4) */}
                        {chartBars.map((bar, idx) => {
                          const totalPct =
                            bar.totalKwh > 0
                              ? Math.min(100, (bar.totalKwh / yMax) * 100)
                              : 0;
                          const s1Pct =
                            bar.totalKwh > 0 ? (bar.s1Kwh / bar.totalKwh) * 100 : 0;
                          const s2Pct =
                            bar.totalKwh > 0 ? (bar.s2Kwh / bar.totalKwh) * 100 : 0;
                          const s3Pct =
                            bar.totalKwh > 0 ? (bar.s3Kwh / bar.totalKwh) * 100 : 0;
                          const s4Pct =
                            bar.totalKwh > 0 ? (bar.s4Kwh / bar.totalKwh) * 100 : 0;
                          const isSelected = activeTooltipIdx === idx;

                          return (
                            <button
                              key={bar.id}
                              type="button"
                              data-chart-bar="true"
                              onClick={() => {
                                setPinnedBarIdx((prev) => (prev === idx ? null : idx));
                                setHoveredBarIdx(null);
                              }}
                              onMouseEnter={() => setHoveredBarIdx(idx)}
                              className="relative z-10 flex-1 h-full flex flex-col justify-end items-center group cursor-pointer focus:outline-none"
                              aria-label={`${bar.tooltipLabel}: ${bar.totalKwh.toFixed(2)} kWh`}
                            >
                              {bar.totalKwh > 0 ? (
                                <div
                                  className={`w-full ${
                                    chartBars.length <= 4 ? 'max-w-[34px]' : 'max-w-[22px]'
                                  } flex flex-col-reverse rounded-t-sm overflow-hidden transition-all duration-300 ${
                                    isSelected
                                      ? 'ring-1 ring-[#1D1D1F] ring-offset-1'
                                      : 'opacity-90 group-hover:opacity-100'
                                  }`}
                                  style={{ height: `${Math.max(3, totalPct)}%` }}
                                >
                                  <div
                                    className="w-full bg-[#10B981]"
                                    style={{ height: `${s1Pct}%` }}
                                  />
                                  <div
                                    className="w-full bg-[#3B82F6]"
                                    style={{ height: `${s2Pct}%` }}
                                  />
                                  <div
                                    className="w-full bg-[#F59E0B]"
                                    style={{ height: `${s3Pct}%` }}
                                  />
                                  <div
                                    className="w-full bg-[#6366F1]"
                                    style={{ height: `${s4Pct}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="w-full max-w-[22px] h-[2px] rounded-full bg-[#E5E7EB]" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* X-Axis Labels */}
                      <div className="flex items-center justify-between gap-1.5 px-1 pt-1">
                        {chartBars.map((bar, idx) => {
                          const isSelected = activeTooltipIdx === idx;
                          return (
                            <span
                              key={`lbl-${bar.id}`}
                              className={`flex-1 text-center font-mono text-[9px] truncate ${
                                isSelected
                                  ? 'font-bold text-[#1D1D1F]'
                                  : 'text-[#6E6E73]'
                              }`}
                            >
                              {bar.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Total Usage + Per-Socket Daily Breakdown */}
              <div className="bg-white rounded-2xl p-3 border border-black/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#1D1D1F]">
                    Today&apos;s Total Usage
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1D1D1F] tabular-nums">
                    {totalDailyKwh.toFixed(3)} kWh
                  </span>
                </div>
                <div className="space-y-1.5">
                  {sockets.map((sock) => {
                    const pct = Math.min(100, (sock.dailyKwh / maxSocketDailyKwh) * 100);
                    return (
                      <div key={sock.socketId} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-medium text-[#424245] truncate">
                            S{sock.socketId} {sock.appliance.shortName}
                          </span>
                          <span className="font-mono text-[#6E6E73] tabular-nums">
                            {sock.dailyKwh.toFixed(3)} kWh
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              sock.isOn ? 'bg-[#10B981]' : 'bg-[#94A3B8]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actual Period Bill & Adaptive Off-Peak / Flat Tariff Card */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-2xl p-3 border border-black/[0.06]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] block">
                    {chartPeriodMode === 'weekly' ? 'WEEKLY BILL' : 'MONTHLY BILL'}
                  </span>
                  <p className="font-mono text-sm font-bold text-[#1D1D1F] tabular-nums mt-1 truncate">
                    {formatCurrency(periodAnalytics.totalBill, country)}
                  </p>
                  <p className="font-mono text-[10px] text-[#6E6E73] mt-0.5 tabular-nums">
                    {periodAnalytics.totalKwh.toFixed(1)} kWh
                  </p>
                </div>

                {country.isTOU ? (
                  <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#047857] block">
                      OFF-PEAK SAVINGS
                    </span>
                    <p className="font-mono text-sm font-bold text-[#047857] tabular-nums mt-1 truncate">
                      {formatCurrency(periodAnalytics.totalOffPeakSavings, country)}
                    </p>
                    <p className="font-mono text-[10px] text-[#065F46]/80 mt-0.5 tabular-nums">
                      Off-Peak: {periodAnalytics.totalOffPeakKwh.toFixed(1)} kWh
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#92400E] block">
                      TARIF FLAT (PLN)
                    </span>
                    <p className="font-mono text-xs font-bold text-[#92400E] tabular-nums mt-1 truncate">
                      {formatRate(country.peakRate, country)}
                    </p>
                    <p className="text-[10px] text-[#92400E]/85 mt-0.5">
                      {periodAnalytics.peakLoadShavedKw.toFixed(2)} kW Shifted
                    </p>
                  </div>
                )}
              </div>

              {/* Live Electrical & Thermal Telemetry */}
              <div className="bg-white rounded-2xl p-3 border border-black/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[11px] font-semibold text-[#1D1D1F]">
                      Live Telemetry
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#047857]">
                    {voltageStatus === 'NORMAL' && thermalStatus === 'NORMAL'
                      ? 'SAFE'
                      : 'CHECK'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-[#F5F5F7] rounded-xl py-1.5 px-1">
                    <span className="text-[9px] text-[#6E6E73] block">Volt</span>
                    <span
                      className={`font-mono text-[11px] font-bold tabular-nums ${
                        voltageStatus === 'UNDERVOLTAGE' ||
                        voltageStatus === 'OVERVOLTAGE'
                          ? 'text-[#DC2626]'
                          : voltageStatus === 'HIGH_WARNING'
                            ? 'text-[#D97706]'
                            : 'text-[#1D1D1F]'
                      }`}
                    >
                      {liveVoltage.toFixed(0)}V
                    </span>
                  </div>
                  <div className="bg-[#F5F5F7] rounded-xl py-1.5 px-1">
                    <span className="text-[9px] text-[#6E6E73] block">Amp</span>
                    <span className="font-mono text-[11px] font-bold text-[#1D1D1F] tabular-nums">
                      {totalCurrentAmps.toFixed(1)}A
                    </span>
                  </div>
                  <div className="bg-[#F5F5F7] rounded-xl py-1.5 px-1">
                    <span className="text-[9px] text-[#6E6E73] block">Load</span>
                    <span className="font-mono text-[11px] font-bold text-[#047857] tabular-nums">
                      {totalPowerWatts}W
                    </span>
                  </div>
                  <div className="bg-[#F5F5F7] rounded-xl py-1.5 px-1">
                    <span className="text-[9px] text-[#6E6E73] block">Temp</span>
                    <span
                      className={`font-mono text-[11px] font-bold tabular-nums ${
                        isOverheat
                          ? 'text-[#DC2626]'
                          : isWarm
                            ? 'text-[#D97706]'
                            : 'text-[#1D1D1F]'
                      }`}
                    >
                      {plugTemperatureC.toFixed(1)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCKET (4 Independent Socket Cards) */}
          {activeTab === 'socket' && (
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                  4 Sockets
                </span>
                <span className="font-mono text-[10px] font-semibold text-[#047857] tabular-nums">
                  {totalPowerWatts.toLocaleString('en-US')} W Total · Limit 2,400 W/Socket
                </span>
              </div>

              {sockets.map((sock) => (
                <div
                  key={sock.socketId}
                  className={`bg-white rounded-2xl p-3 border transition-colors space-y-2 ${
                    sock.isOn ? 'border-emerald-300 shadow-2xs' : 'border-black/[0.06]'
                  }`}
                >
                  {/* Socket Identity + Status + ON/OFF Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F5F5F7] text-[#1D1D1F]">
                          Socket {sock.socketId}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                            sock.isOn
                              ? 'bg-emerald-100 text-[#047857]'
                              : 'bg-[#F5F5F7] text-[#6E6E73]'
                          }`}
                        >
                          {sock.isOn ? 'ACTIVE' : 'STANDBY'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#1D1D1F] mt-1 truncate">
                        {sock.appliance.shortName} ·{' '}
                        <span className="font-mono font-semibold text-[#6E6E73]">
                          {sock.appliance.wattage.toLocaleString('en-US')} W
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={sock.isOn}
                      aria-label={`Toggle Socket ${sock.socketId} ${sock.appliance.shortName}`}
                      onClick={() => toggleSocket(sock.socketId)}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                        sock.isOn ? 'bg-[#10B981]' : 'bg-[#D1D1D6]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          sock.isOn ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Active Session Metrics: Duration & Session kWh */}
                  <div className="grid grid-cols-2 gap-1.5 bg-[#F5F5F7] rounded-xl p-2 font-mono text-[10px] tabular-nums">
                    <div>
                      <span className="text-[#6E6E73] block text-[9px]">
                        Session Duration
                      </span>
                      <span className="font-bold text-[#1D1D1F]">
                        {formatDurationHMS(sock.activeDurationSeconds)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6E6E73] block text-[9px]">
                        Session Energy
                      </span>
                      <span className="font-bold text-[#047857]">
                        {sock.activeSessionKwh.toFixed(3)} kWh
                      </span>
                    </div>
                  </div>

                  {/* Optional Per-Socket Auto-Cutoff Timer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="inline-flex items-center gap-1 font-medium text-[#6E6E73]">
                        <Timer className="w-3 h-3" />
                        Auto-Cutoff
                      </span>
                      {sock.remainingCutoffSeconds !== null ? (
                        <span className="font-mono font-bold text-[#047857] tabular-nums">
                          {formatCountdown(sock.remainingCutoffSeconds)} left
                        </span>
                      ) : (
                        <span className="text-[#86868B]">Off</span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1 bg-[#F5F5F7] p-0.5 rounded-lg">
                      {TIMER_OPTIONS.map((opt) => {
                        const selected =
                          (opt.minutes === null && sock.autoCutoffMinutes === null) ||
                          (opt.minutes !== null && sock.autoCutoffMinutes === opt.minutes);
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setSocketCutoffTimer(sock.socketId, opt.minutes)}
                            className={`py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                              selected
                                ? 'bg-white text-[#1D1D1F] shadow-2xs'
                                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="px-4 py-3 space-y-3">
              {/* Off-Peak Auto-On Toggle */}
              <div className="bg-white rounded-2xl p-3 border border-black/[0.06] flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#047857]" />
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      Auto-On at Off-Peak
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6E73] mt-0.5">
                    S1 Water Heater · {country.offPeakWindowLabel}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoOnOffPeak}
                  aria-label="Toggle Auto-On at Off-Peak Hour"
                  onClick={() => setAutoOnOffPeak(!autoOnOffPeak)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    autoOnOffPeak ? 'bg-[#10B981]' : 'bg-[#D1D1D6]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      autoOnOffPeak ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Daily Schedules bound to Socket 1-4 */}
              <div className="bg-white rounded-2xl p-3 border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-[#1D1D1F]" />
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      Socket Schedules
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] hover:text-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {showAddForm && (
                  <form
                    onSubmit={handleSaveSchedule}
                    className="bg-[#F5F5F7] rounded-xl p-2.5 space-y-2 border border-black/[0.06]"
                  >
                    <div>
                      <label className="block text-[10px] font-medium text-[#6E6E73] mb-0.5">
                        Target Socket
                      </label>
                      <select
                        value={newSocketId}
                        onChange={(e) => setNewSocketId(Number(e.target.value) as SocketId)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-black/[0.1] text-xs font-semibold text-[#1D1D1F]"
                      >
                        {sockets.map((sock) => (
                          <option key={sock.socketId} value={sock.socketId}>
                            Socket {sock.socketId}: {sock.appliance.shortName} ({sock.appliance.wattage}W)
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Schedule name"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-black/[0.1] text-xs text-[#1D1D1F]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-[#6E6E73] mb-0.5">
                          Start (ON)
                        </label>
                        <input
                          type="time"
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-black/[0.1] font-mono text-xs text-[#1D1D1F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[#6E6E73] mb-0.5">
                          End (OFF)
                        </label>
                        <input
                          type="time"
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-black/[0.1] font-mono text-xs text-[#1D1D1F]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {DAY_NAMES_SHORT.map((day, idx) => {
                        const active = newDays.includes(idx);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleDay(idx)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer ${
                              active
                                ? 'bg-[#1D1D1F] text-white'
                                : 'bg-white text-[#6E6E73] border border-black/[0.08]'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#6E6E73] hover:bg-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#10B981] text-white hover:bg-[#059669] cursor-pointer"
                      >
                        Save Slot
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {schedules.length === 0 ? (
                    <p className="text-[11px] text-[#86868B] text-center py-3">
                      No schedules configured. Tap Add to create one.
                    </p>
                  ) : (
                    schedules.map((slot) => {
                      const targetSock = sockets.find((s) => s.socketId === slot.socketId);
                      return (
                        <div
                          key={slot.id}
                          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                            slot.enabled
                              ? 'bg-[#F5F5F7]/70 border-black/[0.06]'
                              : 'bg-white border-black/[0.04] opacity-65'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-white border border-black/[0.08] text-[#1D1D1F]">
                                S{slot.socketId} {targetSock?.appliance.shortName ?? ''}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-[#1D1D1F] truncate">
                              {slot.label}
                            </p>
                            <p className="font-mono text-[11px] font-medium text-[#047857] tabular-nums">
                              {slot.startTime} – {slot.endTime} · {formatDaysLabel(slot.days)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={slot.enabled}
                              aria-label={`Toggle ${slot.label}`}
                              onClick={() => toggleSchedule(slot.id)}
                              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                                slot.enabled ? 'bg-[#10B981]' : 'bg-[#D1D1D6]'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                                  slot.enabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSchedule(slot.id)}
                              aria-label={`Delete ${slot.label}`}
                              className="p-1 text-[#86868B] hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP (EcoShift Guard) */}
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col bg-[#ECE5DD] min-h-full">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#25D366]/20 border border-white/25 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">EcoShift Guard</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                    </div>
                    <p className="text-[10px] text-emerald-100/85">
                      Official 4-Socket Strip Alert Service
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                {whatsappMessages.length === 0 ? (
                  <div className="bg-white/90 rounded-2xl p-3.5 border border-black/[0.06] text-center space-y-1.5 mt-4">
                    <MessageCircle className="w-6 h-6 text-[#075E54] mx-auto" />
                    <p className="text-xs font-bold text-[#1D1D1F]">
                      EcoShift Guard Connected
                    </p>
                    <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                      Trigger Undervoltage (&lt;198V), Overvoltage (&gt;242V),
                      Overheat (&gt;=70°C), Overload (&gt;2,400W), or Extreme
                      Weather to receive real-time WhatsApp alerts here.
                    </p>
                  </div>
                ) : (
                  whatsappMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-black/[0.06] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold ${
                            msg.severity === 'critical'
                              ? 'text-[#DC2626]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {msg.eventTitle}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            msg.severity === 'critical'
                              ? 'bg-red-50 text-[#DC2626]'
                              : 'bg-amber-50 text-[#B45309]'
                          }`}
                        >
                          {msg.eventType.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#1D1D1F] leading-snug">
                        {msg.detail}
                      </p>

                      <div className="grid grid-cols-3 gap-1 bg-[#F5F5F7] rounded-xl p-1.5 font-mono text-[10px] tabular-nums text-center">
                        <div>
                          <span className="text-[#6E6E73] block text-[9px]">Volt</span>
                          <span className="font-bold text-[#1D1D1F]">
                            {msg.voltageV.toFixed(1)}V
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6E6E73] block text-[9px]">Temp</span>
                          <span className="font-bold text-[#1D1D1F]">
                            {msg.temperatureC.toFixed(1)}°C
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6E6E73] block text-[9px]">Power</span>
                          <span className="font-bold text-[#1D1D1F]">
                            {msg.powerW.toLocaleString('en-US')}W
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.05]">
                        <span className="text-[10px] font-semibold text-[#047857]">
                          Status: {msg.actionStatus}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#86868B] tabular-nums">
                          {msg.simulatedTime}
                          <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Fixed Bottom Navigation Bar + Home Indicator */}
        <div className="shrink-0 mt-auto bg-white border-t border-black/[0.08]">
          <nav
            aria-label="Smartphone App Navigation"
            className="px-2 pt-1.5 pb-1 grid grid-cols-4 gap-1"
          >
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#047857]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('socket')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'socket'
                ? 'text-[#047857]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <div className="relative">
              <PlugZap className="w-4 h-4" />
              {activeSockets.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#10B981] text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {activeSockets.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Socket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'schedule'
                ? 'text-[#047857]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span className="text-[10px] font-semibold mt-0.5">Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'text-[#075E54]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-4 h-4" />
              {unreadWhatsApp > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#25D366] text-white font-mono text-[9px] font-bold flex items-center justify-center">
                  {unreadWhatsApp}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-0.5">WhatsApp</span>
          </button>
          </nav>

          {/* Home Indicator Bar */}
          <div className="py-1.5 flex justify-center bg-white">
            <div className="w-24 h-1 rounded-full bg-[#1D1D1F]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
