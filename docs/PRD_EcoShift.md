# Product Requirements Document (PRD)
## EcoShift Home — Interactive Smart Plug Pitch & Simulator

| Metadata | Detail |
| :--- | :--- |
| **Product Name** | EcoShift Home (Single-Socket Smart Plug Simulator) |
| **Document Version** | 1.0 |
| **Target Audience** | International Sustainability Business Model Canvas (BMC) Competition Judges |
| **Website Format** | Pitch Landing Page + Embedded Interactive Web Simulator |
| **System Architecture** | 100% Client-Side Interactive Web Simulator (No physical hardware/ESP32 connection) |
| **Primary Language** | English (International Competition Standard) |

---

## 1. Executive Summary & Product Vision

**EcoShift Home** is a plug-and-play single-socket smart plug solution designed to help urban households shift high-power appliance usage to off-peak hours, automate daily power schedules, protect electronics from electrical grid anomalies, and reduce household carbon footprints.

This web application serves as a **live interactive pitch platform** for an **International Sustainability Business Model Canvas (BMC)** competition. Rather than relying on static slides, the website combines a compelling sustainability pitch narrative with a real-time, self-contained **Interactive Web Simulator**—allowing judges to manipulate virtual time, observe day/night environmental transitions, schedule appliances, inject electrical grid anomalies, and inspect country-specific monthly electricity bills and off-peak savings.

---

## 2. Product Scope & Strict Guardrails

### 2.1 In-Scope (Must Build)
- **Pitch Landing Page:** Narrative sections tailored for international sustainability judges (Hero, Problem/Grid Challenge, 3-Step Solution, Live Interactive Simulator, and Sustainability BMC Overview).
- **Single-Socket Hardware Twin (1 Outlet):** Visual and logical simulation of **1 smart plug socket** connected to one selectable household appliance at a time.
- **4 Preset Household Appliances:**
  1. **Water Heater** (`1,500 W`)
  2. **AC (Air Conditioner)** (`900 W`)
  3. **Dispenser (Water Dispenser)** (`350 W`)
  4. **Charger (Laptop/Phone Fast Charger)** (`65 W`)
- **4 Core Smart Plug Features:**
  1. **Auto-On & Auto-Cutoff:** Rule-based relay control (Auto-On via Daily Schedule or Off-Peak Hour entry; Auto-Cutoff via Countdown Timer, Overload, or Voltage Anomaly).
  2. **Daily On/Off Scheduling:** Multi-slot schedule configuration across days of the week (`Monday–Sunday`).
  3. **Anomaly Voltage & Overload Detection:** Real-time monitoring with instant power relay cutoff and instant simulated smartphone push notification.
  4. **Country-Based Monthly Bill & Off-Peak Savings Estimator:** Regulatory-accurate billing simulation comparing **Flat Tariff** countries (Indonesia) vs. **Time-of-Use (TOU)** countries (United Kingdom, Malaysia, Singapore, Germany).
- **Demo Presentation Controls:** Custom time-speed multiplier, Day/Night visual environment synced with simulated time, and instant Voltage Anomaly injection triggers.

### 2.2 Out-of-Scope (Strictly Excluded)
- **No Hardware Connection:** Zero WebSocket, MQTT, Bluetooth, or Serial connections to real ESP32 devices.
- **No Multi-Socket Strip:** Do not build a 4-outlet power strip; strictly **1 socket**.
- **No Water-Saving Hardware:** Exclude *Eco-Shower Head* and *Smart Water Meter* from this product scope.
- **No Pricing / BOM / ROI Tables:** Omit hardware unit pricing, cost of goods sold, and financial payback pricing.
- **No "Auto-Save Mode" Toggle:** Do not include a generic "Auto Eco/Save Mode" switch.
- **No AI Autonomous Load Shifting:** Scheduling must be explicit and deterministic (user-configured daily schedules and off-peak auto-on triggers).
- **No Gamification / Eco-Reward Points:** Completely exclude Eco-Points, point balances, badges, or voucher redemption tabs.

---

## 3. Pitch Landing Page Structure

The landing page must flow seamlessly from executive storytelling into hands-on demonstration:

1. **Top Navigation Bar:**
   - Brand identity (`EcoShift Home`), anchor links (`The Challenge`, `How It Works`, `Live Simulator`, `Sustainability BMC`), active Country Tariff indicator, and a primary CTA button (`Launch Live Demo`).
2. **Hero Section (Pitch Opening):**
   - Headline: *"Shift Peak Loads. Protect Appliances. Decarbonize Every Home."*
   - Subheadline explaining how a single smart plug bridges household energy automation with national grid decarbonization.
   - Alignment badges for **UN Sustainable Development Goals (SDGs)**: `SDG 7 (Affordable & Clean Energy)`, `SDG 12 (Responsible Consumption)`, and `SDG 13 (Climate Action)`.
3. **Problem & Sustainability Opportunity:**
   - Visual breakdown of peak-hour grid congestion (fossil-fuel peaker plant reliance), unstable residential voltage damaging appliances, and phantom/forgotten appliance runtime.
4. **Interactive Web Simulator (Core Centerpiece):**
   - Full-width interactive command center containing:
     - **Demo Scenario Control Bar** (Time Speed, Time Jump, Anomaly Triggers, Reset).
     - **Left Panel:** Dynamic Day/Night Room Scene + 1-Socket Smart Plug Hardware Twin + Appliance Selector.
     - **Center Panel:** Interactive Smartphone Companion App Frame (Controls, Timer, Daily Scheduler, and Live Push Notification Overlay).
     - **Right Panel:** Country Tariff Selector, Real-Time Electrical Telemetry, Monthly Bill Forecast (Peak vs. Off-Peak), Off-Peak Savings, Carbon Reduction, and Anomaly Log.
5. **Sustainability Business Model Canvas (BMC) Highlights:**
   - Clean, judge-ready summary cards presenting the **Value Proposition**, **Customer Segments**, **Key Activities & Resources**, **Impact Metrics** ($\text{kWh}$ shifted, Peak $\text{kW}$ shaved, $\text{kg CO}_2$ avoided), and **Environmental Sustainability Advantage** (without unit pricing clutter).

---

## 4. Detailed Functional Requirements

### FR-1: Simulation Time Engine & Dynamic Day/Night Environment
- **Virtual Clock:** Displays simulated `Day of Week` (`Mon–Sun`) and `24-Hour Time` (`HH:MM:SS`).
- **Custom Time Speed Controls:** Judges can select simulation speed multipliers:
  - `Pause (0x)`
  - `Real-Time (1x)`
  - `Fast (60x — 1 min/sec)`
  - `Turbo (300x — 5 mins/sec)`
  - `Ultra (1800x — 30 mins/sec)`
- **Quick Time Jump Presets:** One-click buttons to jump simulated time to key moments:
  - `07:30` (Morning Peak Start)
  - `13:00` (Midday)
  - `19:30` (Evening Peak Hour)
  - `23:05` (Night Off-Peak Entry)
- **Day/Night Environment Sync:**
  - **Daytime (`06:00 – 17:59`):** Simulator environment renders bright daylight ambiance, sunlit room backdrop, and a `DAYTIME` indicator.
  - **Nighttime (`18:00 – 05:59`):** Simulator environment smoothly transitions to night ambiance, dark indigo sky with stars, warm interior room glow when the plug is active, and a `NIGHTTIME` indicator.

### FR-2: Single-Socket Smart Plug & Appliance Simulator
- **1-Socket Hardware State:**
  - Relay Status: `ON (CLOSED)`, `OFF (OPEN)`, or `TRIPPED (SAFETY LOCKOUT)`.
  - Visual LED Ring on the smart plug changes color dynamically (Emerald Green = `ON`, Neutral Slate = `OFF`, Flashing Crimson = `TRIPPED`).
- **Appliance Selector (1 Connected Device at a Time):**
  - Users can plug in one of the 4 preset appliances:
    - **Water Heater:** `1,500 W` (High thermal load — ideal for off-peak shifting)
    - **AC (Air Conditioner):** `900 W` (Sustained cooling load)
    - **Dispenser:** `350 W` (Heating element load)
    - **Charger:** `65 W` (Electronics charging load — ideal for countdown timer auto-cutoff)
- **Live Electrical Telemetry:**
  - Displays real-time **Voltage ($V$)**, **Current ($A$)**, **Active Power ($W$)**, and **Session Energy ($\text{kWh}$)**.

### FR-3: Auto-On & Auto-Cutoff Automation Logic
The smart plug relay is governed by deterministic automation rules in strict priority order:
1. **Safety Auto-Cutoff (Highest Priority):**
   - Triggered immediately if **Voltage Anomaly** (`< 195 V` or `> 245 V`) OR **Overload** (`Active Power > 2,200 W` / `Current > 10 A`) occurs.
   - Action: Relay opens (`OFF / TRIPPED`) instantaneously, stopping power flow.
2. **Timer Auto-Cutoff:**
   - User can set a **Countdown Timer** (e.g., `15m`, `30m`, `1h`, `2h`, or custom minutes) in the smartphone app.
   - Action: When countdown reaches `00:00`, the plug automatically cuts off power (`OFF`).
3. **Off-Peak Auto-On:**
   - User can toggle **"Auto-On at Off-Peak Hour"** (`ON/OFF`) in the smartphone app.
   - Action: The exact moment the simulated clock enters the selected country's Off-Peak window (and relay is not in safety lockout), the smart plug automatically turns `ON`.
4. **Daily Schedule Auto-On / Auto-Off:**
   - Action: When simulated clock matches an enabled schedule's `Start Time`, the plug turns `ON`; when it matches `End Time`, the plug turns `OFF`.

### FR-4: Daily On/Off Scheduling
- Users can create, edit, toggle, and delete multiple daily schedule slots inside the simulated smartphone app.
- Each schedule entry includes:
  - **Days Active:** Multi-select (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`, or `Every Day`).
  - **Start Time (`HH:MM`):** Triggers Auto-On.
  - **End Time (`HH:MM`):** Triggers Auto-Off.
  - **Active Toggle:** Enable or disable individual schedule rules without deleting them.
- **Pre-loaded Demo Schedules:** Come pre-configured with realistic examples (e.g., *Water Heater Off-Peak Heating `23:15 – 00:15`*, *AC Night Comfort `22:00 – 05:00`*) so judges immediately see scheduled automation in action.

### FR-5: Anomaly Voltage Detection & Instant Mobile Alert
- **Normal Grid Voltage Window:** `207 V – 240 V` (Nominal `220 V` / `230 V` based on country).
- **Demo Anomaly Simulation Triggers:**
  - `Simulate Undervoltage (Sag ~175 V)`
  - `Simulate Overvoltage (Surge ~265 V)`
  - `Simulate Overload (>2,400 W Spike)`
  - `Restore Normal Voltage`
- **Mandatory Automated Response on Anomaly:**
  1. **Instant Relay Cutoff:** Power is cut within `< 50 ms` (simulated), setting relay state to `TRIPPED` and dropping load to `0 W`.
  2. **Instant Smartphone Push Notification:** A high-priority mobile push notification banner slides down at the top of the simulated smartphone screen (e.g., *"⚠️ CRITICAL VOLTAGE SURGE (265V) DETECTED! EcoShift Plug automatically cut power to protect your Water Heater."*), accompanied by a visual pulse/alert sound toggle.
  3. **Safety Latch & Reset:** The plug remains safely `OFF` until grid voltage returns to normal (`207 V – 240 V`) and the user taps **"Reset Safety Lock"** on the phone app or plug.
  4. **Anomaly History Log:** Records timestamp, anomaly type, peak/dip reading, protected appliance, and action taken (`Auto-Cutoff + Mobile Alert Sent`).

### FR-6: Country-Based Monthly Bill & Off-Peak Savings Estimator
- **Regulatory Country Selector:** Switching countries dynamically updates currency, tariff rates, peak/off-peak schedule windows, and grid carbon intensity:

| Country | Regulation Type | Currency | Peak Window & Rate | Off-Peak Window & Rate | Grid Carbon Intensity (Peak $\rightarrow$ Off-Peak) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Indonesia (PLN R1/R2)** | **Flat Tariff** (24h uniform residential rate) | `IDR (Rp)` | `00:00 – 24:00` (All Day)<br>**Rp 1,444.70 / kWh** | *Regulatory Note:* Flat rate (`Rp 1,444.70 / kWh`). Off-peak window `22:00 – 05:00` tracks grid load shifting. | `780 gCO2/kWh` $\rightarrow$ `610 gCO2/kWh` |
| **United Kingdom (Economy 7 TOU)** | **Time-of-Use (TOU)** | `GBP (£)` | `07:30 – 00:30`<br>**£0.29 / kWh** | `00:30 – 07:30`<br>**£0.13 / kWh** | `260 gCO2/kWh` $\rightarrow$ `140 gCO2/kWh` |
| **Malaysia (TNB Domestic TOU)** | **Time-of-Use (TOU)** | `MYR (RM)` | `08:00 – 22:00`<br>**RM 0.57 / kWh** | `22:00 – 08:00`<br>**RM 0.28 / kWh** | `690 gCO2/kWh` $\rightarrow$ `540 gCO2/kWh` |
| **Singapore (OEM TOU Plan)** | **Time-of-Use (TOU)** | `SGD (S$)` | `07:00 – 23:00`<br>**S$ 0.33 / kWh** | `23:00 – 07:00`<br>**S$ 0.19 / kWh** | `410 gCO2/kWh` $\rightarrow$ `350 gCO2/kWh` |
| **Germany (EU Dynamic TOU)** | **Time-of-Use (TOU)** | `EUR (€)` | `06:00 – 23:00`<br>**€0.38 / kWh** | `23:00 – 06:00`<br>**€0.18 / kWh** | `440 gCO2/kWh` $\rightarrow$ `220 gCO2/kWh` |

- **Monthly Bill Breakdown:**
  - Projects 30-day energy consumption ($\text{kWh}$) split into **Peak Hour Consumption** and **Off-Peak Hour Consumption**.
  - Displays **Estimated Monthly Bill** in the selected country's local currency, visually distinguishing Peak Cost vs. Off-Peak Cost.
- **Off-Peak Savings Calculation Rule:**
  - Savings are **strictly calculated from Off-Peak Hour energy consumption** adjusted to the selected country's regulation:
    - **For TOU Countries (UK, Malaysia, Singapore, Germany):**
      $$\text{Off-Peak Savings} = \text{kWh}_{\text{off-peak}} \times (\text{Rate}_{\text{peak}} - \text{Rate}_{\text{off-peak}})$$
    - **For Indonesia (Flat Tariff):**
      $$\text{Off-Peak Tariff Savings} = \text{Rp } 0$$
      UI displays a clear regulatory badge: *"Indonesia Residential Tariff (PLN): Flat Rate — Financial arbitrage is Rp 0; sustainability impact is measured via Peak Load Reduction ($\text{kW}$) and $\text{CO}_2$ Emissions Avoided ($\text{kg}$)."*

---

## 5. Acceptance Criteria Checklist for AI Agent

- [ ] **Zero Hardware Dependencies:** App runs smoothly offline/client-side without network errors.
- [ ] **Single-Socket & 4 Appliances:** Only 1 smart plug socket is modeled, supporting `Water Heater`, `Charger`, `Dispenser`, and `AC`.
- [ ] **No Excluded Features:** Zero references to Eco-Reward Points, unit pricing, multi-socket strips, water meters, AI load shifting, or "Auto-Save Mode".
- [ ] **Deterministic Automation:** Countdown timer and overload trigger Auto-Cutoff; Daily Schedule and Off-Peak entry trigger Auto-On.
- [ ] **Anomaly Protection Flow:** Clicking any voltage/overload anomaly button immediately trips the plug `OFF` and triggers a visible push notification on the simulated smartphone screen.
- [ ] **Country Tariff Accuracy:** Switching between Indonesia (Flat) and UK/Malaysia/Singapore/Germany (TOU) immediately recalculates the monthly bill and updates Off-Peak savings according to each country's regulations.
- [ ] **Day/Night Sync:** Advancing virtual time transitions the simulator room scene between daytime and nighttime aesthetics.