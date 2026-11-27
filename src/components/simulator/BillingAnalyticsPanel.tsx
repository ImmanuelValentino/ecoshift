import { Activity, Globe, Info, Leaf, TrendingDown } from 'lucide-react';
import { COUNTRY_LIST } from '../../data/countries';
import { formatCurrency, formatRate } from '../../engine/billingCalculator';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { CountryCode } from '../../types/simulator';
import { AnomalyLogTable } from './AnomalyLogTable';

interface BillingAnalyticsPanelProps {
  engine: SimulatorEngine;
}

export function BillingAnalyticsPanel({ engine }: BillingAnalyticsPanelProps) {
  const {
    countryCode,
    country,
    selectCountry,
    sockets,
    liveVoltage,
    totalCurrentAmps,
    totalPowerWatts,
    totalDailyKwh,
    plugTemperatureC,
    thermalStatus,
    voltageStatus,
    voltageHistory,
    monthlyProjection,
    anomalyLogs,
    faultInjection,
  } = engine;

  // Build SVG Sparkline path for voltage history (range 165V - 275V)
  const minV = 165;
  const maxV = 275;
  const svgW = 300;
  const svgH = 62;
  const mapY = (v: number) => {
    const clamped = Math.max(minV, Math.min(maxV, v));
    return svgH - ((clamped - minV) / (maxV - minV)) * (svgH - 8) - 4;
  };

  const points = voltageHistory.map((pt, idx) => {
    const x =
      voltageHistory.length > 1
        ? (idx / (voltageHistory.length - 1)) * svgW
        : svgW;
    const y = mapY(pt.voltage);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const safeTopY = mapY(231);
  const safeBottomY = mapY(198);
  const maxToleranceY = mapY(242);

  const totalCost = monthlyProjection.totalMonthlyBill;
  const peakSharePct =
    totalCost > 0 ? (monthlyProjection.peakCost / totalCost) * 100 : 0;
  const offPeakSharePct =
    totalCost > 0 ? (monthlyProjection.offPeakCost / totalCost) * 100 : 0;

  return (
    <div className="space-y-3.5">
      {/* Country Regulatory Selector Card */}
      <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#1D1D1F]" />
            <label
              htmlFor="country-tariff-select"
              className="text-xs font-semibold text-[#1D1D1F]"
            >
              Country Tariff Regulation
            </label>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              country.isTOU
                ? 'bg-emerald-50 text-[#047857] border border-emerald-200'
                : 'bg-amber-50 text-[#B45309] border border-amber-200'
            }`}
          >
            {country.isTOU ? 'Time-of-Use (TOU)' : 'Flat Tariff'}
          </span>
        </div>

        <select
          id="country-tariff-select"
          value={countryCode}
          onChange={(e) => selectCountry(e.target.value as CountryCode)}
          className="w-full px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {COUNTRY_LIST.map((c) => (
            <option key={c.code} value={c.code}>
              {c.shortName} [{c.code}] — {c.regulationLabel}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#F5F5F7] rounded-xl px-2.5 py-1.5">
            <span className="text-[#6E6E73] block text-[10px]">Peak Rate</span>
            <span className="font-mono font-semibold text-[#1D1D1F] tabular-nums">
              {formatRate(country.peakRate, country)}
            </span>
          </div>
          <div className="bg-[#F5F5F7] rounded-xl px-2.5 py-1.5">
            <span className="text-[#6E6E73] block text-[10px]">
              Off-Peak ({country.offPeakWindowLabel})
            </span>
            <span className="font-mono font-semibold text-[#047857] tabular-nums">
              {formatRate(country.offPeakRate, country)}
            </span>
          </div>
        </div>
      </div>

      {/* Live Electrical Telemetry + SVG Voltage Waveform */}
      <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#10B981]" />
            <h4 className="text-xs font-semibold text-[#1D1D1F]">
              Live Electrical Telemetry
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#6E6E73]">
            SPLN: 198V–231V (Max 242V)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-[#F5F5F7] rounded-xl p-2 text-center">
            <span className="text-[10px] text-[#6E6E73] block">Voltage</span>
            <span
              className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                voltageStatus === 'UNDERVOLTAGE' ||
                voltageStatus === 'OVERVOLTAGE'
                  ? 'text-[#DC2626]'
                  : voltageStatus === 'HIGH_WARNING'
                    ? 'text-[#D97706]'
                    : 'text-[#1D1D1F]'
              }`}
            >
              {liveVoltage.toFixed(1)} V
            </span>
          </div>
          <div className="bg-[#F5F5F7] rounded-xl p-2 text-center">
            <span className="text-[10px] text-[#6E6E73] block">Total Amp</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#1D1D1F] tabular-nums">
              {totalCurrentAmps.toFixed(2)} A
            </span>
          </div>
          <div className="bg-[#F5F5F7] rounded-xl p-2 text-center">
            <span className="text-[10px] text-[#6E6E73] block">Total Load</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#047857] tabular-nums">
              {totalPowerWatts.toLocaleString('en-US')} W
            </span>
          </div>
          <div className="bg-[#F5F5F7] rounded-xl p-2 text-center">
            <span className="text-[10px] text-[#6E6E73] block">Plug Temp</span>
            <span
              className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                thermalStatus === 'OVERHEAT'
                  ? 'text-[#DC2626]'
                  : thermalStatus === 'WARM'
                    ? 'text-[#D97706]'
                    : 'text-[#1D1D1F]'
              }`}
            >
              {plugTemperatureC.toFixed(1)}°C
            </span>
          </div>
        </div>

        {voltageStatus === 'HIGH_WARNING' && (
          <p className="text-[11px] font-medium text-[#B45309] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
            High Voltage Warning (232V–242V): Approaching SPLN 1:1995 upper limit.
          </p>
        )}

        {/* SVG Voltage Waveform Sparkline */}
        <div className="rounded-xl bg-[#F8FAFC] border border-black/[0.05] p-2">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-[54px] overflow-visible"
            aria-label="Live voltage telemetry waveform"
          >
            {/* Safe operating band (198V - 231V) */}
            <rect
              x="0"
              y={safeTopY}
              width={svgW}
              height={Math.max(2, safeBottomY - safeTopY)}
              fill="#10B981"
              fillOpacity="0.1"
            />
            {/* Upper tolerance 242V line */}
            <line
              x1="0"
              y1={maxToleranceY}
              x2={svgW}
              y2={maxToleranceY}
              stroke="#D97706"
              strokeOpacity="0.45"
              strokeDasharray="2 3"
            />
            <line
              x1="0"
              y1={safeTopY}
              x2={svgW}
              y2={safeTopY}
              stroke="#10B981"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
            <line
              x1="0"
              y1={safeBottomY}
              x2={svgW}
              y2={safeBottomY}
              stroke="#10B981"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
            <polyline
              fill="none"
              stroke={faultInjection !== 'NONE' ? '#DC2626' : '#10B981'}
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points.join(' ')}
            />
          </svg>
        </div>
      </div>

      {/* Monthly Bill Breakdown, Off-Peak Savings & CO2 Impact */}
      <div className="bg-white rounded-2xl border border-black/[0.08] p-3.5 space-y-3 shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">
              30-Day Monthly Bill Estimate
            </p>
            <p className="font-mono text-xl font-bold text-[#1D1D1F] tabular-nums mt-0.5">
              {formatCurrency(monthlyProjection.totalMonthlyBill, country)}
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#6E6E73] bg-[#F5F5F7] px-2.5 py-1 rounded-lg tabular-nums">
            {monthlyProjection.monthlyTotalKwh.toFixed(1)} kWh/mo
          </span>
        </div>

        {/* Peak vs Off-Peak Horizontal Stacked Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-[#F5F5F7] overflow-hidden flex">
            <div
              className="bg-[#D97706] transition-all duration-300"
              style={{ width: `${peakSharePct}%` }}
              title="Peak Hour Cost Share"
            />
            <div
              className="bg-[#10B981] transition-all duration-300"
              style={{ width: `${offPeakSharePct}%` }}
              title="Off-Peak Hour Cost Share"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
            <span className="inline-flex items-center gap-1 text-[#B45309]">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              Peak: {monthlyProjection.monthlyPeakKwh.toFixed(1)} kWh (
              {formatCurrency(monthlyProjection.peakCost, country)})
            </span>
            <span className="inline-flex items-center gap-1 text-[#047857]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              Off-Peak: {monthlyProjection.monthlyOffPeakKwh.toFixed(1)} kWh
            </span>
          </div>
        </div>

        {/* Off-Peak Savings & CO2 Avoided Side-by-Side */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#047857]">
              <TrendingDown className="w-3.5 h-3.5" />
              Off-Peak Savings
            </div>
            <p className="font-mono text-base font-bold text-[#047857] tabular-nums mt-1">
              {formatCurrency(monthlyProjection.offPeakSavings, country)}
            </p>
            <p className="text-[10px] text-[#065F46]/80 mt-0.5">
              {country.isTOU
                ? 'TOU tariff arbitrage / mo'
                : 'Flat tariff (Rp 0 arbitrage)'}
            </p>
          </div>

          <div className="rounded-xl bg-[#F5F5F7] border border-black/[0.06] p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#1D1D1F]">
              <Leaf className="w-3.5 h-3.5 text-[#10B981]" />
              CO2 Avoided
            </div>
            <p className="font-mono text-base font-bold text-[#1D1D1F] tabular-nums mt-1">
              {monthlyProjection.co2AvoidedKg.toFixed(2)} kg
            </p>
            <p className="text-[10px] text-[#6E6E73] mt-0.5">
              {country.peakCarbonGPerKwh} to {country.offPeakCarbonGPerKwh} g/kWh
            </p>
          </div>
        </div>

        {/* Per-Socket Daily Breakdown */}
        <div className="bg-[#F5F5F7] rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#1D1D1F]">
              Today&apos;s 4-Socket Usage
            </span>
            <span className="font-mono font-bold text-[#047857] tabular-nums">
              {totalDailyKwh.toFixed(3)} kWh
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px] tabular-nums">
            {sockets.map((sock) => (
              <div key={sock.socketId} className="bg-white rounded-lg py-1 px-1 border border-black/[0.05]">
                <span className="text-[#6E6E73] block text-[9px]">
                  S{sock.socketId} {sock.appliance.shortName.split(' ')[0]}
                </span>
                <span className="font-bold text-[#1D1D1F]">
                  {sock.dailyKwh.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Note (Crucial for Indonesia Flat vs TOU clarity) */}
        <div
          className={`flex items-start gap-2 rounded-xl p-2.5 text-[11px] leading-relaxed ${
            country.isTOU
              ? 'bg-[#F5F5F7] text-[#424245]'
              : 'bg-amber-50/80 border border-amber-200 text-[#92400E]'
          }`}
        >
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{country.regulationNote}</span>
        </div>
      </div>

      {/* Anomaly History Log */}
      <AnomalyLogTable logs={anomalyLogs} />
    </div>
  );
}

