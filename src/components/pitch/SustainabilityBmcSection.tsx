import {
  Building2,
  Cpu,
  Globe,
  Leaf,
  Share2,
  Users,
} from 'lucide-react';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';

interface SustainabilityBmcSectionProps {
  engine: SimulatorEngine;
}

export function SustainabilityBmcSection({ engine }: SustainabilityBmcSectionProps) {
  const { monthlyProjection, country } = engine;

  const cards = [
    {
      icon: Leaf,
      eyebrow: '01. Value Proposition',
      title: 'Plug-and-Play Protection & Decarbonization',
      points: [
        'Instant sub-50ms voltage anomaly and overload cutoff with mobile push alerts.',
        'Deterministic daily schedules, countdown timers, and country-aligned off-peak auto-on.',
        'Zero rewiring required: retrofits any existing high-load appliance in seconds.',
      ],
    },
    {
      icon: Users,
      eyebrow: '02. Customer Segments',
      title: 'Urban Households & Green Property Operators',
      points: [
        'Urban families running water heaters, bedroom ACs, and dispensers daily.',
        'Households in Time-of-Use tariff regions seeking transparent off-peak bill reductions.',
        'Eco-conscious apartments, student housing, and sustainability-certified developments.',
      ],
    },
    {
      icon: Cpu,
      eyebrow: '03. Key Activities & Resources',
      title: 'Telemetry Firmware & Regulatory Tariff Engine',
      points: [
        'Precision voltage/current sensing firmware with latched hardware relay protection.',
        'Country-specific tariff & grid carbon-intensity dataset maintenance.',
        'Companion mobile interface for deterministic scheduling and fault diagnostics.',
      ],
    },
    {
      icon: Building2,
      eyebrow: '04. Key Partners',
      title: 'Utilities, Appliance Makers & Climate Programs',
      points: [
        'National electric utilities (PLN, TNB, SP Group, EU/UK grid operators) for demand-response alignment.',
        'Residential appliance manufacturers and smart-home retail distributors.',
        'Municipal net-zero initiatives and green building certification bodies.',
      ],
    },
    {
      icon: Share2,
      eyebrow: '05. Channels',
      title: 'Direct Digital & Utility Co-Distribution',
      points: [
        'Direct-to-consumer e-commerce and interactive web simulator onboarding.',
        'Utility demand-side management (DSM) residential awareness programs.',
        'B2B partnerships with property developers and energy efficiency retailers.',
      ],
    },
    {
      icon: Globe,
      eyebrow: '06. Environmental & Social Impact Metrics',
      title: 'Measurable Grid & Climate Outcomes',
      points: [
        `Active Simulator Projection (${country.shortName}): ${monthlyProjection.monthlyOffPeakKwh.toFixed(1)} kWh/month shifted to off-peak.`,
        `Peak Demand Shaved: ${monthlyProjection.peakLoadShavedKw.toFixed(2)} kW per household socket during peak hours.`,
        `Carbon Emissions Avoided: ${monthlyProjection.co2AvoidedKg.toFixed(2)} kg CO2/month per active plug plus extended appliance lifespan.`,
      ],
    },
  ];

  return (
    <section
      id="bmc"
      className="py-16 sm:py-24 bg-white border-t border-black/[0.05] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#047857] mb-2">
            Sustainability Business Model Canvas
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight">
            Built for Scalable Household Climate Impact
          </h2>
          <p className="mt-3 text-base text-[#6E6E73] leading-relaxed">
            A concise executive overview of how EcoShift Home aligns residential
            appliance protection with national grid decarbonization across both
            Flat-Tariff and Time-of-Use markets.
          </p>
        </div>

        {/* 6-Card Apple Bento BMC Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.eyebrow}
                className="bg-[#F5F5F7] rounded-3xl p-6 border border-black/[0.06] flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                    {card.eyebrow}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/[0.07] flex items-center justify-center text-[#047857]">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#1D1D1F] leading-snug">
                  {card.title}
                </h3>

                <ul className="space-y-2 text-sm text-[#424245] leading-relaxed">
                  {card.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 mt-2" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

