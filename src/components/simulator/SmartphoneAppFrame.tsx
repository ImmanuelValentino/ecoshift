import { useEffect, useState } from 'react';
import {
  Battery,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  CloudLightning,
  CloudRain,
  MessageCircle,
  Plus,
  Power,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Timer,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import { DAY_NAMES_SHORT } from '../../data/appliances';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';

interface SmartphoneAppFrameProps {
  engine: SimulatorEngine;
}

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: 'Off', minutes: null },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
];

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
    appliance,
    relayState,
    faultInjection,
    plugTemperatureC,
    thermalStatus,
    weather,
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    activeBanner,
    whatsappMessages,
    toggleRelay,
    resetSafetyLock,
    setCountdownMinutes,
    setAutoOnOffPeak,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    dismissBanner,
  } = engine;

  const [activeTab, setActiveTab] = useState<'controls' | 'whatsapp'>('controls');
  const [seenWhatsAppCount, setSeenWhatsAppCount] = useState(0);

  const [showAddForm, setShowAddForm] = useState(false);
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

  const isOn = relayState === 'ON';
  const isTripped = relayState === 'TRIPPED';
  const isWarm = thermalStatus === 'WARM';
  const isOverheat = thermalStatus === 'OVERHEAT';
  const isStorm = weather.condition === 'THUNDERSTORM';
  const isHeavyRain = weather.condition === 'HEAVY_RAIN';

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
    <div className="flex flex-col items-center justify-start">
      {/* Sleek Modern Smartphone Bezel */}
      <div className="relative w-full max-w-[340px] rounded-[40px] bg-[#F5F5F7] border-[8px] border-[#1D1D1F] shadow-xl overflow-hidden flex flex-col">
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
                    ? `Tap to open WhatsApp • ${activeBanner.timestamp}`
                    : `EcoShift Alert • ${activeBanner.timestamp}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone Status Bar + Dynamic Island */}
        <div className="bg-white px-5 pt-3 pb-2 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold text-[#1D1D1F] tabular-nums">
            {clock.formattedTime.slice(0, 5)}
          </span>
          <div className="w-20 h-4 bg-[#1D1D1F] rounded-full" />
          <div className="flex items-center gap-1.5 text-[#1D1D1F]">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* App Mode Switcher: Controls vs WhatsApp (EcoShift Guard) */}
        <div className="bg-white px-4 pb-2.5 border-b border-black/[0.06]">
          <div className="grid grid-cols-2 gap-1 bg-[#F5F5F7] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('controls')}
              className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === 'controls'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Plug Controls
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-[#075E54] text-white shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
              {unreadWhatsApp > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#25D366] text-white font-mono text-[10px] leading-tight">
                  {unreadWhatsApp}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: Smart Plug Controls */}
        {activeTab === 'controls' ? (
          <div className="p-4 space-y-3 flex-1">
            {/* Compact Extreme Weather Warning inside Phone */}
            {(isStorm || isHeavyRain) && (
              <div
                className={`rounded-2xl px-3 py-2 border flex items-center justify-between gap-2 ${
                  isStorm
                    ? 'bg-amber-50 border-amber-200 text-[#92400E]'
                    : 'bg-blue-50 border-blue-200 text-[#1E40AF]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
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
                      {weather.city} • Lightning Protection Standby
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Device Header & Master Power Control */}
            <div className="bg-white rounded-2xl p-3.5 border border-black/[0.06] shadow-2xs">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                    EcoShift App
                  </p>
                  <h4 className="text-sm font-bold text-[#1D1D1F] leading-tight">
                    {appliance.name}
                  </h4>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      isTripped
                        ? 'bg-red-100 text-[#DC2626]'
                        : isOn
                          ? 'bg-emerald-100 text-[#047857]'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                    }`}
                  >
                    {isTripped ? 'TRIPPED' : isOn ? 'ACTIVE' : 'STANDBY'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold tabular-nums ${
                      isOverheat
                        ? 'bg-red-50 text-[#DC2626]'
                        : isWarm
                          ? 'bg-amber-50 text-[#B45309]'
                          : 'bg-[#F5F5F7] text-[#6E6E73]'
                    }`}
                  >
                    <Thermometer className="w-2.5 h-2.5" />
                    {plugTemperatureC.toFixed(1)}°C
                  </span>
                </div>
              </div>

              {/* Tactile Circular Power Button or Safety Reset */}
              <div className="flex flex-col items-center py-1">
                {isTripped ? (
                  <button
                    type="button"
                    onClick={resetSafetyLock}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Reset Safety Lock
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleRelay}
                    aria-label={isOn ? 'Turn smart plug off' : 'Turn smart plug on'}
                    className={`w-15 h-15 rounded-full flex items-center justify-center transition-all cursor-pointer border-4 ${
                      isOn
                        ? 'bg-[#10B981] text-white border-emerald-200 shadow-md shadow-emerald-500/20 hover:bg-[#059669]'
                        : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA] hover:bg-[#EAEAEF]'
                    }`}
                  >
                    <Power className="w-6 h-6" />
                  </button>
                )}

                <p className="text-[11px] text-[#6E6E73] mt-2 text-center">
                  {isTripped
                    ? faultInjection !== 'NONE'
                      ? 'Restore Normal state before unlocking.'
                      : 'Grid & temp safe. Tap to clear safety lockout.'
                    : isOn
                      ? `Drawing ${appliance.wattage.toLocaleString('en-US')} W`
                      : 'Tap to switch socket ON'}
                </p>
              </div>
            </div>

            {/* Countdown Timer Auto-Cutoff */}
            <div className="bg-white rounded-2xl p-3 border border-black/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-[#1D1D1F]" />
                  <span className="text-xs font-semibold text-[#1D1D1F]">
                    Auto-Cutoff Timer
                  </span>
                </div>
                {timerRemainingSeconds !== null ? (
                  <span className="font-mono text-xs font-bold text-[#047857] bg-emerald-50 px-2 py-0.5 rounded-md tabular-nums">
                    {formatCountdown(timerRemainingSeconds)}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#86868B]">Inactive</span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1 bg-[#F5F5F7] p-1 rounded-xl">
                {TIMER_OPTIONS.map((opt) => {
                  const isSelected =
                    (opt.minutes === null && timerRemainingSeconds === null) ||
                    (opt.minutes !== null &&
                      timerRemainingSeconds !== null &&
                      Math.ceil(timerRemainingSeconds / 60) === opt.minutes);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={isTripped}
                      onClick={() => setCountdownMinutes(opt.minutes)}
                      className={`py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 ${
                        isSelected
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
                  {country.shortName}: {country.offPeakWindowLabel}
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

            {/* Daily On/Off Schedules */}
            <div className="bg-white rounded-2xl p-3 border border-black/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-[#1D1D1F]" />
                  <span className="text-xs font-semibold text-[#1D1D1F]">
                    Daily Schedules
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
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Schedule name"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-black/[0.1] text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-[#6E6E73] mb-0.5">
                        Start (Auto-On)
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
                        End (Auto-Off)
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

              <div className="space-y-2 max-h-[145px] overflow-y-auto pr-0.5">
                {schedules.length === 0 ? (
                  <p className="text-[11px] text-[#86868B] text-center py-2">
                    No schedules configured. Tap Add to create one.
                  </p>
                ) : (
                  schedules.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-colors ${
                        slot.enabled
                          ? 'bg-[#F5F5F7]/70 border-black/[0.06]'
                          : 'bg-white border-black/[0.04] opacity-65'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#1D1D1F] truncate">
                          {slot.label}
                        </p>
                        <p className="font-mono text-[11px] font-medium text-[#047857] tabular-nums">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p className="text-[10px] text-[#6E6E73]">
                          {formatDaysLabel(slot.days)}
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
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: Virtual WhatsApp Mockup (EcoShift Guard) */
          <div className="flex-1 flex flex-col bg-[#ECE5DD] min-h-[470px]">
            {/* WhatsApp Official Contact Header */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
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
                    Official Smart Plug Alert Service
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[430px]">
              {whatsappMessages.length === 0 ? (
                <div className="bg-white/90 rounded-2xl p-3.5 border border-black/[0.06] text-center space-y-1.5 mt-6">
                  <MessageCircle className="w-6 h-6 text-[#075E54] mx-auto" />
                  <p className="text-xs font-bold text-[#1D1D1F]">
                    EcoShift Guard Connected
                  </p>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    Trigger Undervoltage (&lt;198V), Overvoltage (&gt;242V),
                    Overheat (&gt;=70°C), Overload (&gt;2,400W), or Extreme Weather
                    to receive real-time WhatsApp alerts here.
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

                    {/* Sensor Snapshot Grid */}
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

        {/* Home Indicator Bar */}
        <div className="py-2 flex justify-center bg-[#F5F5F7]">
          <div className="w-24 h-1 rounded-full bg-[#1D1D1F]/25" />
        </div>
      </div>
    </div>
  );
}
