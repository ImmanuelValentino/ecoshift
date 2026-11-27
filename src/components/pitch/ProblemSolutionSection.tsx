import {
  Activity,
  Bell,
  Clock,
  PlugZap,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

const CORE_FEATURES = [
  {
    icon: Clock,
    accent: 'text-[#10B981]',
    title: 'Smart Daily Scheduling',
    description:
      'Automate daily on/off routines and shift heavy appliances to off-peak hours.',
  },
  {
    icon: ShieldAlert,
    accent: 'text-[#DC2626]',
    title: 'Instant Anomaly Cutoff',
    description:
      'Cuts power automatically on undervoltage (<198V), overvoltage (>242V), or overheat (>=70°C).',
  },
  {
    icon: Bell,
    accent: 'text-[#047857]',
    title: 'Real-Time Energy & WhatsApp Alerts',
    description:
      'Track per-socket kWh usage and receive instant safety alerts on your phone.',
  },
];

const USAGE_STEPS = [
  {
    step: '01',
    icon: PlugZap,
    title: 'Plug In',
    description:
      'Insert EcoShift into any wall outlet and connect your appliance.',
  },
  {
    step: '02',
    icon: SlidersHorizontal,
    title: 'Set Schedule & Limits',
    description:
      'Choose daily timers or let automatic safety thresholds guard the socket.',
  },
  {
    step: '03',
    icon: Activity,
    title: 'Monitor & Control',
    description:
      'Watch live wattage, temperature, and daily kWh directly from the app.',
  },
];

export function ProblemSolutionSection() {
  return (
    <section
      id="product"
      className="min-h-screen lg:h-screen snap-start snap-always flex flex-col justify-center bg-white pt-20 pb-10 border-b border-black/[0.05]"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Title */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#047857] mb-2">
            Product &amp; How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
            Built for Everyday Appliances. Engineered for Safety.
          </h2>
        </div>

        {/* Part A: Core Product Features (3 Compact Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-[#F5F5F7] rounded-3xl p-5 sm:p-6 border border-black/[0.05] flex flex-col gap-3.5"
              >
                <div className="w-10 h-10 rounded-2xl bg-white border border-black/[0.07] flex items-center justify-center shadow-2xs">
                  <Icon className={`w-5 h-5 ${feat.accent}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F]">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#6E6E73] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Part B: 3 Short Horizontal Usage Steps */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E6E73]">
            How to Use EcoShift
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {USAGE_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white rounded-2xl p-5 border border-black/[0.08] flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#1D1D1F]" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] font-bold text-[#047857]">
                      {item.step}. {item.title}
                    </p>
                    <p className="mt-1 text-sm text-[#6E6E73] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
