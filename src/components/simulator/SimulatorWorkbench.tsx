import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { BillingAnalyticsPanel } from './BillingAnalyticsPanel';
import { DemoControlBar } from './DemoControlBar';
import { HardwarePlugTwin } from './HardwarePlugTwin';
import { SmartphoneAppFrame } from './SmartphoneAppFrame';

interface SimulatorWorkbenchProps {
  engine: SimulatorEngine;
}

export function SimulatorWorkbench({ engine }: SimulatorWorkbenchProps) {
  return (
    <section id="simulator" className="py-16 sm:py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#047857] mb-2">
            Interactive Web Simulator
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight">
            Test Real-Time Load Shifting &amp; Grid Protection Live
          </h2>
          <p className="mt-3 text-base text-[#6E6E73] leading-relaxed">
            Accelerate virtual time, switch between 4 household appliances on a
            single smart socket, inject grid voltage anomalies, and compare
            regulatory monthly bills across Indonesia, the UK, Malaysia,
            Singapore, and Germany.
          </p>
        </div>

        {/* Full-Width Apple Bento Workbench Container */}
        <div className="bg-[#F5F5F7] rounded-[32px] border border-black/[0.06] p-4 sm:p-6 space-y-5">
          {/* Top Scenario Control Strip */}
          <DemoControlBar engine={engine} />

          {/* 3-Column Interactive Workspace (34% / 32% / 34% on large screens) */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,34%)_minmax(0,32%)_minmax(0,34%)] gap-5 items-start">
            <HardwarePlugTwin engine={engine} />
            <SmartphoneAppFrame engine={engine} />
            <BillingAnalyticsPanel engine={engine} />
          </div>
        </div>
      </div>
    </section>
  );
}

