# Technical Architecture and Implementation Guide (`Architecture_EcoShift.md`)
## EcoShift Home: Interactive Web Simulator and Pitch Platform

## 1. Architectural Overview

* **Architecture Pattern:** Client-Side Single-Page Application (SPA) with a deterministic discrete-time simulation engine (`250ms` tick interval) and optional Google Maps Platform Weather API integration.
* **Resilient Offline-First Fallback:** All tariff rules, grid carbon intensities, appliance profiles, thermal physics, virtual clock ticks, and WhatsApp mockup notifications run locally in browser memory. Weather lookup uses `VITE_GOOGLE_WEATHER_API_KEY` when configured and falls back cleanly to local weather simulation when offline or unconfigured.
* **Tech Stack:**
  * **Framework:** React 19 with TypeScript (`Vite` build tool)
  * **Styling:** Tailwind CSS v4
  * **Icons:** `lucide-react`
  * **Charts/Sparklines:** Custom lightweight responsive SVG components

## 2. System Data Flow

```text
+-------------------------------------------------------------------+
|                     SIMULATION ENGINE (250ms Tick)                |
|  - Advances virtualClock by (deltaSeconds * speedMultiplier)      |
|  - Updates plugTemperatureC (thermal rise/cool physics)           |
|  - Polls / applies Weather Condition (Live API or Preset)         |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                  AUTOMATION & SAFETY EVALUATOR                    |
|  1. SPLN 1:1995 Voltage (<198V or >242V), SNI IEC 60884-1         |
|     Overload (>2,400W), & Thermal Overheat (>=70C)                |
|     -> If TRUE: Trip Relay OFF, emit Push + WhatsApp + Log        |
|  2. Weather Advisory (HEAVY_RAIN / THUNDERSTORM)                  |
|     -> Show Standby Banner + emit EcoShift Guard WhatsApp alert   |
|  3. Countdown Timer <= 0 -> Cut Relay OFF                         |
|  4. Off-Peak Window Entry (if autoOnOffPeak) -> Turn ON           |
|  5. Daily Schedule Match (Start -> ON, End -> OFF)                |
+---------------------------------+---------------------------------+
                                  |
         +------------------------+------------------------+
         v                        v                        v
+-----------------+     +------------------+     +------------------+
|  Hardware Twin  |     | Smartphone Frame |     | Billing & Logs   |
| (Day/Night Room |     | (Push Alerts,    |     | (Country Rules,  |
|  1-Plug LED &   |     |  Controls Tab &  |     |  Sparkline, Temp,|
|  Thermal Glow)  |     |  WhatsApp Tab)   |     |  & Anomaly Log)  |
+-----------------+     +------------------+     +------------------+
```

## 3. Core Data Models (`src/types/simulator.ts`)

* **CountryTariffConfig:** Adds city coordinates (`city`, `latitude`, `longitude`) for weather lookup alongside `nominalVoltage`, `peakRate`, `offPeakRate`, `offPeakStartMinutes`, `offPeakEndMinutes`, `peakCarbonGPerKwh`, and `offPeakCarbonGPerKwh`.
* **FaultInjection:** `'NONE' | 'UNDERVOLTAGE' | 'OVERVOLTAGE' | 'OVERLOAD' | 'OVERHEAT'`.
* **AnomalyType:** `'UNDERVOLTAGE' | 'OVERVOLTAGE' | 'OVERLOAD' | 'OVERHEAT'`.
* **ThermalStatus:** `'NORMAL' | 'WARM' | 'OVERHEAT'` (`28°C to 55°C` Normal, `56°C to 69°C` Warm, `>= 70°C` Overheat).
* **WeatherMode:** `'LIVE_API' | 'CLEAR' | 'HEAVY_RAIN' | 'THUNDERSTORM'`.
* **WeatherCondition:** `'CLEAR' | 'HEAVY_RAIN' | 'THUNDERSTORM'`.
* **WeatherState:** `{ mode, condition, source, city, temperatureC, description, lastUpdated, isLoading, error }`.
* **WhatsAppMessage:** `{ id, eventTitle, eventType, voltageV, temperatureC, powerW, simulatedTime, actionStatus, severity, timestamp }`.

## 4. Safety, Thermal, and Weather Specifications

### 4.1 Electrical Safety Standards (SPLN 1:1995 / Permen ESDM)
* **Nominal Grid Voltage:** `220 V` (`50 Hz`) for Indonesia (`230 V` for UK, Malaysia, Singapore, Germany).
* **Safe Operating Band:** `198 V to 231 V` (maximum upper tolerance `242 V`, ±10% of `220 V`).
* **High-Voltage Warning Band:** `232 V to 242 V` displays an advisory warning without tripping.
* **Safety Cutoff Thresholds:**
  * `UNDERVOLTAGE`: `< 198 V` (Fault trigger injects `~176.4 V`) -> Instant Relay `TRIPPED`.
  * `OVERVOLTAGE`: `> 242 V` (Fault trigger injects `~264.8 V`) -> Instant Relay `TRIPPED`.
  * `OVERLOAD`: `> 2,400 W` (SNI IEC 60884-1 `10A / 250V` limit; fault trigger injects `2,480 W`) -> Instant Relay `TRIPPED`.

### 4.2 Thermal Monitoring and Physics (SNI IEC 60884-1)
* **Standard Basis:** Maximum terminal temperature rise of `45 K` above ambient (`~25°C to 28°C`), keeping safe operating surface temperature strictly below `70°C` (critical danger zone `70°C to 85°C`).
* **Thermal Status:**
  * `NORMAL`: `28°C to 55°C`
  * `WARM`: `56°C to 69°C`
  * `OVERHEAT`: `>= 70°C` -> Instant Relay `TRIPPED`, anomaly logged, and WhatsApp alert dispatched.
* **Discrete-Time Thermal Model:**
  * Ambient baseline: `28.0°C`.
  * Target steady-state temperature when `ON`: scales with appliance wattage (`Water Heater 1,500 W` approaches `67°C`, `AC 900 W` approaches `58°C`, `Dispenser 350 W` approaches `42°C`, `Charger 65 W` approaches `33°C`).
  * Each tick advances temperature smoothly toward target when `ON` (accelerated proportionally with simulation speed, capped for visual stability) and cools gradually toward `28.0°C` when `OFF` or `TRIPPED`.
  * **Instant Overheat Preset:** `triggerFault('OVERHEAT')` spikes plug temperature to `74.5°C` (`>= 70°C`), immediately tripping the relay and firing both the push banner and `EcoShift Guard` WhatsApp message.

### 4.3 Google Weather API Integration (`src/services/weatherService.ts`)
* **Endpoint:** `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}`
* **API Key Handling:** Read exclusively via `import.meta.env.VITE_GOOGLE_WEATHER_API_KEY`. Never hardcoded.
* **Response Mapping & Validation:** Validates HTTP `200`, JSON structure, and `weatherCondition.type` (mapping thunderstorm types to `THUNDERSTORM`, heavy rain/downpour types to `HEAVY_RAIN`, and all other valid types to `CLEAR`).
* **Fallback Behavior:** If `VITE_GOOGLE_WEATHER_API_KEY` is missing or the request fails/times out, the service returns a deterministic local simulated weather state (`source: 'SIMULATED_FALLBACK'`) so live demos never break.

## 5. Folder Structure

```text
ecoshift/
├── index.html
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── simulator.ts                 # TypeScript interfaces for grid, thermal, weather, WhatsApp
    ├── data/
    │   ├── countries.ts                 # ID, UK, MY, SG, DE tariffs & city coordinates
    │   └── appliances.ts                # Water Heater, AC, Dispenser, Charger presets
    ├── services/
    │   └── weatherService.ts            # Google Weather API client + local fallback
    ├── engine/
    │   ├── useSimulatorEngine.ts        # Master hook: clock, thermal, safety, weather, WhatsApp
    │   ├── billingCalculator.ts         # Pure functions for monthly bill, savings & CO2
    │   └── billingCalculator.test.ts    # Vitest unit tests
    └── components/
        ├── layout/
        │   ├── Navbar.tsx
        │   └── Footer.tsx
        ├── pitch/
        │   ├── HeroSection.tsx
        │   ├── ProblemSolutionSection.tsx
        │   └── SustainabilityBmcSection.tsx
        └── simulator/
            ├── SimulatorWorkbench.tsx   # 3-Column container + Weather banner + Control Bar
            ├── DemoControlBar.tsx       # Speed, Time Jump, Fault/Overheat, Weather Controls
            ├── HardwarePlugTwin.tsx     # Day/Night Room + 1-Socket Plug + Thermal Indicator
            ├── SmartphoneAppFrame.tsx   # Controls Tab + WhatsApp (EcoShift Guard) Tab
            ├── BillingAnalyticsPanel.tsx# Country selector, Sparkline, Temp, Bill & Savings
            └── AnomalyLogTable.tsx      # Historical log of safety cutoffs & alerts
```
