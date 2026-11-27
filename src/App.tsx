import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Navbar, SectionId } from './components/layout/Navbar';
import { HeroSection } from './components/pitch/HeroSection';
import { ProblemSolutionSection } from './components/pitch/ProblemSolutionSection';
import { SimulatorWorkbench } from './components/simulator/SimulatorWorkbench';
import { useSimulatorEngine } from './engine/useSimulatorEngine';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'product', label: 'Product' },
  { id: 'simulator', label: 'Live Simulator' },
];

export function App() {
  const engine = useSimulatorEngine();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('home');

  const navigateToSection = useCallback((sectionId: SectionId) => {
    const container = scrollContainerRef.current;
    const target = document.getElementById(sectionId);
    if (container && target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportH = container.clientHeight;
      let current: SectionId = 'home';

      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (!el) continue;
        const top = el.offsetTop - viewportH * 0.35;
        if (scrollTop >= top) {
          current = sec.id;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative h-screen w-full bg-white text-[#1D1D1F] overflow-hidden">
      <Navbar
        activeCountry={engine.country}
        activeSection={activeSection}
        onNavigate={navigateToSection}
      />

      {/* Minimalist Right-Side Dot Navigation */}
      <div
        className="hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-3"
        aria-label="Section quick navigation"
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => navigateToSection(sec.id)}
              title={sec.label}
              aria-label={`Jump to ${sec.label}`}
              className="group flex items-center gap-2 p-1 cursor-pointer focus:outline-none"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-2.5 h-2.5 bg-[#047857] scale-110'
                    : 'w-2 h-2 bg-[#D1D1D6] group-hover:bg-[#86868B]'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Full-Page Scroll Snap Container */}
      <div
        ref={scrollContainerRef}
        className="h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
      >
        <HeroSection onLaunchSimulator={() => navigateToSection('simulator')} />
        <ProblemSolutionSection />
        <div className="snap-start">
          <SimulatorWorkbench engine={engine} />
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default App;
