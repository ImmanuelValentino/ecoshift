import { ArrowDown, Rotate3d, ShieldCheck } from 'lucide-react';
import { EcoShift3DSocket } from './EcoShift3DSocket';

interface HeroSectionProps {
  onLaunchSimulator: () => void;
}

export function HeroSection({ onLaunchSimulator }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="h-screen min-h-[640px] snap-start snap-always flex items-center bg-white pt-16 border-b border-black/[0.05]"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Apple / Samsung Product Launch Identity */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] border border-black/[0.06] text-xs font-semibold text-[#047857]">
              <ShieldCheck className="w-3.5 h-3.5" />
              4-Socket Smart Protection
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-bold text-[#1D1D1F] leading-[1.03] tracking-[-0.035em]">
                EcoShift
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1D1D1F] tracking-tight leading-snug">
                Power, Perfected. Protection, Instant.
              </p>
            </div>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-[#6E6E73] leading-relaxed">
              Smart plug protection that schedules your daily appliances,
              detects voltage and heat anomalies in milliseconds, and keeps
              every socket safe.
            </p>

            <div className="pt-2 flex justify-center lg:justify-start">
              <button
                type="button"
                onClick={onLaunchSimulator}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1D1D1F] hover:bg-[#047857] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                Try Live Simulator
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive 3D Smart Socket (Three.js) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-[520px] rounded-[32px] bg-[#FFFFFF] border border-black/[0.05] shadow-xs overflow-hidden relative">
              <EcoShift3DSocket />
              <div className="pb-4 flex items-center justify-center gap-1.5 text-xs font-medium text-[#6E6E73]">
                <Rotate3d className="w-4 h-4 text-[#047857]" />
                <span>Drag to rotate 360°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
