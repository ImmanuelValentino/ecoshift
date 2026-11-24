import { ArrowDownRight, Globe } from 'lucide-react';
import { CountryTariffConfig } from '../../types/simulator';

interface NavbarProps {
  activeCountry: CountryTariffConfig;
}

export function Navbar({ activeCountry }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity with Geometric Leaf-Bolt SVG */}
        <a href="#overview" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center shadow-xs group-hover:bg-[#047857] transition-colors">
            <svg
              viewBox="0 0 24 24"
              className="w-4.5 h-4.5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M19 4C11.5 4 6 8.5 6 16C6 17.5 6.3 18.8 6.8 20C14 19.5 19.5 14.5 19 4Z"
                stroke="#34D399"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M13.2 8.5L10.2 12.8H13.4L10.8 16.5"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-[#1D1D1F]">
            EcoShift Home
          </span>
        </a>

        {/* Center: Smooth-scroll Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E6E73]">
          <a href="#overview" className="hover:text-[#1D1D1F] transition-colors">
            Overview
          </a>
          <a href="#how-it-works" className="hover:text-[#1D1D1F] transition-colors">
            How It Works
          </a>
          <a href="#simulator" className="hover:text-[#1D1D1F] transition-colors">
            Live Simulator
          </a>
          <a href="#bmc" className="hover:text-[#1D1D1F] transition-colors">
            Sustainability BMC
          </a>
        </nav>

        {/* Right: Active Country Tariff Pill + CTA */}
        <div className="flex items-center gap-2.5">
          <a
            href="#simulator"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.06] text-xs font-medium text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors"
            title="Active Country Tariff in Simulator"
          >
            <Globe className="w-3.5 h-3.5 text-[#047857]" />
            <span>
              {activeCountry.shortName} [{activeCountry.code}]
            </span>
            <span className="text-[#6E6E73]">
              • {activeCountry.isTOU ? 'TOU' : 'Flat'}
            </span>
          </a>

          <a
            href="#simulator"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] hover:bg-[#047857] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Launch Live Demo
            <ArrowDownRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

