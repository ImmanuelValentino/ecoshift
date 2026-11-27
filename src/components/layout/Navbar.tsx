import { ArrowDownRight, Globe } from 'lucide-react';
import { CountryTariffConfig } from '../../types/simulator';

export type SectionId = 'home' | 'product' | 'simulator';

interface NavbarProps {
  activeCountry: CountryTariffConfig;
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
}

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'product', label: 'Product' },
  { id: 'simulator', label: 'Live Simulator' },
];

export function Navbar({
  activeCountry,
  activeSection,
  onNavigate,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md border-b border-black/[0.06]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity with Geometric Leaf-Bolt SVG */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
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
            EcoShift
          </span>
        </button>

        {/* Center: Smooth-scroll Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1D1D1F] font-semibold'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Active Country Tariff Pill + CTA */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] border border-black/[0.06] text-xs font-medium text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer"
            title="Active Country Tariff in Simulator"
          >
            <Globe className="w-3.5 h-3.5 text-[#047857]" />
            <span>
              {activeCountry.shortName} [{activeCountry.code}]
            </span>
            <span className="text-[#6E6E73]">
              • {activeCountry.isTOU ? 'TOU' : 'Flat'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] hover:bg-[#047857] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Try Live Simulator
            <ArrowDownRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
