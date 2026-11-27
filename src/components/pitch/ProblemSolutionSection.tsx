import {
  Activity,
  Clock,
  FileWarning,
  Flame,
  PlugZap,
  SlidersHorizontal,
} from 'lucide-react';

const TRIPLE_PROTECTION_PILLARS = [
  {
    pillar: 'EcoShift',
    icon: Clock,
    accent: 'text-[#10B981]',
    title: 'Smart Scheduling',
    description:
      'Automate daily on/off routines and shift high-wattage appliances to cleaner off-peak hours.',
  },
  {
    pillar: 'TripTrace',
    icon: FileWarning,
    accent: 'text-[#DC2626]',
    title: 'Event Diary',
    description:
      'Cuts power in milliseconds on undervoltage (<198V), overvoltage (>242V), or overload (>2,400W) and logs every trip.',
  },
  {
    pillar: 'HeatDot',
    icon: Flame,
    accent: 'text-[#D97706]',
    title: 'Heat Warning',
    description:
      'Monitors socket temperature continuously under SNI IEC 60884-1 and alerts you via WhatsApp before overheating (>=70°C).',
  },
];

const USAGE_STEPS = [
  {
    step: '01',
    icon: PlugZap,
    title: 'Plug In',
    description:
      'Insert Amartaloka into any wall outlet and connect your household appliance.',
  },
  {
    step: '02',
    icon: SlidersHorizontal,
    title: 'Schedule & Protect',
    description:
      'Set daily timers or let automatic voltage and thermal thresholds guard every socket.',
  },
  {
    step: '03',
    icon: Activity,
    title: 'Monitor & Alert',
    description:
      'Track live wattage, temperature, and daily kWh while EcoShift Guard sends instant WhatsApp alerts.',
  },
];

export function ProblemSolutionSection() {
  return (
    <section
      id="product"
      className="min-h-screen lg:h-screen snap-start snap-always flex flex-col justify-center bg-white pt-20 pb-10 border-b border-black/[0.05]"
    >
      <div className="w-full max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-20 xl:px-24 space-y-8">
        {/* Section Title */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#047857] mb-2">
            Amartaloka • EcoShift Smart Plug
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
            Built for Everyday Appliances. Engineered for Safety.
          </h2>
        </div>

        {/* Part A: Triple Protection Pillars (EcoShift, TripTrace, HeatDot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {TRIPLE_PROTECTION_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.pillar}
                className="bg-[#F5F5F7] rounded-3xl p-5 sm:p-6 border border-black/[0.05] flex flex-col gap-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/[0.07] flex items-center justify-center shadow-2xs">
                    <Icon className={`w-5 h-5 ${item.accent}`} />
                  </div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#047857] bg-white px-2.5 py-1 rounded-full border border-black/[0.06]">
                    {item.pillar}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#6E6E73] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Part B: 3 Short Horizontal Usage Steps */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E6E73]">
            How to Use Amartaloka
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
