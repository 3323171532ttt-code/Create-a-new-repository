# Local Weather Dashboard & 3D Meteorological Station

A fully functional, responsive real-time weather application built for the **"Prototyping for Masters"** workshop. It faithfully implements the dark minimalist tablet interface design and interactive Three.js 3D Earth globe using live meteorological satellite telemetry from the **Open-Meteo API**.

---

## Key Capabilities

1. **Zero-Config Real-Time Weather (Open-Meteo API)**:
   - Fetches live temperature, apparent ("feels-like") temperature, WMO weather interpretation codes, wind velocity, relative humidity, UV index, and precipitation metrics.
   - Requires **no API keys** — works instantly for any user, anywhere in the world.

2. **Interactive Forecast Modes**:
   - **Hourly Spline Curve**: Dynamically calculates cubic bezier spline control points (`M x y C ...`) with interactive node selection and an 8-hour pager.
   - **Metric Switcher**: Toggle between `[ 🌡️ Temp ]` (temperature curve) and `[ 💧 Rain % ]` (precipitation probability curve with cyan area fill).
   - **7-Day Synoptic Forecast**: Displays min/max temperature ranges, precipitation probability badges (`💧 %`), custom icons, and interactive day selection.
   - **Sunrise & Sunset Solar Arc**: Visual curved solar progression widget tracking sunrise, sunset, daylight duration, and real-time sun position.

3. **Dynamic Ambient Weather Canvas (`WeatherBackdrop.tsx`)**:
   - Hardware-accelerated canvas background responding to current weather conditions:
     - **Thunderstorm**: Angled rain streaks with realistic dynamic lightning flashes.
     - **Rain / Drizzle**: Falling rain streaks with floor splash ripples.
     - **Clear / Sunny**: Warm rotating sunbeams with drifting solar dust particles.
     - **Snow**: Drifting crystalline snowflakes with depth parallax.
     - **Clouds / Mist**: Layered drifting volumetric fog bands.
   - Includes a toggle button (`✨ FX: On/Off`) to easily enable or pause ambient effects.

4. **Interactive Three.js 3D World Globe (`WorldGlobe.tsx`)**:
   - WebGL sphere with procedural dark continental landmasses and latitude/longitude graticules.
   - **Map Layers**: Switch between `[ 🛰️ Satellite ]`, `[ 🌧️ Radar ]` (pulsing Doppler precipitation halos), and `[ 🌡️ Thermal ]` (latitude-based climate gradients).
   - Orbit controls: drag to spin Earth, scroll to zoom, click beacons to center and fetch live weather.

5. **City Management & Favorites**:
   - **Live City Search**: Open-Meteo Geocoding autocomplete with debounced queries.
   - **GPS Detection**: Browser geolocation with BigDataCloud reverse geocoding.
   - **Favorites Shelf**: Pin/unpin cities with the star `★` button, switch cities with 1 click, and delete from shelf. Persisted to `localStorage`.

6. **Smart Meteorological Insights**:
   - **Weather Alerts**: Evaluates severe storm, high wind (>45 km/h), heavy rain, extreme heat/frost, or confirms optimal atmospheric conditions.
   - **Clothing Advice**: Suggests practical outerwear and accessories based on apparent temperature, wind, and precipitation risk.
   - **Outdoor Activity Index**: Scores 4 activities (Running, Cycling, Dining, Stargazing) with Great / Good / Fair / Poor badges and meteorological rationales.

7. **Deep Personalization**:
   - Unit toggle: Celsius (°C) / Fahrenheit (°F).
   - Time format toggle: 12-hour / 24-hour clock.
   - All preferences automatically persist in `localStorage`.

---

## Technical Architecture

- **Framework**: Next.js 15.5 with React 19 and TypeScript.
- **3D Graphics**: Three.js WebGL with procedural canvas texturing.
- **Styling**: Scoped CSS Modules adhering strictly to `AGENTS.md` guidelines.
- **APIs**:
  - Weather Forecast: `https://api.open-meteo.com/v1/forecast`
  - Geocoding Search: `https://geocoding-api.open-meteo.com/v1/search`
  - Reverse Geocoding: `https://api.bigdatacloud.net/data/reverse-geocode-client`
