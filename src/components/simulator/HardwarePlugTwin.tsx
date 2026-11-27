import {
  Droplets,
  Flame,
  Laptop,
  Moon,
  Power,
  ShieldAlert,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { ApplianceId, SocketId } from '../../types/simulator';

interface HardwarePlugTwinProps {
  engine: SimulatorEngine;
}

function getApplianceIcon(id: ApplianceId) {
  switch (id) {
    case 'water_heater':
      return Flame;
    case 'ac':
      return Wind;
    case 'dispenser':
      return Droplets;
    case 'charger':
      return Laptop;
  }
}

export function HardwarePlugTwin({ engine }: HardwarePlugTwinProps) {
  const {
    clock,
    sockets,
    activeSockets,
    relayState,
    totalPowerWatts,
    totalDailyKwh,
    faultInjection,
    plugTemperatureC,
    thermalStatus,
    toggleSocket,
    resetSafetyLock,
  } = engine;

  const isDay = clock.isDaytime;
  const isOn = relayState === 'ON';
  const isTripped = relayState === 'TRIPPED';
  const isWarm = thermalStatus === 'WARM';
  const isOverheat = thermalStatus === 'OVERHEAT';

  const relayLabel = isTripped
    ? 'TRIPPED (LOCKOUT)'
    : activeSockets.length > 0
      ? `${activeSockets.length}/4 SOCKETS ON`
      : 'ALL 4 STANDBY';

  const thermalBadgeLabel = isOverheat
    ? 'OVERHEAT'
    : isWarm
      ? 'WARM'
      : 'NORMAL';

  return (
    <div className="bg-white rounded-3xl border border-black/[0.08] p-4 flex flex-col justify-between gap-3 shadow-xs">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
            Hardware Twin · 4-Socket Strip
          </p>
          <h3 className="text-sm sm:text-base font-semibold text-[#1D1D1F] leading-tight">
            EcoShift Smart Power Strip
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
            isTripped
              ? 'bg-red-50 text-[#DC2626] border border-red-200'
              : isOn
                ? 'bg-emerald-50 text-[#047857] border border-emerald-200'
                : 'bg-[#F5F5F7] text-[#6E6E73] border border-black/[0.06]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTripped
                ? 'bg-[#DC2626] animate-ping'
                : isOn
                  ? 'bg-[#10B981]'
                  : 'bg-[#86868B]'
            }`}
          />
          {relayLabel}
        </span>
      </div>

      {/* Dynamic Day/Night Compact 4-Socket Interactive Stage */}
      <div
        className="relative rounded-2xl overflow-hidden border border-black/[0.08] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] p-3 space-y-2.5"
        style={{
          backgroundColor: isDay ? '#F8FAFC' : '#111827',
        }}
      >
        {/* Nighttime Ambient Glow when any socket is ON */}
        {!isDay && isOn && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-600"
            style={{
              background:
                'radial-gradient(circle at 26% 54%, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.04) 44%, transparent 72%)',
            }}
          />
        )}

        {/* Subtle Reduced Thermal Glow on Power Strip when Warm or Overheat */}
        {(isWarm || isOverheat) && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              background: isOverheat
                ? 'radial-gradient(circle at 18% 55%, rgba(220, 38, 38, 0.14) 0%, rgba(220, 38, 38, 0.03) 34%, transparent 56%)'
                : 'radial-gradient(circle at 18% 55%, rgba(245, 158, 11, 0.11) 0%, rgba(245, 158, 11, 0.02) 32%, transparent 52%)',
            }}
          />
        )}

        {/* Top Status Strip inside Stage */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${
                isDay
                  ? 'bg-[#FEF3C7] text-[#92400E]'
                  : 'bg-[#1E1B4B] text-[#C7D2FE]'
              }`}
            >
              {isDay ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              {isDay ? 'DAY' : 'NIGHT'}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold tabular-nums ${
                isOverheat
                  ? 'bg-red-100 text-[#DC2626]'
                  : isWarm
                    ? 'bg-amber-100 text-[#B45309]'
                    : isDay
                      ? 'bg-white/90 text-[#1D1D1F] border border-black/[0.06]'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700'
              }`}
            >
              <Thermometer className="w-3 h-3" />
              {plugTemperatureC.toFixed(1)}°C ({thermalBadgeLabel})
            </span>
          </div>

          <span
            className={`font-mono text-[11px] font-semibold tabular-nums ${
              totalPowerWatts > 2100
                ? 'text-[#D97706]'
                : isDay
                  ? 'text-[#1D1D1F]'
                  : 'text-slate-200'
            }`}
          >
            {totalPowerWatts.toLocaleString('en-US')} / 2,400 W
          </span>
        </div>

        {/* 4-Socket Power Strip + Animated Cables + 4 Fixed Appliances (Compact No-Scroll) */}
        <div className="relative z-10 space-y-1.5">
          {sockets.map((sock) => {
            const Icon = getApplianceIcon(sock.appliance.id);
            const active = sock.isOn;
            const ledColor = isTripped ? '#DC2626' : active ? '#10B981' : '#94A3B8';

            return (
              <button
                key={sock.socketId}
                type="button"
                onClick={() => toggleSocket(sock.socketId as SocketId)}
                className={`w-full group flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? isDay
                      ? 'bg-white border-emerald-300 shadow-2xs'
                      : 'bg-slate-800/95 border-emerald-500/50 shadow-2xs'
                    : isDay
                      ? 'bg-white/75 border-black/[0.07] hover:bg-white'
                      : 'bg-slate-900/70 border-slate-700/80 hover:bg-slate-800/80'
                }`}
              >
                {/* Left: Smart Strip Socket Unit */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center relative ${
                      isDay
                        ? 'bg-[#F8FAFC] border-slate-300'
                        : 'bg-slate-900 border-slate-600'
                    }`}
                  >
                    {/* LED Ring */}
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isTripped ? 'animate-pulse' : ''
                      }`}
                      style={{ borderColor: ledColor }}
                    >
                      <span className="flex gap-0.5">
                        <span className="w-0.5 h-1 rounded-full bg-slate-500" />
                        <span className="w-0.5 h-1 rounded-full bg-slate-500" />
                      </span>
                    </span>
                    <span className="font-mono text-[8px] font-bold text-[#6E6E73] leading-none mt-0.5">
                      S{sock.socketId}
                    </span>
                  </div>
                </div>

                {/* Middle: Animated Power Cable */}
                <div className="w-12 sm:w-16 shrink-0 flex items-center">
                  <svg viewBox="0 0 64 14" className="w-full h-3.5 overflow-visible">
                    <line
                      x1="0"
                      y1="7"
                      x2="64"
                      y2="7"
                      stroke={isDay ? '#CBD5E1' : '#475569'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {active && (
                      <line
                        x1="0"
                        y1="7"
                        x2="64"
                        y2="7"
                        stroke="#10B981"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeDasharray="6 8"
                        className="animate-power-flow"
                      />
                    )}
                  </svg>
                </div>

                {/* Right: Fixed Appliance Illustration & Status */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        active
                          ? 'bg-emerald-500/15 text-[#10B981]'
                          : isDay
                            ? 'bg-[#F1F5F9] text-[#64748B]'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isDay ? 'text-[#1D1D1F]' : 'text-slate-100'
                        }`}
                      >
                        {sock.appliance.shortName}
                      </p>
                      <p
                        className={`font-mono text-[10px] tabular-nums ${
                          isDay ? 'text-[#6E6E73]' : 'text-slate-400'
                        }`}
                      >
                        {sock.appliance.wattage.toLocaleString('en-US')} W ·{' '}
                        {sock.dailyKwh.toFixed(2)} kWh/d
                      </p>
                    </div>
                  </div>

                  {/* Compact Relay Pill */}
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      isTripped
                        ? 'bg-red-100 text-[#DC2626]'
                        : active
                          ? 'bg-[#10B981] text-white'
                          : isDay
                            ? 'bg-[#E2E8F0] text-[#475569]'
                            : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isTripped ? 'TRIP' : active ? 'ON' : 'OFF'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inline Safety Lockout Bar inside Stage when Tripped */}
        {isTripped && (
          <div className="relative z-10 pt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-400">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {faultInjection !== 'NONE'
                  ? 'Fault active. Restore Normal to unlock.'
                  : 'Conditions safe. Reset lockout.'}
              </span>
            </div>
            <button
              type="button"
              onClick={resetSafetyLock}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#DC2626] text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Power className="w-3 h-3" />
              Reset Lock
            </button>
          </div>
        )}
      </div>

      {/* Compact Footer Summary Strip */}
      <div className="flex items-center justify-between px-1 text-[11px] text-[#6E6E73]">
        <span>Tap any socket unit to toggle relay</span>
        <span className="font-mono font-semibold text-[#1D1D1F] tabular-nums">
          Today: {totalDailyKwh.toFixed(3)} kWh
        </span>
      </div>
    </div>
  );
}
