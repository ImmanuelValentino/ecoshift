import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/pitch/HeroSection';
import { ProblemSolutionSection } from './components/pitch/ProblemSolutionSection';
import { SustainabilityBmcSection } from './components/pitch/SustainabilityBmcSection';
import { SimulatorWorkbench } from './components/simulator/SimulatorWorkbench';
import { useSimulatorEngine } from './engine/useSimulatorEngine';

export function App() {
  const engine = useSimulatorEngine();

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1F]">
      <Navbar activeCountry={engine.country} />
      <main className="flex-1">
        <HeroSection />
        <ProblemSolutionSection />
        <SimulatorWorkbench engine={engine} />
        <SustainabilityBmcSection engine={engine} />
      </main>
      <Footer />
    </div>
  );
}

export default App;

