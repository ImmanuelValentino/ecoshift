import {
  AlertTriangle,
  BellOff,
  Clock,
  CloudLightning,
  CloudRain,
  FastForward,
  Flame,
  Moon,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sun,
  Volume2,
  VolumeX,
  Zap,
  ZapOff,
} from 'lucide-react';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { SpeedMultiplier, WeatherMode } from '../../types/simulator';

interface DemoControlBarProps {
  engine: SimulatorEngine;
}

const SPEED_OPTIONS: { value: SpeedMultiplier; label: string }[] = [
  { value: 0, label: 'Pause' },
  { value: 1, label: '1x' },
  { value: 60, label: '60x' },
  { value: 300, label: '300x' },
  { value: 1800, label: '1800x' },
];

const TIME_JUMPS: { hour: number; minute: number; label: string }[] = [
  { hour: 7, minute: 30, label: '07:30 Morning' },
  { hour: 13, minute: 0, label: '13:00 Midday' },
  { hour: 19, minute: 30, label: '19:30 Peak' },
  { hour: 23, minute: 5, label: '23:05 Off-Peak' },
];

const WEATHER_OPTIONS: { mode: WeatherMode; label: string }[] = [
  { mode: 'LIVE_API', label: 'Live API' },
  { mode: 'CLEAR', label: 'Clear (Normal)' },
  { mode: 'HEAVY_RAIN', label: 'Heavy Rain' },
  { mode: 'THUNDERSTORM', label: 'Thunderstorm' },
];

export function DemoControlBar({ engine }: DemoControlBarProps) {
  const {
    clock,
    isCurrentlyOffPeak,
    speedMultiplier,
    faultInjection,
    weather,
    isAlarmActive,
    isAlarmMuted,
    setSpeedMultiplier,
    jumpToTime,
    triggerFault,
    setWeatherMode,
    toggleAlarmMute,
    stopAndResetAlarm,
    resetDemo,
  } = engine;

  return (
    <div className="w-full bg-white rounded-2xl border border-black/[0.08] p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Top Row: Virtual Clock, Speed, and Weather Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-black/[0.06]">
            <Clock className="w-4 h-4 text-[#6E6E73]" />
            <span className="font-mono text-sm sm:text-base font-semibold text-[#1D1D1F] tabular-nums">
              {clock.formattedFull}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
              clock.isDaytime
                ? 'bg-[#FEF3C7] text-[#92400E]'
                : 'bg-[#1E1B4B] text-[#C7D2FE]'
            }`}
          >
            {clock.isDaytime ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
            {clock.isDaytime ? 'DAYTIME' : 'NIGHTTIME'}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
              isCurrentlyOffPeak
                ? 'bg-emerald-50 text-[#047857] border border-emerald-200'
                : 'bg-amber-50 text-[#B45309] border border-amber-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCurrentlyOffPeak ? 'bg-[#10B981]' : 'bg-[#D97706]'
              }`}
            />
            {isCurrentlyOffPeak ? 'OFF-PEAK WINDOW' : 'PEAK WINDOW'}
          </span>
        </div>

        {/* Speed Multiplier Segmented Control */}
        <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.06]">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#6E6E73] px-2">
            <FastForward className="w-3.5 h-3.5" />
            Speed
          </span>
          {SPEED_OPTIONS.map((opt) => {
            const active = speedMultiplier === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSpeedMultiplier(opt.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white/70'
                }`}
              >
                {opt.value === 0 ? (
                  <Pause className="w-3 h-3" />
                ) : opt.value === 1 ? (
                  <Play className="w-3 h-3" />
                ) : null}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Row: Time Jump Presets + Fault & Thermal Simulation Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-black/[0.06]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mr-1">
            Jump Time
          </span>
          {TIME_JUMPS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => jumpToTime(preset.hour, preset.minute)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED] border border-black/[0.05] transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mr-1">
            Safety &amp; Thermal Test
          </span>
          <button
            type="button"
            onClick={() => triggerFault('UNDERVOLTAGE')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              faultInjection === 'UNDERVOLTAGE'
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-red-50/70 text-[#B91C1C] border-red-200 hover:bg-red-100'
            }`}
          >
            <ZapOff className="w-3.5 h-3.5" />
            Undervoltage 176V
          </button>

          <button
            type="button"
            onClick={() => triggerFault('OVERVOLTAGE')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              faultInjection === 'OVERVOLTAGE'
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-red-50/70 text-[#B91C1C] border-red-200 hover:bg-red-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Overvoltage 265V
          </button>

          <button
            type="button"
            onClick={() => triggerFault('OVERLOAD')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              faultInjection === 'OVERLOAD'
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-red-50/70 text-[#B91C1C] border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overload 2,480W
          </button>

          <button
            type="button"
            onClick={() => triggerFault('OVERHEAT')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              faultInjection === 'OVERHEAT'
                ? 'bg-[#DC2626] text-white border-[#DC2626]'
                : 'bg-orange-50/80 text-[#C2410C] border-orange-200 hover:bg-orange-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Simulate Overheat (&gt;70°C)
          </button>

          {faultInjection !== 'NONE' && (
            <button
              type="button"
              onClick={() => triggerFault('NONE')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#10B981] text-white hover:bg-[#059669] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Restore Normal
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Weather Protection Controls + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-black/[0.06]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mr-1">
            Weather ({weather.city})
          </span>
          {WEATHER_OPTIONS.map((opt) => {
            const active = weather.mode === opt.mode;
            const isStorm = opt.mode === 'THUNDERSTORM';
            const isRain = opt.mode === 'HEAVY_RAIN';
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setWeatherMode(opt.mode)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? isStorm
                      ? 'bg-[#B45309] text-white border-[#B45309]'
                      : isRain
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                        : 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                    : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.06] hover:bg-[#EAEAEF]'
                }`}
              >
                {opt.mode === 'LIVE_API' ? (
                  <Radio className="w-3 h-3" />
                ) : opt.mode === 'THUNDERSTORM' ? (
                  <CloudLightning className="w-3 h-3" />
                ) : opt.mode === 'HEAVY_RAIN' ? (
                  <CloudRain className="w-3 h-3" />
                ) : (
                  <Sun className="w-3 h-3" />
                )}
                {opt.label}
              </button>
            );
          })}
          <span className="text-[11px] text-[#6E6E73] ml-1">
            {weather.isLoading
              ? 'Syncing weather...'
              : `${weather.description} (${weather.ambientTempC}°C)`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={toggleAlarmMute}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isAlarmMuted
                ? 'bg-[#F5F5F7] text-[#6E6E73] border-black/[0.08] hover:text-[#1D1D1F]'
                : 'bg-emerald-50 text-[#047857] border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Toggle Web Audio alarm sound"
          >
            {isAlarmMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            {isAlarmMuted ? 'Alarm Audio: Muted' : 'Alarm Audio: ON'}
          </button>

          <button
            type="button"
            disabled={!isAlarmActive}
            onClick={stopAndResetAlarm}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              isAlarmActive
                ? 'bg-[#DC2626] text-white border-[#DC2626] hover:bg-red-700 shadow-xs'
                : 'bg-[#F5F5F7] text-[#86868B] border-black/[0.06] opacity-60 cursor-not-allowed'
            }`}
            title="Silence alarm and reset safety fault state"
          >
            <BellOff className="w-3.5 h-3.5" />
            Stop &amp; Reset Alarm
          </button>

          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.1] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
            title="Reset simulator to default state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
}
