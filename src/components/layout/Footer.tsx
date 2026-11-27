export function Footer() {
  return (
    <footer className="bg-[#F5F5F7] border-t border-black/[0.06] py-8">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6E73]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1D1D1F]">EcoShift</span>
          <span>•</span>
          <span>
            Interactive 4-Socket Smart Plug Simulator &amp; Protection System
          </span>
        </div>
        <div>
          SPLN 1:1995 Voltage &amp; SNI IEC 60884-1 Thermal Protection Simulation
        </div>
      </div>
    </footer>
  );
}
