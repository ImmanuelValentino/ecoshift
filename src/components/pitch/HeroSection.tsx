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
      <div className="w-full max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-20 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Amartaloka / EcoShift Product Launch Identity */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.06] text-xs font-semibold text-[#047857]">
              <ShieldCheck className="w-3.5 h-3.5" />
              One Plug, Triple Protection • Smart Home Plug
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6E6E73]">
                EcoShift Smart Plug
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-bold italic text-[#0F172A] leading-[1.03] tracking-[-0.035em]">
                Amartaloka
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#1D1D1F] tracking-tight leading-snug pt-1">
                One Plug, Triple Protection.
              </p>
            </div>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-[#6E6E73] leading-relaxed">
              Save Energy. Detect Problems. Prevent Risks — a smart home plug
              that schedules daily appliances, records electrical events, and
              warns you before overheating.
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

          {/* Right Column: Interactive 3D Amartaloka Smart Plug (Three.js) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-[500px] rounded-[32px] bg-[#FFFFFF] border border-black/[0.05] shadow-xs overflow-hidden relative">
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
