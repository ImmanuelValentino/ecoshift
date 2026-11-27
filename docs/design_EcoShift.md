# UI/UX Design System and Visual Specifications (`design_EcoShift.md`)
## EcoShift Home: Pitch Landing Page and Interactive Simulator

## 1. Design Philosophy and Apple-Inspired Aesthetic

* **Core Visual Direction:** Inspired by Apple product showcase pages. Pure white canvas (`#FFFFFF`), soft gray bento surfaces (`#F5F5F7`), generous whitespace, crisp typography, subtle hairline borders, and tactile hardware illustrations.
* **Presentation Optimization:** High contrast and clean visual hierarchy designed for large projector screens during international sustainability competition judging.
* **Primary Language:** English across all interface labels, headings, WhatsApp mockup messages, and simulator telemetry.
* **Strict Visual Constraints:**
  * **Zero Emojis:** Never render Unicode emojis anywhere in the UI, country selectors, WhatsApp alerts, or documentation. Use clean monochrome or semantic vector icons from `lucide-react` and custom SVGs.
  * **Zero Separator Clutter:** Never use `---` or `~~` characters in UI text or documentation.
  * **Zero Commercial Clutter:** No unit pricing tables, no reward points, and no decorative visual noise. Every visual element communicates hardware state, thermal safety, weather readiness, energy flow, or sustainability impact.

## 2. Color Palette and Dynamic Day/Night Tokens

### 2.1 Core Brand and Semantic Tokens
| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `bgCanvasPrimary` | `#FFFFFF` | Main landing page background and clean section surfaces |
| `bgSurfaceBento` | `#F5F5F7` | Apple-style soft gray cards, simulator containers, and metric tiles |
| `bgSurfaceElevated` | `#FFFFFF` | Elevated inner cards with subtle border `1px solid rgba(0, 0, 0, 0.08)` |
| `textPrimary` | `#1D1D1F` | Primary headlines, active telemetry numbers, and body copy |
| `textSecondary` | `#6E6E73` | Subheadings, regulatory explanations, and secondary labels |
| `accentEcoGreen` | `#10B981` | Active `ON` relay LED, animated power flow pulse, off-peak savings, and carbon metrics |
| `accentEcoDeep` | `#047857` | High-contrast green text labels on white/light surfaces |
| `accentPeakAmber` | `#D97706` | Peak hour indicators, warm thermal status (`56°C to 69°C`), and weather advisory |
| `accentDangerRed` | `#DC2626` | Voltage anomaly (`<198V` / `>242V`), overload (`>2,400W`), and overheat (`>=70°C`) states |
| `accentNeutralSlate` | `#86868B` | Relay `OFF` state and inactive schedule slots |
| `accentWhatsAppGreen` | `#075E54` / `#25D366` | Subtle WhatsApp header/badge accents inside the virtual WhatsApp Mockup tab |

### 2.2 Dynamic Day and Night Hardware Stage Tokens
While the surrounding website remains clean pure white (`#FFFFFF`), the **Hardware Plug-In Stage** inside the simulator smoothly transitions (`transition: all 600ms cubic-bezier(0.22, 1, 0.36, 1)`) based on the simulated clock (`isDaytime = hour >= 6 && hour < 18`):

* **Daytime Stage (`06:00 to 17:59`):**
  * **Wall and Window Backdrop:** Bright sunlit studio interior (`#F8FAFC` wall with a window showing a soft daylight sky `#BAE6FD` to `#F0F9FF`).
  * **Time Badge:** Sun vector icon + `"DAYTIME"` pill (`#FEF3C7` background, `#92400E` text).
* **Nighttime Stage (`18:00 to 05:59`):**
  * **Wall and Window Backdrop:** Evening studio interior (`#111827` slate wall with a window showing a deep night sky `#090D16` and subtle star points).
  * **Active Plug Ambient Glow:** When the smart plug relay is `ON` at night, a soft radial glow (`rgba(16, 185, 129, 0.22)`) illuminates the wall around the smart plug and active appliance.
  * **Time Badge:** Moon vector icon + `"NIGHTTIME"` pill (`#1E1B4B` background, `#C7D2FE` text).

### 2.3 Subtle Thermal Glow on Smart Plug Body
When plug temperature enters `Warm (56°C to 69°C)` or `Overheat (>= 70°C)`, the smart plug body displays a **reduced, eye-friendly thermal glow** (low-opacity amber `rgba(245, 158, 11, 0.14)` for Warm, soft red `rgba(220, 38, 38, 0.18)` for Overheat) paired with a crisp numeric `°C` pill and thermal status badge.

## 3. Typography and Numeric Precision

* **Display and Headings:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", sans-serif` with tight letter spacing (`-0.025em`) and bold weights (`600`, `700`).
* **Body and Controls:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif` (`15px` to `17px` base size, `1.5` line height).
* **Telemetry and Virtual Clock:** `"SF Mono", "JetBrains Mono", monospace` with `font-variant-numeric: tabular-nums` enforced on all live numbers (Voltage, Current, Wattage, Temperature `°C`, Clock, Countdown Timer, and Monthly Bill).

## 4. Page Layout and Information Architecture

### 4.1 Vertical Page Flow
1. **Minimalist Sticky Header (`bg-white/80 backdrop-blur-md border-b border-black/5`):**
   * Left: `EcoShift Home` wordmark with clean geometric leaf-bolt SVG mark.
   * Center: Smooth-scroll links (`Overview`, `How It Works`, `Interactive Simulator`, `Sustainability BMC`).
   * Right: Active Country Regulation pill and solid pill CTA button (`Try Live Simulator`).
2. **Hero Section (Pure White `#FFFFFF` Canvas):**
   * Eyebrow label, large headline, value statement, three SDG alignment pills, and primary CTA button.
3. **Problem and Three-Step Solution (Apple Bento Grid on `#FFFFFF` with `#F5F5F7` Cards):**
   * Highlights Peak-Hour Grid Congestion, Unstable Residential Voltage & Thermal Overload (`<198V`, `>242V`, `>=70°C`), and Forgotten Appliance Runtime.
4. **Interactive Web Simulator Workbench (Full-Width Bento Container `#F5F5F7`):**
   * **Top Control Strip (`#FFFFFF` rounded bar):**
     * Virtual Clock + Speed Selector (`Pause`, `1x`, `60x`, `300x`, `1800x`) + Quick Time Jump buttons (`07:30`, `13:00`, `19:30`, `23:05`).
     * Fault and Thermal Test Triggers (`Undervoltage 176V`, `Overvoltage 265V`, `Overload 2,480W`, `Simulate Overheat (>70°C)`, `Restore Normal`).
     * Weather Protection Controls (`Live API`, `Clear (Normal)`, `Heavy Rain`, `Thunderstorm`) with active city weather pill.
   * **Extreme Weather Warning Banner:** Appears cleanly above the 3-column workspace whenever `Heavy Rain` or `Thunderstorm` is active, showing lightning/surge protection standby status.
   * **Three-Column Interactive Workspace (`w-full max-w-[1720px]` container, `grid-cols-1 lg:grid-cols-[1.15fr_390px_1.15fr] xl:grid-cols-[1.2fr_410px_1.2fr] gap-5`):**
     * **Left Column (`1.15fr` / `1.2fr`): Interactive Plug-In Hardware Stage** (Day/Night room, smart plug with reduced thermal glow & live `°C` pill, animated cable, 4 appliances, and Appliance Switcher).
     * **Center Column (`390px` / `410px`): Companion Smartphone App + WhatsApp Mockup** (Top WhatsApp/Alert push banner, segmented switcher between `Controls` and `WhatsApp`, master relay toggle, live temperature badge, countdown timer, off-peak auto-on switch, daily schedules, and `EcoShift Guard` WhatsApp chat feed).
     * **Right Column (`1.15fr` / `1.2fr`): Country Tariff, Telemetry and Impact** (Country selector, live voltage sparkline with `198V–231V` safe band and `232V–242V` warning band, Voltage/Current/Power/Temperature tiles, monthly bill bar, off-peak savings, carbon reduction, and anomaly log).
5. **Sustainability Business Model Canvas (BMC) Grid (`#FFFFFF` Section, `w-full max-w-[1600px]`):**
   * Clean 6-card Apple-style bento grid without unit pricing.
6. **Layout Alignment & Overflow Prevention:**
   * Navbar, Footer, and Simulator Workbench share `w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8` for crisp edge-to-edge alignment across `1280px`, `1440px`, and `1920px` viewports.
   * Pitch sections (`HeroSection`, `ProblemSolutionSection`, `SustainabilityBmcSection`) use `w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8`, and the root container enforces `overflow-x-hidden`.

## 5. Companion Smartphone Frame and WhatsApp Mockup (Center Column)

* Styled as a clean modern smartphone (`max-w-[340px] mx-auto rounded-[40px] bg-[#F5F5F7] border-[8px] border-[#1D1D1F] shadow-xl`):
  * **Top Mobile Push Notification Banner:** Slides down over the top of the phone screen (`z-30`) for safety trips, thermal overheat, and extreme weather WhatsApp alerts, with vector icon, sender label (`WhatsApp: EcoShift Guard` or `EcoShift Alert`), concise sensor reading, and timestamp.
  * **App Mode Switcher:** Clean Apple segmented control toggling between **Controls** (Smart Plug Control, Temperature Status, Timer, Off-Peak Auto-On, Schedules) and **WhatsApp** (Virtual WhatsApp chat view with **EcoShift Guard** official verified badge, unread counter, and structured alert bubbles showing Event Type, Voltage `V`, Temperature `°C`, Power `W`, Simulation Time, and Action Status).
