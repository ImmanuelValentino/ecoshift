import { ArrowDown, Globe2, Leaf, Recycle, SunMedium } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      id="overview"
      className="bg-white pt-16 pb-16 sm:pt-24 sm:pb-20 border-b border-black/[0.05]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#047857] mb-5">
          <Leaf className="w-3.5 h-3.5" />
          Sustainable Home Energy Automation
        </p>

        {/* Main Display Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-[#1D1D1F] leading-[1.08] tracking-[-0.03em]">
          Shift Peak Loads. Protect Appliances. Decarbonize Every Home.
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-[#6E6E73] leading-relaxed">
          EcoShift Home is a plug-and-play single-socket smart plug that shifts
          high-wattage household appliances into cleaner off-peak hours, automates
          deterministic daily schedules, and cuts power in milliseconds during
          electrical grid anomalies.
        </p>

        {/* UN SDG Alignment Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.12] text-xs font-semibold text-[#1D1D1F]">
            <SunMedium className="w-3.5 h-3.5 text-[#047857]" />
            SDG 7 Affordable &amp; Clean Energy
          </span>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.12] text-xs font-semibold text-[#1D1D1F]">
            <Recycle className="w-3.5 h-3.5 text-[#047857]" />
            SDG 12 Responsible Consumption
          </span>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.12] text-xs font-semibold text-[#1D1D1F]">
            <Globe2 className="w-3.5 h-3.5 text-[#047857]" />
            SDG 13 Climate Action
          </span>
        </div>

        {/* Primary CTA */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#simulator"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1D1D1F] hover:bg-[#047857] text-white text-sm font-semibold transition-all shadow-sm"
          >
            Launch Interactive Simulator
            <ArrowDown className="w-4 h-4" />
          </a>
          <a
            href="#bmc"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[#1D1D1F] text-sm font-semibold transition-colors"
          >
            View Sustainability BMC
          </a>
        </div>
      </div>
    </section>
  );
}

