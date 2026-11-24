# Technical Architecture & Implementation Guide (`arsitektur.md`)
## EcoShift Home — Interactive Web Simulator & Pitch Platform

---

## 1. Architectural Overview

- **Architecture Pattern:** `100% Client-Side Single-Page Application (SPA)` with a deterministic discrete-time simulation engine.
- **Zero External Runtime Dependencies:** All tariff rules, grid carbon intensities, appliance profiles, virtual clock ticks, and mobile notifications run locally in browser memory. This guarantees **zero latency and zero network failure risk** during live competition presentations.
- **Recommended Tech Stack:**
  - **Framework:** React 18+ with TypeScript (`Vite` build tool)
  - **Styling:** Tailwind CSS v3/v4
  - **Icons:** `lucide-react`
  - **Charts/Sparklines:** Custom lightweight responsive SVG components (faster, sharper, and zero hydration/resize bugs compared to heavy chart libraries)

---
+
## 2. System Data Flow

```text
+-------------------------------------------------------------------+
|                     SIMULATION ENGINE (useInterval)               |
|  Advances virtualClock by (deltaSeconds * speedMultiplier)        |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                  AUTOMATION & SAFETY EVALUATOR                    |
|  1. Check Voltage Anomaly (<195V or >245V) & Overload (>2200W)    |
|     -> If TRUE: Trip Relay OFF, emit Mobile Push + Anomaly Log    |
|  2. Check Countdown Timer <= 0 -> Cut Relay OFF                   |
|  3. Check Off-Peak Window Entry (if autoOnOffPeak) -> Turn ON     |
|  4. Check Daily Schedule Match (Start -> ON, End -> OFF)          |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               ELECTRICAL & BILLING CALCULATOR                     |
|  - Computes live Voltage (V), Current (A), Active Power (W)       |
|  - Accumulates Peak kWh & Off-Peak kWh                            |
|  - Projects 30-Day Monthly Bill using Selected Country Tariff     |
|  - Computes Off-Peak Savings (TOU countries) & CO2 Avoided (kg)   |
+---------------------------------+---------------------------------+
                                  |
         +------------------------+------------------------+
         v                        v                        v
+-----------------+     +------------------+     +------------------+
|  Hardware Twin  |     | Smartphone Frame |     | Billing & Logs   |
| (Day/Night Room |     | (Push Alerts,    |     | (Country Rules,  |
|  & 1-Plug LED)  |     |  Timer, Schedule)|     |  Sparkline, Log) |
+-----------------+     +------------------+     +------------------+
```

---

## 3. Core Data Models (`src/types/simulator.ts`)

```typescript
export type CountryCode = 'ID' | 'UK' | 'MY' | 'SG' | 'DE';

export interface CountryTariffConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currencySymbol: string;
  currencyCode: string;
  isTOU: boolean; // false for Indonesia (Flat), true for TOU countries
  regulationLabel: string;
  regulationNote: string;
  nominalVoltage: number; // e.g., 220 or 230
  peakRate: number; // per kWh in local currency
  offPeakRate: number; // equals peakRate when isTOU === false
  offPeakStartHour: number; // e.g., 23 for 23:00
  offPeakEndHour: number; // e.g., 7 for 07:00
  peakCarbonGPerKwh: number; // gCO2/kWh during peak
  offPeakCarbonGPerKwh: number; // gCO2/kWh during off-peak
}

export type ApplianceId = 'water_heater' | 'ac' | 'dispenser' | 'charger';

export interface AppliancePreset {
  id: ApplianceId;
  name: string;
  wattage: number;
  category: string;
  description: string;
  defaultDailyHours: number; // baseline usage for 30-day projection
}

export type RelayState = 'ON' | 'OFF' | 'TRIPPED';

export interface ScheduleSlot {
  id: string;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startTime: string; // "HH:MM" 24-hour format
  endTime: string; // "HH:MM" 24-hour format
  enabled: boolean;
  label: string;
}

export type AnomalyType = 'UNDERVOLTAGE' | 'OVERVOLTAGE' | 'OVERLOAD';

export interface AnomalyEvent {
  id: string;
  simulatedTimestamp: string;
  type: AnomalyType;
  measuredValue: string; // e.g., "264.5 V" or "2,450 W"
  applianceName: string;
  actionTaken: string; // "Auto-Cutoff + Mobile Push Sent"
}

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'info';
  read: boolean;
}
```

---

## 4. Reference Datasets (`src/data/`)

### 4.1 Country Tariff Configurations (`src/data/countries.ts`)
```typescript
export const COUNTRY_CONFIGS: Record<CountryCode, CountryTariffConfig> = {
  ID: {
    code: 'ID',
    name: 'Indonesia (PLN Residential)',
    flag: '🇮🇩',
    currencySymbol: 'Rp ',
    currencyCode: 'IDR',
    isTOU: false,
    regulationLabel: 'Flat Residential Tariff (R1/R2)',
    regulationNote:
      'Indonesia applies a uniform 24-hour residential tariff. Financial TOU arbitrage is Rp 0; off-peak shifting reduces grid peak stress and CO2 emissions.',
    nominalVoltage: 220,
    peakRate: 1444.7,
    offPeakRate: 1444.7,
    offPeakStartHour: 22,
    offPeakEndHour: 5,
    peakCarbonGPerKwh: 780,
    offPeakCarbonGPerKwh: 610,
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom (Economy 7 TOU)',
    flag: '🇬🇧',
    currencySymbol: '£',
    currencyCode: 'GBP',
    isTOU: true,
    regulationLabel: 'Time-of-Use (Economy 7)',
    regulationNote:
      'UK Economy 7 regulations offer ~55% lower electricity rates during night off-peak hours (00:00–07:00).',
    nominalVoltage: 230,
    peakRate: 0.29,
    offPeakRate: 0.13,
    offPeakStartHour: 0,
    offPeakEndHour: 7,
    peakCarbonGPerKwh: 260,
    offPeakCarbonGPerKwh: 140,
  },
  MY: {
    code: 'MY',
    name: 'Malaysia (TNB Domestic TOU)',
    flag: '🇲🇾',
    currencySymbol: 'RM ',
    currencyCode: 'MYR',
    isTOU: true,
    regulationLabel: 'Time-of-Use (Domestic TOU)',
    regulationNote:
      'TNB Time-of-Use scheme lowers residential tariffs by ~50% between 22:00 and 08:00.',
    nominalVoltage: 230,
    peakRate: 0.57,
    offPeakRate: 0.28,
    offPeakStartHour: 22,
    offPeakEndHour: 8,
    peakCarbonGPerKwh: 690,
    offPeakCarbonGPerKwh: 540,
  },
  SG: {
    code: 'SG',
    name: 'Singapore (OEM TOU Plan)',
    flag: '🇸🇬',
    currencySymbol: 'S$',
    currencyCode: 'SGD',
    isTOU: true,
    regulationLabel: 'Time-of-Use (Off-Peak Plan)',
    regulationNote:
      'Singapore Open Electricity Market TOU plans discount night consumption between 23:00 and 07:00.',
    nominalVoltage: 230,
    peakRate: 0.33,
    offPeakRate: 0.19,
    offPeakStartHour: 23,
    offPeakEndHour: 7,
    peakCarbonGPerKwh: 410,
    offPeakCarbonGPerKwh: 350,
  },
  DE: {
    code: 'DE',
    name: 'Germany (EU Dynamic TOU)',
    flag: '🇩🇪',
    currencySymbol: '€',
    currencyCode: 'EUR',
    isTOU: true,
    regulationLabel: 'Dynamic Time-of-Use Tariff',
    regulationNote:
      'German dynamic smart-meter tariffs reward shifting high loads to wind-abundant off-peak hours (23:00–06:00).',
    nominalVoltage: 230,
    peakRate: 0.38,
    offPeakRate: 0.18,
    offPeakStartHour: 23,
    offPeakEndHour: 6,
    peakCarbonGPerKwh: 440,
    offPeakCarbonGPerKwh: 220,
  },
};
```

### 4.2 Appliance Presets (`src/data/appliances.ts`)
```typescript
export const APPLIANCE_PRESETS: AppliancePreset[] = [
  {
    id: 'water_heater',
    name: 'Water Heater',
    wattage: 1500,
    category: 'Thermal Heating',
    description: 'High-wattage tank heater ideal for off-peak pre-heating.',
    defaultDailyHours: 1.5,
  },
  {
    id: 'ac',
    name: 'Air Conditioner (AC)',
    wattage: 900,
    category: 'Climate Control',
    description: '1 PK bedroom AC scheduled for night off-peak cooling.',
    defaultDailyHours: 6.0,
  },
  {
    id: 'dispenser',
    name: 'Water Dispenser',
    wattage: 350,
    category: 'Kitchen Appliance',
    description: 'Hot/cold water dispenser scheduled off during sleeping hours.',
    defaultDailyHours: 4.0,
  },
  {
    id: 'charger',
    name: 'Fast Charger (Laptop/Phone)',
    wattage: 65,
    category: 'Personal Electronics',
    description: 'USB-C PD charger protected by countdown auto-cutoff.',
    defaultDailyHours: 3.0,
  },
];
```

---

## 5. Mathematical & Simulation Engine Specifications

### 5.1 Off-Peak Window Check (`isOffPeakHour`)
Handles overnight windows that cross midnight (e.g., `22:00` to `05:00`) as well as same-day windows (`00:00` to `07:00`):
```typescript
export function isOffPeakHour(hour: number, country: CountryTariffConfig): boolean {
  const { offPeakStartHour, offPeakEndHour } = country;
  if (offPeakStartHour > offPeakEndHour) {
    // Crosses midnight (e.g., 22:00 -> 05:00)
    return hour >= offPeakStartHour || hour < offPeakEndHour;
  }
  // Same-day window (e.g., 00:00 -> 07:00)
  return hour >= offPeakStartHour && hour < offPeakEndHour;
}
```

### 5.2 Voltage Anomaly & Safety Cutoff Logic
- **Normal Range:** `207.0 V <= voltage <= 240.0 V` and `power <= 2200 W`.
- **Natural Jitter:** When no fault is injected, voltage fluctuates subtly around `country.nominalVoltage` by `Math.sin(tick) * 1.1` Volts.
- **Fault Triggers:**
  - `UNDERVOLTAGE`: Sets `injectedVoltage = 176.4` (`< 195 V`).
  - `OVERVOLTAGE`: Sets `injectedVoltage = 264.8` (`> 245 V`).
  - `OVERLOAD`: Sets `injectedPower = 2480` (`> 2,200 W`).
- **Immediate Trip Execution:**
  1. Set `relayState = 'TRIPPED'`.
  2. Push new `MobileNotification` with `severity: 'critical'` to `notifications` array and set `activeBannerNotification` to trigger slide-down toast inside the Smartphone Frame.
  3. Append `AnomalyEvent` to `anomalyLogs`.

### 5.3 Monthly Bill, Off-Peak Savings & Carbon Formulas
To ensure the Monthly Bill Estimator feels immediately responsive when judges toggle schedules, switch appliances, or change countries, calculate the **30-Day Monthly Projection** by combining configured schedule hours (or baseline appliance usage) split across Peak vs. Off-Peak windows:

1. **Daily Scheduled Hours Split:**
   - Calculate `dailyOffPeakHours` and `dailyPeakHours` from enabled `ScheduleSlot` entries (or if no schedule is enabled, allocate based on `autoOnOffPeak` toggle: if `autoOnOffPeak === true`, 75% of `appliance.defaultDailyHours` runs in Off-Peak; otherwise 80% runs in Peak).
2. **Monthly Energy ($\text{kWh}$):**
   $$\text{kWh}_{\text{peak}} = \frac{\text{ApplianceWattage} \times \text{dailyPeakHours} \times 30}{1000}$$
   $$\text{kWh}_{\text{offPeak}} = \frac{\text{ApplianceWattage} \times \text{dailyOffPeakHours} \times 30}{1000}$$
3. **Monthly Cost (Local Currency):**
   $$\text{Cost}_{\text{peak}} = \text{kWh}_{\text{peak}} \times \text{country.peakRate}$$
   $$\text{Cost}_{\text{offPeak}} = \text{kWh}_{\text{offPeak}} \times \text{country.offPeakRate}$$
   $$\text{TotalMonthlyBill} = \text{Cost}_{\text{peak}} + \text{Cost}_{\text{offPeak}}$$
4. **Off-Peak Savings (Strict Regulatory Rule):**
   $$\text{OffPeakSavings} = \begin{cases} \text{kWh}_{\text{offPeak}} \times (\text{country.peakRate} - \text{country.offPeakRate}), & \text{if } \text{country.isTOU} = \text{true} \\ 0, & \text{if } \text{country.isTOU} = \text{false (Indonesia Flat)} \end{cases}$$
5. **Carbon Emissions Avoided ($\text{kg CO}_2/\text{month}$):**
   $$\text{CO}_{2,\text{avoided}} = \frac{\text{kWh}_{\text{offPeak}} \times (\text{country.peakCarbonGPerKwh} - \text{country.offPeakCarbonGPerKwh})}{1000}$$

---

## 6. Recommended Folder Structure

```text
ecoshift-home-demo/
├── index.html
├── package.json
├── tailwind.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/
    │   └── simulator.ts          # All TypeScript interfaces
    ├── data/
    │   ├── countries.ts          # ID, UK, MY, SG, DE tariff & grid regulations
    │   └── appliances.ts         # Water Heater, AC, Dispenser, Charger presets
    ├── engine/
    │   ├── useSimulatorEngine.ts # Master hook: virtual clock, rules, telemetry, billing
    │   └── billingCalculator.ts  # Pure functions for monthly bill, savings & CO2
    └── components/
        ├── layout/
        │   ├── Navbar.tsx
        │   └── Footer.tsx
        ├── pitch/
        │   ├── HeroSection.tsx
        │   ├── ProblemSolutionSection.tsx
        │   └── SustainabilityBmcSection.tsx
        └── simulator/
            ├── SimulatorWorkbench.tsx   # 3-Column container + Demo Control Bar
            ├── DemoControlBar.tsx       # Speed multipliers, Time Jump, Fault Triggers
            ├── HardwarePlugTwin.tsx     # Day/Night Room Scene + 1-Socket Smart Plug
            ├── SmartphoneAppFrame.tsx   # Mobile bezel, Push Notification, Timer, Schedule
            ├── BillingAnalyticsPanel.tsx# Country selector, Voltage sparkline, Bill & Savings
            └── AnomalyLogTable.tsx      # Historical log of safety cutoffs & alerts
```

---

## 7. Step-by-Step AI Agent Implementation Plan

Execute the build in the following sequential order to ensure clean compilation and zero logic bugs:

1. **Phase 1 — Project Initialization & Constants:**
   - Scaffold Vite + React + TypeScript + Tailwind CSS + `lucide-react`.
   - Load Google Fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`) in `index.html`.
   - Create `src/types/simulator.ts`, `src/data/countries.ts`, and `src/data/appliances.ts`.
2. **Phase 2 — Core Simulation & Billing Engine:**
   - Implement `src/engine/billingCalculator.ts` with unit-tested pure functions for Flat vs. TOU tariff calculations and $\text{CO}_2$ savings.
   - Implement `src/engine/useSimulatorEngine.ts` managing the `250ms` interval tick, speed multipliers (`0x` to `1800x`), countdown timer, daily schedules, off-peak auto-on transitions, and anomaly trip/notification triggers.
3. **Phase 3 — Interactive Simulator Components:**
   - Build `DemoControlBar.tsx` (time controls + anomaly injection buttons + reset button).
   - Build `HardwarePlugTwin.tsx` with smooth Day/Night sky/room transitions and the 1-socket smart plug LED ring + 4 appliance selector cards.
   - Build `SmartphoneAppFrame.tsx` with the slide-down mobile push notification overlay, power button, countdown timer, off-peak toggle, and daily schedule CRUD modal/list.
   - Build `BillingAnalyticsPanel.tsx` and `AnomalyLogTable.tsx` with live SVG voltage sparkline and Peak vs. Off-Peak monthly bill breakdown.
4. **Phase 4 — Pitch Landing Page Assembly:**
   - Build `Navbar.tsx`, `HeroSection.tsx`, `ProblemSolutionSection.tsx`, and `SustainabilityBmcSection.tsx` tailored for International Sustainability BMC Judges (ensuring **no unit pricing** and **no eco-points** appear anywhere).
   - Assemble the full page in `src/App.tsx`.
5. **Phase 5 — End-to-End Demo Verification:**
   - Verify switching between `Indonesia (Flat)` and `United Kingdom (TOU)` updates currency and sets Off-Peak Monetary Savings to `Rp 0` for Indonesia vs. positive savings for UK.
   - Verify clicking `Simulate Overvoltage` immediately trips the plug `OFF` and displays the push notification on the smartphone frame.
   - Verify advancing time past `18:00` transitions the room from Daytime to Nighttime.