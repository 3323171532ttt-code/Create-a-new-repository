# Local Weather Prototype

An interactive weather dashboard built for the "Prototyping for Masters" workshop. It demonstrates fetching real-time meteorological data using the **OpenWeatherMap API** combined with the browser's native **Geolocation API**, complete with responsive atmospheric gradients and simulation states for design exploration.

## Features

- **Area Detection via Geolocation**: Uses `navigator.geolocation.getCurrentPosition` to query weather coordinates (`lat` & `lon`) for the user's exact area.
- **City Search & Quick Jumps**: Search any global city or click quick preset chips (New York, Tokyo, London, Paris, etc.).
- **Atmospheric Visual Theming**: Card backgrounds adapt in real time to current weather conditions (Clear daylight, Overcast clouds, Rainfall, Thunderstorm, Snow, Mist).
- **Comprehensive Metrics**: Live temperature, feels-like temperature, daily highs/lows, humidity, wind velocity, atmospheric pressure, and visibility.
- **Unit Switching**: One-click toggle between Celsius (°C) and Fahrenheit (°F).
- **Built-in Demo & Simulation Presets**: Easily preview sunny, stormy, snowy, or rainy design states without waiting for weather to change or needing an active API key immediately.
- **Safe API Key Storage**: Enter your OpenWeatherMap API key directly in the UI (saved locally to `localStorage`), or set `NEXT_PUBLIC_OPENWEATHER_API_KEY` in `.env.local`.

## Getting an OpenWeatherMap API Key

1. Sign up for a free account at [OpenWeatherMap](https://home.openweathermap.org/users/sign_up).
2. Go to the **API keys** tab on your profile page and copy your default key (or create a new one).
3. Paste it into the prototype using the **"Add API Key"** button in the header bar.
4. *(Optional)* Alternatively, create a `.env.local` file in the repository root:
   ```bash
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
   ```

## How Geolocation Works

In `page.tsx`:
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Fetch weather using coordinates
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
  },
  (error) => {
    console.warn("Location error:", error.message);
  }
);
```

When prompt appears in your browser, click **Allow** to let the prototype read your coordinates.
