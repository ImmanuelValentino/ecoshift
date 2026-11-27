# Product Requirements Document (PRD)
## EcoShift Home: Interactive Smart Plug Pitch and Simulator

| Metadata | Detail |
| :--- | :--- |
| **Product Name** | EcoShift Home (4-Socket Independent Smart Power Strip Simulator) |
| **Document Version** | 3.0 |
| **Target Audience** | International Sustainability Business Model Canvas (BMC) Competition Judges |
| **Website Format** | Pitch Landing Page + Embedded Interactive Web Simulator |
| **System Architecture** | Client-Side Interactive Web Simulator with Optional Google Weather API Integration |
| **Primary Language** | English (International Competition Standard) |

## 1. Executive Summary and Product Vision

**EcoShift Home** is a plug-and-play single-socket smart plug solution designed to help urban households shift high-power appliance usage to off-peak hours, automate daily power schedules, protect electronics from electrical grid anomalies and thermal overheating, monitor extreme weather surge risks, and reduce household carbon footprints.

This web application serves as a **live interactive pitch platform** for an **International Sustainability Business Model Canvas (BMC)** competition. Rather than relying on static slides, the website combines a compelling sustainability pitch narrative with a real-time, self-contained **Interactive Web Simulator**—allowing judges to manipulate virtual time, observe day/night environmental transitions, schedule appliances, inject electrical grid or thermal anomalies, test extreme weather alerts, and inspect country-specific monthly electricity bills and off-peak savings.

## 2. Product Scope and Strict Guardrails

### 2.1 In-Scope (Must Build)
* **Pitch Landing Page:** Narrative sections tailored for international sustainability judges (Hero, Problem/Grid Challenge, 3-Step Solution, Live Interactive Simulator, and Sustainability BMC Overview).
* **4-Socket Independent Hardware Twin (`Socket 1` to `Socket 4`):** Visual and logical simulation of **4 independent smart sockets**, each permanently paired with 1 household appliance:
  1. **Socket 1:** `Water Heater` (`1,500 W`)
  2. **Socket 2:** `Air Conditioner (AC)` (`900 W`)
  3. **Socket 3:** `Water Dispenser` (`350 W`)
  4. **Socket 4:** `Laptop Charger` (`65 W`)
* **Smartphone Mockup with 4-Tab Bottom Navigation Bar:** `Dashboard` (Active Sockets summary, **Daily Usage by Socket (kWh)** interactive 6-day stacked bar chart with live `Today` bar and automatic `00:00` day rollover, Today's kWh + per-socket breakdown, 30-Day Monthly Bill, Adaptive Off-Peak card, Live Telemetry), `Socket` (4 independent socket cards with ON/OFF toggle, active session duration, session kWh, and optional per-socket auto-cutoff timer), `Schedule` (daily schedules bound to `Socket 1`–`4` + Off-Peak Auto-On), and `WhatsApp` (`EcoShift Guard` alerts).
* **Core Smart Plug Features:**
  1. **Auto-On and Auto-Cutoff:** Rule-based relay control (Auto-On via Daily Schedule or Off-Peak Hour entry; Auto-Cutoff via Countdown Timer, Overload, Voltage Anomaly, or Thermal Overheat).
  2. **Daily On/Off Scheduling:** Multi-slot schedule configuration across days of the week (`Monday to Sunday`).
  3. **Electrical Safety (SPLN 1:1995 / Permen ESDM) and Thermal Monitoring (SNI IEC 60884-1):** Real-time voltage, load, and terminal temperature monitoring with instant relay cutoff, anomaly logging, and WhatsApp alert delivery.
  4. **Extreme Weather Protection Integration:** Google Maps Platform Weather API (`currentConditions:lookup`) with local simulation fallback to warn users of `Heavy Rain` or `Thunderstorm` lightning/surge hazards.
  5. **WhatsApp Virtual Mockup (EcoShift Guard):** In-phone WhatsApp alert banner and dedicated **WhatsApp** chat tab inside the Smartphone Frame.
  6. **Country-Based Monthly Bill and Off-Peak Savings Estimator:** Regulatory-accurate billing simulation comparing **Flat Tariff** countries (Indonesia) vs. **Time-of-Use (TOU)** countries (United Kingdom, Malaysia, Singapore, Germany).
* **Demo Presentation Controls:** Custom time-speed multiplier, Day/Night visual environment synced with simulated time, Weather condition controls (`Live API`, `Clear`, `Heavy Rain`, `Thunderstorm`), and instant Fault/Overheat triggers.

### 2.2 Out-of-Scope (Strictly Excluded)
* **No Hardware Connection:** Zero WebSocket, MQTT, Bluetooth, or Serial connections to real ESP32 devices.
* **No Water-Saving Hardware:** Exclude *Eco-Shower Head* and *Smart Water Meter* from this product scope.
* **No Pricing / BOM / ROI Tables:** Omit hardware unit pricing, cost of goods sold, and financial payback pricing.
* **No "Auto-Save Mode" Toggle:** Do not include a generic "Auto Eco/Save Mode" switch.
* **No AI Autonomous Load Shifting:** Scheduling must be explicit and deterministic (user-configured daily schedules and off-peak auto-on triggers).
* **No Gamification / Eco-Reward Points:** Completely exclude Eco-Points, point balances, badges, or voucher redemption tabs.

## 3. Pitch Landing Page Structure

The landing page flows seamlessly from executive storytelling into hands-on demonstration:

1. **Top Navigation Bar:**
   * Brand identity (`EcoShift Home`), anchor links (`Overview`, `How It Works`, `Live Simulator`, `Sustainability BMC`), active Country Tariff indicator, and a primary CTA button (`Launch Live Demo`).
2. **Hero Section (Pitch Opening):**
   * Headline: *"Shift Peak Loads. Protect Appliances. Decarbonize Every Home."*
   * Subheadline explaining how a single smart plug bridges household energy automation with national grid decarbonization.
   * Alignment badges for **UN Sustainable Development Goals (SDGs)**: `SDG 7 (Affordable & Clean Energy)`, `SDG 12 (Responsible Consumption)`, and `SDG 13 (Climate Action)`.
3. **Problem and Sustainability Opportunity:**
   * Visual breakdown of peak-hour grid congestion (fossil-fuel peaker plant reliance), unstable residential voltage and thermal overload damaging appliances, and forgotten appliance runtime.
4. **Interactive Web Simulator (Core Centerpiece):**
   * Full-width interactive command center containing:
     * **Demo Scenario Control Bar** (Time Speed, Time Jump, Grid Fault and Overheat Triggers, Weather Mode Controls, Reset).
     * **Extreme Weather Alert Banner** (rendered when `Heavy Rain` or `Thunderstorm` is active).
     * **Left Panel:** Dynamic Day/Night Room Scene + 1-Socket Smart Plug Hardware Twin with live thermal readout (`°C`) + Appliance Selector.
     * **Center Panel:** Interactive Smartphone Companion App Frame with **Controls** tab, **WhatsApp (EcoShift Guard)** tab, and top WhatsApp/Alert notification banner overlay.
     * **Right Panel:** Country Tariff Selector, Real-Time Electrical and Thermal Telemetry, Monthly Bill Forecast (Peak vs. Off-Peak), Off-Peak Savings, Carbon Reduction, and Anomaly Log.
5. **Sustainability Business Model Canvas (BMC) Highlights:**
   * Clean, judge-ready summary cards presenting the **Value Proposition**, **Customer Segments**, **Key Activities & Resources**, **Key Partners**, **Channels**, and **Environmental and Social Impact Metrics** (without unit pricing clutter).

## 4. Detailed Functional Requirements

### FR-1: Simulation Time Engine and Dynamic Day/Night Environment
* **Virtual Clock:** Displays simulated `Day of Week` (`Mon to Sun`) and `24-Hour Time` (`HH:MM:SS`).
* **Custom Time Speed Controls:** Judges can select simulation speed multipliers: `Pause (0x)`, `Real-Time (1x)`, `Fast (60x)`, `Turbo (300x)`, and `Ultra (1800x)`.
* **Quick Time Jump Presets:** One-click buttons to jump simulated time to `07:30 Morning`, `13:00 Midday`, `19:30 Peak`, and `23:05 Off-Peak`.
* **Day/Night Environment Sync:** Daytime (`06:00 to 17:59`) renders bright daylight ambiance; Nighttime (`18:00 to 05:59`) transitions smoothly to dark indigo sky with stars and warm interior glow when active.

### FR-2: Single-Socket Smart Plug and Appliance Simulator
* **1-Socket Hardware State:** Relay Status `ON (CLOSED)`, `OFF (OPEN)`, or `TRIPPED (SAFETY LOCKOUT)`.
* **Appliance Selector (1 Connected Device at a Time):** `Water Heater (1,500 W)`, `AC (900 W)`, `Dispenser (350 W)`, `Charger (65 W)`.
* **Live Electrical and Thermal Telemetry:** Displays real-time **Voltage (`V`)**, **Current (`A`)**, **Active Power (`W`)**, **Plug Temperature (`°C`)**, and **Session Energy (`kWh`)**.

### FR-3: Auto-On and Auto-Cutoff Automation Logic
The smart plug relay is governed by deterministic automation rules in strict priority order:
1. **Safety Auto-Cutoff (Highest Priority):**
   * Triggered immediately if **Undervoltage (`< 198 V`)**, **Overvoltage (`> 242 V`)**, **Overload (`> 2,400 W`)**, or **Overheat (`>= 70°C`)** occurs.
   * Action: Relay opens (`TRIPPED`) instantaneously, stopping power flow.
2. **Timer Auto-Cutoff:** When countdown reaches `00:00`, the plug automatically cuts off power (`OFF`).
3. **Off-Peak Auto-On:** When the simulated clock enters the selected country's Off-Peak window (and relay is not in safety lockout), the plug turns `ON` if enabled.
4. **Daily Schedule Auto-On / Auto-Off:** Matches enabled schedule `Start Time` and `End Time`.

### FR-4: Daily On/Off Scheduling
* Users can create, edit, toggle, and delete multiple daily schedule slots inside the simulated smartphone app (`Mon to Sun`, `Start Time`, `End Time`, `Active Toggle`).
* Pre-loaded realistic demo schedules (*Water Heater Off-Peak Heating `23:15 to 00:15`*, *AC Night Comfort `22:00 to 05:00`*).

### FR-5: Electrical Safety (SPLN 1:1995), Heat Monitoring (SNI IEC 60884-1), and WhatsApp Alerts
* **PLN Voltage Standard (SPLN 1:1995 / Permen ESDM):**
  * Nominal voltage: `220 V` (`50 Hz`) for Indonesia (`230 V` for UK/MY/SG/DE).
  * Safe operating band: `198 V to 231 V` (maximum upper tolerance `242 V`, or ±10% of `220 V`).
  * **High-Voltage Warning Band (`232 V to 242 V`):** Displayed as a high-voltage warning status without tripping.
  * **Undervoltage (`< 198 V`):** Immediate Relay OFF (`TRIPPED`), anomaly log entry, and WhatsApp notification.
  * **Overvoltage (`> 242 V`):** Immediate Relay OFF (`TRIPPED`), anomaly log entry, and WhatsApp notification.
* **Socket Capacity and Thermal Standard (SNI IEC 60884-1):**
  * Socket rated capacity: `2,400 W to 2,500 W` (`10A / 250V`) **per individual socket**. Running all 4 standard appliances simultaneously (`2,815 W` total across 4 independent sockets) operates normally without triggering overload; overload trips only when a single socket exceeds `> 2,400 W`, cutting off only the affected socket.
  * Maximum terminal temperature rise: `45 K` above ambient (`~25°C to 28°C`), keeping safe surface/insulation temperature strictly below `70°C` (critical threshold `70°C to 85°C`).
  * **Thermal Status Bands:**
    * `Normal`: `28°C to 55°C`
    * `Warm` (Advisory): `56°C to 69°C` (running all 4 standard appliances simultaneously stabilizes safely within `35°C to 58°C`)
    * `Overheat` (Danger `>= 70°C`): Immediate Relay OFF (`TRIPPED`), anomaly log entry, and WhatsApp notification.
  * **Realistic Thermal Simulation:** Plug temperature rises gradually when high-power loads (`Water Heater`, `AC`) run continuously, cools down toward ambient (`28°C`) when the relay is `OFF` or under light load, and includes an instant **`Simulate Overheat (>70°C)`** preset trigger.
* **WhatsApp Virtual Mockup (`EcoShift Guard`):**
  * Top pop-up WhatsApp notification banner on the smartphone screen plus a dedicated **WhatsApp** tab showing messages from **EcoShift Guard** containing event type, sensor readings (`V`, `°C`, `W`), simulation timestamp, and device action status (`Power Automatically Cut Off` or `Lightning Protection Standby`).

### FR-6: Extreme Weather Integration (Google Weather API + Simulation Presets)
* **API Integration:** Fetches real-time weather conditions from Google Maps Platform Weather API (`https://weather.googleapis.com/v1/currentConditions:lookup`) using `VITE_GOOGLE_WEATHER_API_KEY` and the selected country's city coordinates (e.g., Jakarta for Indonesia, London for UK, Kuala Lumpur for Malaysia, Singapore for Singapore, Berlin for Germany).
* **Security and Fallback:** Never hardcodes API keys. Uses `import.meta.env.VITE_GOOGLE_WEATHER_API_KEY`, validates API responses, and falls back gracefully to local simulated weather if offline or unconfigured.
* **Demo Weather Controls:** `Live API`, `Clear (Normal)`, `Heavy Rain`, and `Thunderstorm`.
* **Weather Alert Logic:** When `THUNDERSTORM` or `HEAVY_RAIN` is detected, displays a live lightning/surge hazard banner in the simulator and smartphone screen, and dispatches a **Lightning Protection Standby** WhatsApp notification via **EcoShift Guard** (relay remains on standby unless a voltage surge occurs).

### FR-7: Country-Based Monthly Bill and Off-Peak Savings Estimator
* Supports **Indonesia (PLN Flat Tariff)**, **United Kingdom (Economy 7 TOU)**, **Malaysia (TNB Domestic TOU)**, **Singapore (OEM TOU Plan)**, and **Germany (EU Dynamic TOU)**.
* Indonesia (`isTOU: false`) strictly calculates `Off-Peak Tariff Savings = Rp 0` while reporting Peak Load Reduction (`kW`) and `CO2` Emissions Avoided (`kg`).

## 5. Acceptance Criteria Checklist

* **Single-Socket and 4 Appliances:** Only 1 smart plug socket is modeled, supporting `Water Heater`, `AC`, `Dispenser`, and `Charger`.
* **No Excluded Features:** Zero references to Eco-Reward Points, unit pricing, multi-socket strips, water meters, AI load shifting, or "Auto-Save Mode".
* **SPLN 1:1995 and SNI IEC 60884-1 Compliance:** Undervoltage (`< 198 V`), Overvoltage (`> 242 V`), Overload (`> 2,400 W`), and Overheat (`>= 70°C`) immediately trip the relay `OFF`, log the anomaly, and send a WhatsApp alert.
* **Weather Integration and Fallback:** Live Google Weather API lookup works with valid `VITE_GOOGLE_WEATHER_API_KEY` and falls back cleanly when absent/offline; manual weather presets (`Clear`, `Heavy Rain`, `Thunderstorm`) trigger banners and WhatsApp standby alerts.
* **Strict Visual Rules:** Zero emojis and zero `---` or `~~` separators in UI or documentation.
