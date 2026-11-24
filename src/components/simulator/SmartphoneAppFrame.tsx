import { useState } from 'react';
import {
  Battery,
  Bell,
  CalendarClock,
  CheckCircle2,
  Plus,
  Power,
  ShieldAlert,
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
    timerRemainingSeconds,
    autoOnOffPeak,
    schedules,
    activeBanner,
    toggleRelay,
    resetSafetyLock,
    setCountdownMinutes,
    setAutoOnOffPeak,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    dismissBanner,
  } = engine;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('Off-Peak Slot');
  const [newStart, setNewStart] = useState('23:00');
  const [newEnd, setNewEnd] = useState('01:00');
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const isOn = relayState === 'ON';
  const isTripped = relayState === 'TRIPPED';

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
        {/* Top Mobile Push Notification Banner Overlay (z-30) */}
        {activeBanner && (
          <div
            key={activeBanner.id}
            role="alert"
            className="animate-slide-down absolute top-2.5 left-2.5 right-2.5 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-black/[0.1] overflow-hidden"
          >
            <div className="flex items-stretch">
              <div
                className={`w-1.5 shrink-0 ${
                  activeBanner.severity === 'critical'
                    ? 'bg-[#DC2626]'
                    : 'bg-[#10B981]'
                }`}
              />
              <div className="p-3 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeBanner.severity === 'critical' ? (
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
                    onClick={dismissBanner}
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
                  EcoShift Alert • {activeBanner.timestamp}
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

        {/* App Content Body */}
        <div className="p-4 space-y-3.5 flex-1">
          {/* Device Header & Master Power Control */}
          <div className="bg-white rounded-2xl p-3.5 border border-black/[0.06] shadow-2xs">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                  EcoShift App
                </p>
                <h4 className="text-sm font-bold text-[#1D1D1F] leading-tight">
                  {appliance.name}
                </h4>
              </div>
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
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer border-4 ${
                    isOn
                      ? 'bg-[#10B981] text-white border-emerald-200 shadow-md shadow-emerald-500/20 hover:bg-[#059669]'
                      : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA] hover:bg-[#EAEAEF]'
                  }`}
                >
                  <Power className="w-7 h-7" />
                </button>
              )}

              <p className="text-[11px] text-[#6E6E73] mt-2 text-center">
                {isTripped
                  ? faultInjection !== 'NONE'
                    ? 'Restore normal voltage before unlocking.'
                    : 'Grid nominal. Tap to clear safety lockout.'
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

            <div className="space-y-2 max-h-[155px] overflow-y-auto pr-0.5">
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

        {/* Home Indicator Bar */}
        <div className="py-2 flex justify-center bg-[#F5F5F7]">
          <div className="w-24 h-1 rounded-full bg-[#1D1D1F]/25" />
        </div>
      </div>
    </div>
  );
}

