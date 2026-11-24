import {
  Droplets,
  Flame,
  Laptop,
  Moon,
  Power,
  ShieldAlert,
  Sun,
  Wind,
} from 'lucide-react';
import { APPLIANCE_PRESETS } from '../../data/appliances';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { ApplianceId } from '../../types/simulator';

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
    relayState,
    appliance,
    applianceId,
    setApplianceId,
    sessionKwh,
    activePowerW,
    faultInjection,
    resetSafetyLock,
  } = engine;

  const isDay = clock.isDaytime;
  const isOn = relayState === 'ON';
  const isTripped = relayState === 'TRIPPED';

  const ledColor = isTripped ? '#DC2626' : isOn ? '#10B981' : '#86868B';
  const relayLabel = isTripped
    ? 'TRIPPED (SAFETY LOCKOUT)'
    : isOn
      ? 'ON (CLOSED)'
      : 'OFF (OPEN)';

  return (
    <div className="bg-white rounded-3xl border border-black/[0.08] p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
            Hardware Twin — 1 Socket
          </p>
          <h3 className="text-base font-semibold text-[#1D1D1F]">
            EcoShift Smart Plug Stage
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            isTripped
              ? 'bg-red-50 text-[#DC2626] border border-red-200'
              : isOn
                ? 'bg-emerald-50 text-[#047857] border border-emerald-200'
                : 'bg-[#F5F5F7] text-[#6E6E73] border border-black/[0.06]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
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

      {/* Dynamic Day/Night Interactive SVG Hardware Stage */}
      <div
        className="relative rounded-2xl overflow-hidden border border-black/[0.08] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          backgroundColor: isDay ? '#F8FAFC' : '#111827',
        }}
      >
        {/* Nighttime Ambient Radial Glow around plug and appliance when ON */}
        {!isDay && isOn && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-600"
            style={{
              background:
                'radial-gradient(circle at 48% 58%, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.06) 42%, transparent 72%)',
            }}
          />
        )}

        {/* Nighttime Danger Glow when Tripped */}
        {isTripped && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle at 26% 58%, rgba(220, 38, 38, 0.22) 0%, transparent 58%)',
            }}
          />
        )}

        {/* Top Bar inside Room Scene */}
        <div className="relative z-10 flex items-center justify-between px-3.5 pt-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider transition-colors duration-600 ${
              isDay
                ? 'bg-[#FEF3C7] text-[#92400E]'
                : 'bg-[#1E1B4B] text-[#C7D2FE]'
            }`}
          >
            {isDay ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            {isDay ? 'DAYTIME' : 'NIGHTTIME'}
          </span>

          <span
            className={`font-mono text-[11px] font-semibold tabular-nums transition-colors duration-600 ${
              isDay ? 'text-[#6E6E73]' : 'text-slate-300'
            }`}
          >
            Load: {activePowerW.toLocaleString('en-US')} W
          </span>
        </div>

        {/* SVG Scene: Window, Wall Outlet + EcoShift 1-Socket Plug, Animated Cable, Reactive Appliance */}
        <svg
          viewBox="0 0 420 245"
          className="w-full h-auto block relative z-10"
          role="img"
          aria-label={`EcoShift smart plug connected to ${appliance.name}, relay ${relayState}`}
        >
          <defs>
            <linearGradient id="daySkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#F0F9FF" />
            </linearGradient>
            <linearGradient id="nightSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#090D16" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="plugBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>

          {/* Background Wall Trim / Floor Line */}
          <line
            x1="0"
            y1="212"
            x2="420"
            y2="212"
            stroke={isDay ? '#E2E8F0' : '#1F2937'}
            strokeWidth="2"
          />
          <rect
            x="0"
            y="212"
            width="420"
            height="33"
            fill={isDay ? '#F1F5F9' : '#0B1120'}
          />

          {/* Room Window (Top Center-Left) */}
          <g transform="translate(150, 14)">
            <rect
              x="0"
              y="0"
              width="116"
              height="68"
              rx="8"
              fill={isDay ? 'url(#daySkyGrad)' : 'url(#nightSkyGrad)'}
              stroke={isDay ? '#CBD5E1' : '#334155'}
              strokeWidth="2.5"
            />
            {isDay ? (
              <g>
                <circle cx="92" cy="18" r="9" fill="#FDE68A" />
                <circle cx="92" cy="18" r="14" fill="#FDE68A" opacity="0.28" />
                <path
                  d="M16 46 Q28 36 42 44 Q52 38 64 46"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </g>
            ) : (
              <g>
                <circle cx="24" cy="18" r="1.4" fill="#E2E8F0" />
                <circle cx="48" cy="12" r="1.1" fill="#CBD5E1" />
                <circle cx="72" cy="24" r="1.5" fill="#F8FAFC" />
                <circle cx="38" cy="36" r="1.1" fill="#94A3B8" />
                <circle cx="96" cy="40" r="1.2" fill="#E2E8F0" />
                <path
                  d="M90 14 A8 8 0 1 0 98 25 A6.5 6.5 0 1 1 90 14 Z"
                  fill="#FDE68A"
                />
              </g>
            )}
            {/* Window Mullions */}
            <line
              x1="58"
              y1="0"
              x2="58"
              y2="68"
              stroke={isDay ? '#CBD5E1' : '#334155'}
              strokeWidth="2"
            />
            <line
              x1="0"
              y1="38"
              x2="116"
              y2="38"
              stroke={isDay ? '#CBD5E1' : '#334155'}
              strokeWidth="2"
            />
          </g>

          {/* SAFETY CUTOFF Pill above plug when tripped */}
          {isTripped && (
            <g transform="translate(26, 74)">
              <rect x="0" y="0" width="108" height="20" rx="10" fill="#DC2626" />
              <text
                x="54"
                y="13.5"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.06em"
              >
                SAFETY CUTOFF
              </text>
            </g>
          )}

          {/* Wall Outlet Backplate + EcoShift 1-Socket Smart Plug (Left Side) */}
          <g transform="translate(36, 102)">
            {/* Wall Plate */}
            <rect
              x="0"
              y="0"
              width="88"
              height="96"
              rx="14"
              fill={isDay ? '#E2E8F0' : '#1E293B'}
              stroke={isDay ? '#CBD5E1' : '#334155'}
              strokeWidth="1.5"
            />
            {/* EcoShift Smart Plug Matte Body */}
            <rect
              x="8"
              y="8"
              width="72"
              height="80"
              rx="18"
              fill="url(#plugBodyGrad)"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />

            {/* Status LED Ring */}
            <circle
              cx="44"
              cy="46"
              r="24"
              fill="none"
              stroke={ledColor}
              strokeWidth="4"
              opacity={isTripped ? '0.95' : '0.9'}
            >
              {isTripped && (
                <animate
                  attributeName="opacity"
                  values="1;0.2;1"
                  dur="0.7s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Inner Socket Well */}
            <circle
              cx="44"
              cy="46"
              r="18"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            {/* Socket Pin Holes */}
            <circle cx="37" cy="46" r="3" fill="#334155" />
            <circle cx="51" cy="46" r="3" fill="#334155" />
            {/* Ground Clip Indicators */}
            <rect x="42.5" y="30" width="3" height="4" rx="1" fill="#94A3B8" />
            <rect x="42.5" y="58" width="3" height="4" rx="1" fill="#94A3B8" />

            {/* Brand Text on Plug */}
            <text
              x="44"
              y="81"
              textAnchor="middle"
              fill="#64748B"
              fontSize="7"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              ECOSHIFT
            </text>
          </g>

          {/* Animated Power Cable Bridge (Center) */}
          <g key={applianceId} className="animate-plug-in">
            {/* Plugged-in Cord Head */}
            <rect
              x="76"
              y="141"
              width="18"
              height="14"
              rx="4"
              fill="#1D1D1F"
            />
            {/* Base Power Cord */}
            <path
              d="M 94 148 C 145 148, 165 186, 224 186 C 254 186, 266 172, 282 166"
              fill="none"
              stroke={isDay ? '#334155' : '#475569'}
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Live Electricity Pulse Overlay when Relay ON */}
            {isOn && (
              <path
                d="M 94 148 C 145 148, 165 186, 224 186 C 254 186, 266 172, 282 166"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="10 14"
                className="animate-power-flow"
              />
            )}
          </g>

          {/* Right Side: Reactive Appliance Vector Illustrations */}
          {applianceId === 'water_heater' && (
            <g transform="translate(278, 92)">
              {/* Wall-Mounted Cylindrical Tank */}
              <rect
                x="10"
                y="6"
                width="98"
                height="92"
                rx="22"
                fill="#FFFFFF"
                stroke={isDay ? '#CBD5E1' : '#475569'}
                strokeWidth="2"
              />
              {/* Accent Band */}
              <rect
                x="10"
                y="68"
                width="98"
                height="12"
                fill={isOn ? '#ECFDF5' : '#F1F5F9'}
              />
              {/* Digital Temp Screen */}
              <rect
                x="35"
                y="26"
                width="48"
                height="24"
                rx="6"
                fill={isOn ? '#064E3B' : '#1E293B'}
              />
              <text
                x="59"
                y="42"
                textAnchor="middle"
                fill={isOn ? '#34D399' : '#475569'}
                fontSize="11"
                fontFamily="monospace"
                fontWeight="700"
              >
                {isOn ? '58 C' : '-- C'}
              </text>
              {/* Status Dot */}
              <circle
                cx="59"
                cy="74"
                r="3.5"
                fill={isOn ? '#10B981' : '#94A3B8'}
              />
              {/* Hot/Cold Pipes */}
              <rect x="36" y="98" width="6" height="18" rx="2" fill="#EF4444" opacity="0.7" />
              <rect x="76" y="98" width="6" height="18" rx="2" fill="#3B82F6" opacity="0.7" />
              {/* Thermal Indicator Waves when ON */}
              {isOn && (
                <g className="animate-thermal-wave">
                  <path
                    d="M38 -4 Q42 -12 46 -4 T54 -4"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M64 -4 Q68 -12 72 -4 T80 -4"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              )}
            </g>
          )}

          {applianceId === 'ac' && (
            <g transform="translate(264, 96)">
              {/* Split-Wall AC Unit */}
              <rect
                x="6"
                y="8"
                width="124"
                height="46"
                rx="10"
                fill="#FFFFFF"
                stroke={isDay ? '#CBD5E1' : '#475569'}
                strokeWidth="2"
              />
              {/* Top Intake Line */}
              <line x1="18" y1="20" x2="118" y2="20" stroke="#E2E8F0" strokeWidth="2" />
              {/* Temp Display */}
              <rect
                x="92"
                y="26"
                width="26"
                height="12"
                rx="3"
                fill={isOn ? '#064E3B' : '#1E293B'}
              />
              <text
                x="105"
                y="35"
                textAnchor="middle"
                fill={isOn ? '#34D399' : '#475569'}
                fontSize="8"
                fontFamily="monospace"
                fontWeight="700"
              >
                {isOn ? '24C' : 'OFF'}
              </text>
              {/* Louver */}
              <rect
                x="18"
                y={isOn ? '47' : '44'}
                width="100"
                height="5"
                rx="2"
                fill={isOn ? '#10B981' : '#94A3B8'}
                opacity={isOn ? '0.85' : '0.6'}
              />
              {/* Cool Air Stream Lines when ON */}
              {isOn && (
                <g>
                  <path
                    d="M34 58 Q30 78 24 96"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                    className="animate-air-stream"
                  />
                  <path
                    d="M68 58 Q68 80 68 98"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                    className="animate-air-stream"
                  />
                  <path
                    d="M102 58 Q106 78 112 96"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                    className="animate-air-stream"
                  />
                </g>
              )}
            </g>
          )}

          {applianceId === 'dispenser' && (
            <g transform="translate(292, 62)">
              {/* Water Bottle on Top */}
              <rect
                x="18"
                y="4"
                width="44"
                height="46"
                rx="10"
                fill="#BAE6FD"
                fillOpacity="0.55"
                stroke="#38BDF8"
                strokeWidth="1.8"
              />
              <path
                d="M20 30 Q40 24 60 30 L60 44 Q40 48 20 44 Z"
                fill="#38BDF8"
                fillOpacity="0.45"
              />
              {/* Dispenser Body */}
              <rect
                x="12"
                y="50"
                width="56"
                height="100"
                rx="8"
                fill="#FFFFFF"
                stroke={isDay ? '#CBD5E1' : '#475569'}
                strokeWidth="2"
              />
              {/* Hot & Cold Indicator LEDs */}
              <circle cx="30" cy="64" r="4" fill={isOn ? '#EF4444' : '#94A3B8'} />
              <circle cx="50" cy="64" r="4" fill={isOn ? '#3B82F6' : '#94A3B8'} />
              {/* Tap Recess */}
              <rect x="20" y="78" width="40" height="30" rx="4" fill="#F1F5F9" />
              <rect x="28" y="80" width="6" height="10" rx="2" fill="#EF4444" />
              <rect x="46" y="80" width="6" height="10" rx="2" fill="#3B82F6" />
              {/* Lower Cabinet */}
              <line x1="16" y1="118" x2="64" y2="118" stroke="#E2E8F0" strokeWidth="1.5" />
            </g>
          )}

          {applianceId === 'charger' && (
            <g transform="translate(274, 114)">
              {/* Laptop Screen */}
              <rect
                x="16"
                y="8"
                width="96"
                height="62"
                rx="7"
                fill="#1D1D1F"
                stroke="#475569"
                strokeWidth="2"
              />
              <rect
                x="22"
                y="14"
                width="84"
                height="50"
                rx="3"
                fill={isOn ? '#064E3B' : '#0F172A'}
              />
              {/* Battery Indicator on Screen */}
              <rect
                x="48"
                y="31"
                width="30"
                height="15"
                rx="3"
                fill="none"
                stroke={isOn ? '#34D399' : '#475569'}
                strokeWidth="2"
              />
              <rect
                x="78"
                y="35"
                width="3"
                height="7"
                rx="1"
                fill={isOn ? '#34D399' : '#475569'}
              />
              <rect
                x="51"
                y="34"
                width={isOn ? '20' : '8'}
                height="9"
                rx="1.5"
                fill={isOn ? '#10B981' : '#334155'}
              />
              <text
                x="64"
                y="57"
                textAnchor="middle"
                fill={isOn ? '#A7F3D0' : '#64748B'}
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="600"
              >
                {isOn ? 'CHARGING 65W' : 'STANDBY'}
              </text>
              {/* Aluminum Laptop Base */}
              <path
                d="M4 72 L124 72 L118 82 L10 82 Z"
                fill="#E2E8F0"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
              {/* USB-C Adapter Brick */}
              <rect x="6" y="48" width="16" height="14" rx="3" fill="#FFFFFF" stroke="#94A3B8" />
            </g>
          )}
        </svg>

        {/* Inline Safety Lockout Bar inside Stage when Tripped */}
        {isTripped && (
          <div className="relative z-10 px-3.5 pb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {faultInjection !== 'NONE'
                  ? 'Fault active. Restore normal voltage to unlock.'
                  : 'Voltage normal. Safe to reset lockout.'}
              </span>
            </div>
            <button
              type="button"
              onClick={resetSafetyLock}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#DC2626] text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Power className="w-3 h-3" />
              Reset Lock
            </button>
          </div>
        )}
      </div>

      {/* Appliance Selector Dock (1 Connected Appliance at a Time) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1D1D1F]">
            Connected Appliance (1 Socket)
          </span>
          <span className="font-mono text-xs text-[#6E6E73] tabular-nums">
            Session: {sessionKwh.toFixed(3)} kWh
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {APPLIANCE_PRESETS.map((item) => {
            const Icon = getApplianceIcon(item.id);
            const selected = item.id === applianceId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setApplianceId(item.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selected
                    ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs'
                    : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/[0.05] hover:bg-[#EAEAEF]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selected
                      ? 'bg-emerald-500/20 text-[#34D399]'
                      : 'bg-white text-[#1D1D1F] border border-black/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{item.shortName}</div>
                  <div
                    className={`font-mono text-[11px] tabular-nums ${
                      selected ? 'text-slate-300' : 'text-[#6E6E73]'
                    }`}
                  >
                    {item.wattage.toLocaleString('en-US')} W
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

