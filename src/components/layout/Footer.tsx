export function Footer() {
  return (
    <footer className="bg-[#F5F5F7] border-t border-black/[0.06] py-8">
      <div className="w-full max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-20 xl:px-24 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6E73]">
        <div className="flex items-center gap-2">
          <span className="font-bold italic text-[#0F172A]">Amartaloka</span>
          <span>•</span>
          <span>EcoShift Smart Plug Interactive Protection Simulator</span>
        </div>
        <div>
          SPLN 1:1995 Voltage &amp; SNI IEC 60884-1 Thermal Protection Simulation
        </div>
      </div>
    </footer>
  );
}
