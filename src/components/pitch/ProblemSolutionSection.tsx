import {
  Activity,
  BarChart3,
  Clock,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export function ProblemSolutionSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 bg-white border-b border-black/[0.05] scroll-mt-20"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Problem Context Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#047857] mb-2">
              The Grid Challenge &amp; Solution
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight">
              One Socket. Deterministic Protection and Cleaner Grid Timing.
            </h2>
          </div>
          <p className="lg:col-span-5 text-sm sm:text-base text-[#6E6E73] leading-relaxed">
            Evening peak demand forces utilities to fire carbon-heavy fossil
            peaker plants, while residential voltage swings silently degrade
            appliances and forgotten loads waste power overnight.
          </p>
        </div>

        {/* 3-Card Problem Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B45309] mb-2">
              <Zap className="w-4 h-4" />
              Peak-Hour Grid Congestion
            </div>
            <p className="text-sm text-[#6E6E73] leading-relaxed">
              Running thermal and cooling loads during 18:00–22:00 spikes grid
              carbon intensity and exposes Time-of-Use households to peak rates.
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626] mb-2">
              <ShieldAlert className="w-4 h-4" />
              Unstable Voltage &amp; Thermal Risk
            </div>
            <p className="text-sm text-[#6E6E73] leading-relaxed">
              Sudden brownout sags below 198V, surges above 242V (SPLN 1:1995),
              or socket overheating above 70°C (SNI IEC 60884-1) silently damage
              appliances and create fire hazards.
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1D1D1F] mb-2">
              <Clock className="w-4 h-4" />
              Forgotten Appliance Runtime
            </div>
            <p className="text-sm text-[#6E6E73] leading-relaxed">
              Water dispensers, chargers, and heaters left active overnight waste
              kilowatt-hours and accelerate hardware wear.
            </p>
          </div>
        </div>

        {/* 3-Step Apple Bento Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#F5F5F7] rounded-3xl p-6 sm:p-7 border border-black/[0.05] flex flex-col justify-between gap-5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-[#1D1D1F] shadow-2xs">
              <Activity className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-[#6E6E73] mb-1">
                01. SENSE AND PROTECT
              </p>
              <h3 className="text-xl font-bold text-[#1D1D1F]">
                Sub-Second Anomaly Cutoff
              </h3>
              <p className="mt-2.5 text-sm text-[#6E6E73] leading-relaxed">
                Continuous voltage, load, and thermal monitoring trips the relay
                open in under 50ms on sags (&lt;198V), surges (&gt;242V),
                overloads (&gt;2,400W), or overheat (&gt;=70°C) while pushing an
                instant EcoShift Guard WhatsApp alert.
              </p>
            </div>
          </div>

          <div className="bg-[#F5F5F7] rounded-3xl p-6 sm:p-7 border border-black/[0.05] flex flex-col justify-between gap-5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-[#1D1D1F] shadow-2xs">
              <Clock className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-[#6E6E73] mb-1">
                02. SHIFT TO OFF-PEAK
              </p>
              <h3 className="text-xl font-bold text-[#1D1D1F]">
                Deterministic Scheduling
              </h3>
              <p className="mt-2.5 text-sm text-[#6E6E73] leading-relaxed">
                Users control explicit daily Mon–Sun schedules, countdown
                auto-cutoff timers, and country-aware Off-Peak Auto-On triggers —
                no opaque black-box overrides.
              </p>
            </div>
          </div>

          <div className="bg-[#F5F5F7] rounded-3xl p-6 sm:p-7 border border-black/[0.05] flex flex-col justify-between gap-5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-[#1D1D1F] shadow-2xs">
              <BarChart3 className="w-5 h-5 text-[#047857]" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-[#6E6E73] mb-1">
                03. QUANTIFY IMPACT
              </p>
              <h3 className="text-xl font-bold text-[#1D1D1F]">
                Regulatory-Accurate Analytics
              </h3>
              <p className="mt-2.5 text-sm text-[#6E6E73] leading-relaxed">
                Transparent 30-day bill forecasts adapt to each country&apos;s
                tariff regulation — separating Flat Tariff grids (Indonesia) from
                Time-of-Use markets (UK, Malaysia, Singapore, Germany).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

