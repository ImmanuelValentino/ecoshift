export function Footer() {
  return (
    <footer className="bg-[#F5F5F7] border-t border-black/[0.06] py-10">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6E73]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1D1D1F]">EcoShift Home</span>
          <span>•</span>
          <span>
            Interactive Single-Socket Smart Plug Simulator for Sustainability BMC
            Evaluation
          </span>
        </div>
        <div>
          100% Client-Side Deterministic Web Simulation • Aligned with UN SDG 7, 12
          &amp; 13
        </div>
      </div>
    </footer>
  );
}

