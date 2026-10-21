# Meteorological Archive & Dispatch (Editorial Weather Prototype)

An interactive weather dashboard built for the "Prototyping for Masters" workshop, reimagined in the tactile editorial and ambient physical computing aesthetic of **Shuotong Huang's portfolio** ([shuotong-huang-portfolio.vercel.app](https://shuotong-huang-portfolio.vercel.app/)).

It demonstrates fetching real-time meteorological data using the **OpenWeatherMap API** combined with the browser's native **Geolocation API**, complete with ambient daily poetic reflections, a 5-day printed outlook, and tactile paper specimen cards for design exploration.

---

## Design System & Portfolio Inspiration

- **Tactile Paper Materiality**: Warm ivory paper background (`#FAF7F0`), deep carbon ink (`#2B2826`), muted kraft/stone borders (`#D8CDBA`), and cinnabar/vermilion red seal stamp accents (`#8B2622`).
- **Editorial Typography**: Classic serif headlines (`EB Garamond`) for temperatures and station names, typewriter monospaced coordinates and telemetry (`Courier Prime`), and clean Swiss sans (`Inter`) for controls.
- **Ambient Poetic Dispatches**: Inspired by Shuotong's research (*"ambient desktop displays that update daily with poetry, weather, and calendar entries"*), each atmospheric state features an observational literary note.
- **Physical Specimen Slips**: Interactive simulation presets designed as rotated paper notes (Yellow, Kraft, Sage, Rose, Ivory) with authentic subtle rotations (`-1.5deg`, `1.2deg`, `-0.8deg`).

---

## Features

- **Area Detection via Geolocation**: Uses `navigator.geolocation.getCurrentPosition` to query weather coordinates (`lat` & `lon`) for the user's exact area.
- **5-Day Synoptic Weather Outlook**: Connects to OpenWeatherMap's `/forecast` endpoint to calculate daily high/low temperatures, precipitation likelihood, and weather trends.
- **Hourly Chronological Strip**: Displays upcoming time blocks with real-time temperature progression and condition icons.
- **Index Search & Recorded Stations**: Search any global city or click quick station chips (New York, London, Tokyo, Paris, San Francisco, Berlin).
- **Comprehensive Metrics Ledger**: Live temperature, feels-like temperature, daily highs/lows, humidity, wind velocity, atmospheric pressure, visibility, sunrise, and sunset times.
- **Unit Switching**: One-click toggle between Celsius (°C) and Fahrenheit (°F).
- **Physical Simulation Slips**: Easily preview clear, rainy, cloudy, stormy, or snowy design states without waiting for weather to change or needing an active API key immediately.
- **Safe API Key Storage**: Enter your OpenWeatherMap API key directly in the UI (saved locally to `localStorage`), or set `NEXT_PUBLIC_OPENWEATHER_API_KEY` in `.env.local`.

---

## Getting an OpenWeatherMap API Key

1. Sign up for a free account at [OpenWeatherMap](https://home.openweathermap.org/users/sign_up).
2. Go to the **API keys** tab on your profile page and copy your default key (or generate a new one). Free keys typically activate within 10–15 minutes after registration.
3. Paste it into the prototype using the **"Authenticate API Key"** button in the header bar.
4. *(Optional)* Alternatively, create a `.env.local` file in the repository root:
   ```bash
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
   ```

---

## How Geolocation Works

In `page.tsx`:
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;

    // 1. Fetch current conditions using coordinates
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);

    // 2. Fetch multi-day forecast
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
  },
  (error) => {
    console.warn("Location error:", error.message);
  }
);
```

When prompt appears in your browser, click **Allow** to let the prototype read your coordinates.
