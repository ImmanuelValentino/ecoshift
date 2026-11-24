# UI/UX Design System and Visual Specifications (`design.md`)
## EcoShift Home: Pitch Landing Page and Interactive Simulator

## 1. Design Philosophy and Apple-Inspired Aesthetic

* **Core Visual Direction:** Inspired by Apple product showcase pages. Pure white canvas, generous whitespace, crisp typography, subtle hairline borders, and tactile hardware illustrations.
* **Presentation Optimization:** High contrast and clean visual hierarchy designed for large projector screens during international sustainability competition judging.
* **Primary Language:** English across all interface labels, headings, and simulator telemetry.
* **Strict Visual Constraints:**
  * **Zero Emojis:** Never render Unicode emojis anywhere in the UI, country selectors, alerts, or logs. Use clean monochrome or semantic vector icons from `lucide-react` and custom SVGs.
  * **Zero Clutter:** No unit pricing tables, no reward points, and no decorative visual noise. Every visual element communicates hardware state, energy flow, safety cutoff, or sustainability impact.

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
| `accentPeakAmber` | `#D97706` | Peak hour indicators and peak consumption bar segments |
| `accentDangerRed` | `#DC2626` | Voltage anomaly states (`Undervoltage`, `Overvoltage`, `Overload`) and mobile alert banner |
| `accentNeutralSlate` | `#86868B` | Relay `OFF` state and inactive schedule slots |

### 2.2 Dynamic Day and Night Hardware Stage Tokens
While the surrounding website remains clean pure white (`#FFFFFF`), the **Hardware Plug-In Stage** inside the simulator smoothly transitions (`transition: all 600ms cubic-bezier(0.22, 1, 0.36, 1)`) based on the simulated clock (`isDaytime = hour >= 6 && hour < 18`):

* **Daytime Stage (`06:00 to 17:59`):**
  * **Wall and Window Backdrop:** Bright sunlit studio interior (`#F8FAFC` wall with a window showing a soft daylight sky `#E0F2FE` to `#F0F9FF`).
  * **Time Badge:** Sun vector icon + `"DAYTIME"` pill (`#FEF3C7` background, `#92400E` text).
* **Nighttime Stage (`18:00 to 05:59`):**
  * **Wall and Window Backdrop:** Evening studio interior (`#111827` slate wall with a window showing a deep night sky `#090D16` and subtle star points).
  * **Active Plug Ambient Glow:** When the smart plug relay is `ON` at night, a soft radial glow (`rgba(16, 185, 129, 0.18)`) illuminates the wall around the smart plug and active appliance.
  * **Time Badge:** Moon vector icon + `"NIGHTTIME"` pill (`#1E1B4B` background, `#C7D2FE` text).

## 3. Typography and Numeric Precision

* **Display and Headings:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", sans-serif` with tight letter spacing (`-0.025em`) and bold weights (`600`, `700`) for clear readability from afar.
* **Body and Controls:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif` (`15px` to `17px` base size, `1.5` line height).
* **Telemetry and Virtual Clock:** `"SF Mono", "JetBrains Mono", monospace` with `font-variant-numeric: tabular-nums` enforced on all live numbers (Voltage, Current, Wattage, Clock, Countdown Timer, and Monthly Bill) so digits remain rock-steady during `300x` and `1800x` time acceleration.

## 4. Page Layout and Information Architecture

### 4.1 Vertical Page Flow
1. **Minimalist Sticky Header (`bg-white/80 backdrop-blur-md border-b border-black/5`):**
   * Left: `EcoShift Home` wordmark with clean geometric leaf-bolt SVG mark.
   * Center: Smooth-scroll links (`Overview`, `How It Works`, `Interactive Simulator`, `Sustainability BMC`).
   * Right: Active Country Regulation pill and solid pill CTA button (`Try Live Simulator`).
2. **Hero Section (Pure White `#FFFFFF` Canvas):**
   * Eyebrow label in `#047857`: `SUSTAINABLE HOME ENERGY AUTOMATION`
   * Large centered headline in `#1D1D1F`: `Shift Peak Loads. Protect Appliances. Decarbonize Every Home.`
   * Concise value statement in `#6E6E73` explaining how a single smart plug shifts household loads to off-peak hours and prevents electrical damage.
   * Three clean monochrome-bordered SDG alignment pills (`SDG 7 Clean Energy`, `SDG 12 Responsible Consumption`, `SDG 13 Climate Action`).
   * Primary pill button (`Launch Interactive Simulator`) that scrolls smoothly to the workbench.
3. **Problem and Three-Step Solution (Apple Bento Grid on `#FFFFFF` with `#F5F5F7` Cards):**
   * Clean 3-card horizontal bento layout illustrating:
     1. `01. Sense and Protect`: Real-time grid monitoring with instant sub-second cutoff during voltage surges or sags.
     2. `02. Shift to Off-Peak`: Automated scheduling aligned with cleaner, lower-demand grid hours.
     3. `03. Quantify Impact`: Transparent monthly cost breakdown and carbon emissions avoided per country regulation.
4. **Interactive Web Simulator Workbench (Full-Width Bento Container `#F5F5F7`):**
   * **Top Control Strip (`#FFFFFF` rounded bar):**
     * Virtual Clock (`Mon 22:45:10`) + Speed Selector (`Pause`, `1x`, `60x`, `300x`, `1800x`).
     * Quick Time Jump buttons (`07:30 Morning`, `13:00 Midday`, `19:30 Peak`, `23:05 Off-Peak`).
     * Anomaly Fault Triggers (`Undervoltage 176V`, `Overvoltage 265V`, `Overload 2480W`) + `Reset Demo` button.
   * **Three-Column Interactive Workspace:**
     * **Left Column (34%): Interactive Plug-In Hardware Stage** (Direct visual simulation of appliances plugged into the smart socket + Appliance Switcher).
     * **Center Column (32%): Companion Smartphone App** (Sleek mobile frame with push notifications, master relay toggle, countdown timer, off-peak auto-on switch, and daily schedule list).
     * **Right Column (34%): Country Tariff, Telemetry and Impact** (Country selector, live voltage sparkline, monthly bill bar, off-peak savings, carbon reduction, and anomaly log).
5. **Sustainability Business Model Canvas (BMC) Grid (`#FFFFFF` Section):**
   * Clean 6-card Apple-style bento grid summarizing `Value Proposition`, `Customer Segments`, `Key Activities`, `Key Partners`, `Channels`, and `Environmental and Social Impact Metrics` (strictly without unit pricing).

## 5. Interactive Plug-In Appliance Visual Stage (Left Column)

Rather than plain buttons alone, the left column renders a **live interactive SVG hardware stage** depicting a physical power connection between the wall outlet, the single-socket EcoShift Smart Plug, and the selected household appliance:

### 5.1 Visual Scene Composition
1. **Wall Outlet and EcoShift 1-Socket Smart Plug (Left Side of Stage):**
   * Crisp front-angle illustration of the white matte **EcoShift Smart Plug** mounted on the wall outlet.
   * **Status LED Ring** around the socket:
     * `ON`: Solid `#10B981` green ring.
     * `OFF`: Neutral `#86868B` gray ring.
     * `TRIPPED`: Pulsing `#DC2626` red ring with a clean `SAFETY CUTOFF` status pill above the plug.
2. **Animated Power Cable Connection (Center Bridge):**
   * A curved vector power cord physically connects from the EcoShift socket into the selected appliance on the right.
   * **Plug-In Transition:** Whenever the user selects a different appliance, the plug head animates smoothly (`300ms` slide-in) into the smart socket.
   * **Live Electricity Flow Animation:** When `relayState === 'ON'`, glowing emerald energy pulses (`stroke-dashoffset` SVG animation) travel continuously along the cable from the smart plug to the appliance. When `OFF` or `TRIPPED`, the pulses vanish immediately.
3. **Interactive Appliance Vector Illustrations (Right Side of Stage):**
   Each of the 4 selectable appliances renders a detailed vector illustration that visually reacts to power state:
   * **Water Heater (`1,500 W`):** Wall-mounted cylindrical tank unit. When `ON`, its digital temperature display lights up and thermal indicator waves glow warm amber/emerald; when `OFF`, the display goes dark.
   * **Air Conditioner (`900 W`):** Split-wall AC unit. When `ON`, the louver opens and subtle animated cool air stream lines flow downward; when `OFF`, the louver closes.
   * **Water Dispenser (`350 W`):** Standing floor water dispenser with top water bottle. When `ON`, the hot (`red`) and cold (`blue`) LED indicators illuminate; when `OFF`, indicators turn dark.
   * **Laptop Charger (`65 W`):** Sleek aluminum laptop connected via USB-C power adapter. When `ON`, the laptop screen illuminates with an active charging battery indicator; when `OFF`, the screen dims to standby.
4. **Appliance Selector Dock (Bottom of Card):**
   * Four clean tactile selector pills (`Water Heater 1,500W`, `AC 900W`, `Dispenser 350W`, `Charger 65W`) with vector icons so judges can plug in any device with one click.

## 6. Companion Smartphone Frame Specifications (Center Column)

* Styled as a clean, border-refined modern smartphone (`max-w-[340px] mx-auto rounded-[40px] bg-white border-[8px] border-[#1D1D1F] shadow-xl`):
  * **Top Mobile Push Notification Banner:** When a Voltage Anomaly or Overload occurs, a crisp iOS-style notification card slides down over the top of the phone screen (`z-30`) with a red vertical accent bar, vector alert icon, bold title (`Power Cut Off: Voltage Anomaly`), concise detail (`265V surge detected. Relay opened to protect Water Heater.`), and simulated timestamp.
  * **Device Header and Master Power Button:** Displays connected appliance name, relay status badge (`ACTIVE`, `STANDBY`, or `TRIPPED`), and a large tactile circular power button (changes to `Reset Safety Lock` when tripped).
  * **Countdown Timer Control:** Segmented pill selector (`Off`, `15m`, `30m`, `1h`, `2h`) with live `tabular-nums` remaining countdown that automatically cuts power at `00:00`.
  * **Off-Peak Auto-On Toggle:** Clean Apple-style toggle switch (`Auto-On at Off-Peak`) displaying the active country's off-peak start time underneath.
  * **Daily On/Off Schedule List:** Clean white cards showing scheduled time ranges (`23:15 to 00:15`), active days (`Mon to Sun`), individual toggle switches, and a `+ Add Schedule` button.

## 7. Country Tariff and Impact Panel Specifications (Right Column)

* **Country Selector Dropdown:** Clean text-and-code selector (`Indonesia [ID]`, `United Kingdom [UK]`, `Malaysia [MY]`, `Singapore [SG]`, `Germany [DE]`) without flag emojis.
* **Regulatory Classification Pill:** Clearly states `Flat Residential Tariff` for Indonesia or `Time-of-Use (TOU) Tariff` for other countries.
* **Live Electrical Telemetry:** Three clean white tiles (`Voltage V`, `Current A`, `Power W`) paired with a crisp SVG voltage waveform line that visibly spikes or dips during anomaly tests.
* **Monthly Bill and Off-Peak Savings:**
  * Displays estimated 30-day bill in local currency (`Rp`, `£`, `RM`, `S$`, `€`) with a clean horizontal bar comparing Peak cost vs. Off-Peak cost.
  * Displays **Off-Peak Savings** (calculated strictly from off-peak usage per country rule, showing `Rp 0` with regulatory explanation for Indonesia) alongside **Carbon Emissions Avoided (`kg CO2 / month`)**.
* **Safety Cutoff Log:** Clean compact table recording recent anomaly trips (`Time`, `Fault Type`, `Reading`, `Action Taken`).