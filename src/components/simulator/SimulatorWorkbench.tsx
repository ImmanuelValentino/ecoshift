import { CloudLightning, CloudRain, ShieldAlert } from 'lucide-react';
import { SimulatorEngine } from '../../engine/useSimulatorEngine';
import { BillingAnalyticsPanel } from './BillingAnalyticsPanel';
import { DemoControlBar } from './DemoControlBar';
import { HardwarePlugTwin } from './HardwarePlugTwin';
import { SmartphoneAppFrame } from './SmartphoneAppFrame';

interface SimulatorWorkbenchProps {
  engine: SimulatorEngine;
}

export function SimulatorWorkbench({ engine }: SimulatorWorkbenchProps) {
  const { weather } = engine;
  const isStorm = weather.condition === 'THUNDERSTORM';
  const isHeavyRain = weather.condition === 'HEAVY_RAIN';
  const showWeatherBanner = isStorm || isHeavyRain;

  return (
    <section id="simulator" className="py-16 sm:py-24 bg-white scroll-mt-20">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#047857] mb-2">
            Interactive Web Simulator
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight">
            Test Real-Time Load Shifting, Safety &amp; Thermal Protection Live
          </h2>
          <p className="mt-3 text-base text-[#6E6E73] leading-relaxed">
            Accelerate virtual time, switch between 4 household appliances on a
            single smart socket, test SPLN 1:1995 voltage and SNI IEC 60884-1
            thermal limits, simulate extreme weather alerts, and inspect
            EcoShift Guard WhatsApp notifications.
          </p>
        </div>

        {/* Full-Width Apple Bento Workbench Container */}
        <div className="bg-[#F5F5F7] rounded-[32px] border border-black/[0.06] p-4 sm:p-6 space-y-5">
          {/* Top Scenario Control Strip */}
          <DemoControlBar engine={engine} />

          {/* Extreme Weather Protection Banner */}
          {showWeatherBanner && (
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                isStorm
                  ? 'bg-amber-50 border-amber-300 text-[#92400E]'
                  : 'bg-blue-50 border-blue-200 text-[#1E40AF]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isStorm ? (
                  <CloudLightning className="w-5 h-5 shrink-0 text-[#D97706]" />
                ) : (
                  <CloudRain className="w-5 h-5 shrink-0 text-[#2563EB]" />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {isStorm
                      ? `Extreme Weather Alert: Thunderstorm in ${weather.city}`
                      : `Weather Advisory: Heavy Rain in ${weather.city}`}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {isStorm
                      ? 'High lightning and grid surge risk detected. EcoShift Plug is in Lightning Protection Standby and ready for <50ms cutoff.'
                      : 'Heavy rainfall may trigger grid voltage fluctuations. Surge monitoring is heightened.'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 border border-black/[0.08] text-[#1D1D1F]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                Lightning Protection Standby
              </span>
            </div>
          )}

          {/* 3-Column Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_390px_1.15fr] xl:grid-cols-[1.2fr_410px_1.2fr] gap-5 items-start">
            <HardwarePlugTwin engine={engine} />
            <SmartphoneAppFrame engine={engine} />
            <BillingAnalyticsPanel engine={engine} />
          </div>
        </div>
      </div>
    </section>
  );
}
