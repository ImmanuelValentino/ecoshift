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

### 4.1 Vertical Page Flow (3-Section Full-Page Scroll Snap)
1. **Fixed Minimalist Header (`fixed top-0 bg-white/85 backdrop-blur-md border-b border-black/5`):**
   * Left: `Amartaloka` (`EcoShift Smart Plug`) wordmark with clean geometric leaf-bolt SVG mark.
   * Center: Smooth-scroll links (`Home`, `Product`, `Live Simulator`) with active section highlight.
   * Right: Active Country Regulation pill and solid pill CTA button (`Try Live Simulator`).
   * Container uses generous Apple-style horizontal margins (`w-full max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-20 xl:px-24`).
   * Right-edge minimalist dot navigation (`Home`, `Product`, `Live Simulator`) on `xl` screens.
2. **Section 1: Home / Hero (100vh Split Screen on `#FFFFFF`):**
   * Left column: `One Plug, Triple Protection • Smart Home Plug` badge, `Amartaloka` headline, `One Plug, Triple Protection.` tagline, sub-tagline, and single `Try Live Simulator` button.
   * Right column: Interactive 360-degree **Three.js 3D Amartaloka Smart Plug** (`EcoShift3DSocket.tsx`) with vertical rounded squircle housing (`1 : 1.38`), `Amartaloka` canvas logo texture (house + plug + leaf), glowing green pill LED + `PointLight`, recessed Type-F cavity with brass rings, grounding clips, and vertical guide notches, rear 2 chrome prongs, soft studio shadow, and `Drag to rotate 360°` hint.
3. **Section 2: Product & Usage Overview (100vh on `#FFFFFF` with `#F5F5F7` Cards):**
   * Headline: `Built for Everyday Appliances. Engineered for Safety.`
   * Part A: Triple Protection cards (**EcoShift** `Smart Scheduling`, **TripTrace** `Event Diary`, **HeatDot** `Heat Warning`).
   * Part B: 3 horizontal usage steps (`01. Plug In`, `02. Schedule & Protect`, `03. Monitor & Alert`).
4. **Section 3: Interactive Web Simulator Workbench (Full-Width Bento Container `#F5F5F7` + Footer):**
   * **Top Control Strip (`#FFFFFF` rounded bar):**
     * Virtual Clock + Speed Selector (`Pause`, `1x`, `60x`, `300x`, `1800x`) + Quick Time Jump buttons (`07:30`, `13:00`, `19:30`, `23:05`).
     * Fault and Thermal Test Triggers (`Undervoltage 176V`, `Overvoltage 265V`, `Overload 2,480W`, `Simulate Overheat (>70°C)`, `Restore Normal`).
     * Weather Protection Controls (`Live API`, `Clear (Normal)`, `Heavy Rain`, `Thunderstorm`) with active city weather pill, plus `Alarm Audio: ON / Muted` toggle and `Stop & Reset Alarm` button.
   * **Emergency Alarm & Red Shake Alert:** When `isAlarmActive === true`, `.alarm-active-card` applies a horizontal shake animation (`alarm-shake`), thick red border, and pulsing red glow (`rgba(239, 68, 68, 0.4)`) simultaneously to the top Emergency Alarm banner, `HardwarePlugTwin` (with flashing red socket LEDs), and `SmartphoneAppFrame` (with red emergency top bar).
   * **Extreme Weather Warning Banner:** Appears cleanly above the 3-column workspace whenever `Heavy Rain` or `Thunderstorm` is active, showing lightning/surge protection standby status.
   * **Three-Column Interactive Workspace (`w-full max-w-[1720px]` container, `grid-cols-1 lg:grid-cols-[1.15fr_390px_1.15fr] xl:grid-cols-[1.2fr_410px_1.2fr] gap-5`):**
     * **Left Column (`1.15fr` / `1.2fr`): Compact 4-Socket Hardware Stage (No-Scroll on Laptop)** (Day/Night room, 4-socket smart power strip with reduced thermal glow & live `°C` pill, animated cables, 4 fixed appliances `S1–S4`, and tap-to-toggle relay).
     * **Center Column (`390px` / `410px`): Companion Smartphone App with 4-Tab Bottom Navigation Bar** (Top WhatsApp/Alert push banner, wheel-isolated scrollable screen body, permanent Bottom Navigation Bar with `Dashboard`, `Socket` + active badge, `Schedule`, and `WhatsApp` + unread badge).
     * **Right Column (`1.15fr` / `1.2fr`): Country Tariff, Aggregate Telemetry and Impact** (Country selector, live voltage sparkline with `198V–231V` safe band and `232V–242V` warning band, Voltage/Total Amp/Total Load/Plug Temp tiles, 4-socket daily kWh breakdown, synchronized Weekly/Monthly bill bar, off-peak savings, carbon reduction, and anomaly log).
5. **Layout Alignment & Scroll-Snap Behavior:**
   * Navbar, Footer, Home, and Product sections share `w-full max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-20 xl:px-24` for crisp Apple-grade horizontal breathing room across desktop viewports.
   * Simulator Workbench uses `w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8` inside an `h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth` scroll container.
   * Internal `wheel` listener on the smartphone screen prevents scroll chaining so scrolling inside the phone never triggers page section snap.

## 5. Companion Smartphone Frame and WhatsApp Mockup (Center Column)

* Styled as a fixed-height modern smartphone (`h-[690px] w-full max-w-[390px] mx-auto rounded-[40px] bg-[#F5F5F7] border-[8px] border-[#1D1D1F] shadow-xl overflow-hidden flex flex-col`) so the bezel height stays identical across all 4 tabs:
  * **Fixed Top Header (`shrink-0`):** Status bar and Dynamic Island pinned at the top.
  * **Scrollable Content Body (`flex-1 min-h-0 overflow-y-auto overscroll-contain`):** Smooth internal scrolling with a thin custom scrollbar for `Dashboard` (including the **Daily Usage by Socket (kWh)** stacked bar chart with `Weekly`/`Monthly` switch, 1-year `<`/`>` period navigation using local date + `Current` badge, `kWh` Y-axis label with `#E5E7EB` gridlines, `S1 Heater` `#10B981`, `S2 AC` `#3B82F6`, `S3 Dispenser` `#F59E0B`, `S4 Charger` `#6366F1` legend, edge-clamped **Floating Tooltip** without per-kWh rate, and synchronized **Weekly/Monthly Bill** and **Off-Peak Savings / Tarif Flat (PLN)** cards), `Socket` (all 4 socket cards), `Schedule`, and `WhatsApp` chat history.
  * **Fixed Bottom Navigation Bar (`shrink-0 mt-auto`):** Permanent 4-tab bar (`Dashboard`, `Socket` with active count badge, `Schedule`, `WhatsApp` with unread badge) locked at the bottom of the screen.
  * **Top Mobile Push Notification Banner:** Slides down over the top of the phone screen (`z-30`) for safety trips, thermal overheat, and extreme weather WhatsApp alerts, with vector icon, sender label (`WhatsApp: EcoShift Guard` or `EcoShift Alert`), concise sensor reading, and timestamp.
  * **App Mode Switcher:** Clean Apple segmented control toggling between **Controls** (Smart Plug Control, Temperature Status, Timer, Off-Peak Auto-On, Schedules) and **WhatsApp** (Virtual WhatsApp chat view with **EcoShift Guard** official verified badge, unread counter, and structured alert bubbles showing Event Type, Voltage `V`, Temperature `°C`, Power `W`, Simulation Time, and Action Status).
