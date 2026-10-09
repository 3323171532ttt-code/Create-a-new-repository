"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

interface WeatherState {
  city: string;
  country: string;
  lat: number;
  lon: number;
  tempC: number;
  feelsLikeC: number;
  tempMinC: number;
  tempMaxC: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeedMps: number;
  pressureHpa: number;
  visibilityKm: number;
  sunriseTime: string;
  sunsetTime: string;
  isDemo: boolean;
}

// Preset realistic weather states for demo & design testing
const DEMO_PRESETS: Record<string, WeatherState> = {
  clear: {
    city: "San Francisco",
    country: "US",
    lat: 37.7749,
    lon: -122.4194,
    tempC: 19,
    feelsLikeC: 18,
    tempMinC: 14,
    tempMaxC: 22,
    condition: "Clear",
    description: "clear sky and sunshine",
    icon: "☀️",
    humidity: 58,
    windSpeedMps: 4.6,
    pressureHpa: 1014,
    visibilityKm: 10,
    sunriseTime: "06:42 AM",
    sunsetTime: "07:15 PM",
    isDemo: true,
  },
  rain: {
    city: "Seattle",
    country: "US",
    lat: 47.6062,
    lon: -122.3321,
    tempC: 12,
    feelsLikeC: 11,
    tempMinC: 9,
    tempMaxC: 14,
    condition: "Rain",
    description: "moderate continuous rainfall",
    icon: "🌧️",
    humidity: 89,
    windSpeedMps: 6.2,
    pressureHpa: 1008,
    visibilityKm: 7,
    sunriseTime: "06:55 AM",
    sunsetTime: "06:48 PM",
    isDemo: true,
  },
  clouds: {
    city: "London",
    country: "GB",
    lat: 51.5074,
    lon: -0.1278,
    tempC: 15,
    feelsLikeC: 14,
    tempMinC: 11,
    tempMaxC: 17,
    condition: "Clouds",
    description: "scattered overcast clouds",
    icon: "⛅",
    humidity: 74,
    windSpeedMps: 5.1,
    pressureHpa: 1018,
    visibilityKm: 10,
    sunriseTime: "06:30 AM",
    sunsetTime: "06:58 PM",
    isDemo: true,
  },
  thunderstorm: {
    city: "Miami",
    country: "US",
    lat: 25.7617,
    lon: -80.1918,
    tempC: 27,
    feelsLikeC: 31,
    tempMinC: 24,
    tempMaxC: 29,
    condition: "Thunderstorm",
    description: "heavy thunderstorm with squalls",
    icon: "⛈️",
    humidity: 92,
    windSpeedMps: 9.8,
    pressureHpa: 1004,
    visibilityKm: 5,
    sunriseTime: "07:08 AM",
    sunsetTime: "07:22 PM",
    isDemo: true,
  },
  snow: {
    city: "Reykjavik",
    country: "IS",
    lat: 64.1466,
    lon: -21.9426,
    tempC: -2,
    feelsLikeC: -7,
    tempMinC: -5,
    tempMaxC: 0,
    condition: "Snow",
    description: "light powdery snowfall",
    icon: "❄️",
    humidity: 82,
    windSpeedMps: 7.4,
    pressureHpa: 998,
    visibilityKm: 4,
    sunriseTime: "07:45 AM",
    sunsetTime: "05:30 PM",
    isDemo: true,
  },
};

const POPULAR_CITIES = [
  "New York",
  "London",
  "Tokyo",
  "Paris",
  "San Francisco",
  "Berlin",
];

export default function WeatherDisplayPrototype() {
  const [weather, setWeather] = useState<WeatherState>(DEMO_PRESETS.clear);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // API Key state (checks process.env or localStorage)
  const [apiKey, setApiKey] = useState<string>("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState("");

  // Initialize API key from storage or env on client mount
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";
    const storedKey = typeof window !== "undefined" ? localStorage.getItem("owm_api_key") || "" : "";
    const activeKey = storedKey || envKey;
    setApiKey(activeKey);
    setKeyInputValue(activeKey);

    // If API key is present, attempt geolocation automatically
    if (activeKey) {
      detectCurrentLocation(activeKey);
    }
  }, []);

  /**
   * Helper to format Unix timestamps to local time string
   */
  const formatSunTime = (timestampSec: number, timezoneSec: number) => {
    const date = new Date((timestampSec + timezoneSec) * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  /**
   * Map condition string to graphic emoji
   */
  const getConditionIcon = (condition: string, iconCode: string) => {
    const isNight = iconCode.includes("n");
    switch (condition.toLowerCase()) {
      case "clear":
        return isNight ? "🌙" : "☀️";
      case "clouds":
        return "⛅";
      case "rain":
      case "drizzle":
        return "🌧️";
      case "thunderstorm":
        return "⛈️";
      case "snow":
        return "❄️";
      case "mist":
      case "fog":
      case "haze":
        return "🌫️";
      default:
        return "🌤️";
    }
  };

  /**
   * Get dynamic atmospheric card theme class
   */
  const getAtmosphericTheme = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return styles.themeClear;
      case "clouds":
        return styles.themeClouds;
      case "rain":
      case "drizzle":
        return styles.themeRain;
      case "thunderstorm":
        return styles.themeThunderstorm;
      case "snow":
        return styles.themeSnow;
      case "mist":
      case "fog":
      case "haze":
        return styles.themeMist;
      default:
        return styles.themeClear;
    }
  };

  /**
   * Fetch weather from OpenWeatherMap API using coordinates or city name
   */
  const fetchWeather = useCallback(async (params: { lat?: number; lon?: number; city?: string }, keyOverride?: string) => {
    const key = keyOverride !== undefined ? keyOverride : apiKey;
    if (!key) {
      setErrorMessage("No OpenWeatherMap API key provided. Using Demo Mode.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let url = "";
      if (params.lat !== undefined && params.lon !== undefined) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${params.lat}&lon=${params.lon}&units=metric&appid=${key}`;
      } else if (params.city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(params.city)}&units=metric&appid=${key}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: Status ${res.status}`);
      }

      const data = await res.json();
      const conditionMain = data.weather?.[0]?.main || "Clear";
      const iconCode = data.weather?.[0]?.icon || "01d";

      const mapped: WeatherState = {
        city: data.name,
        country: data.sys?.country || "",
        lat: data.coord?.lat || 0,
        lon: data.coord?.lon || 0,
        tempC: Math.round(data.main?.temp ?? 0),
        feelsLikeC: Math.round(data.main?.feels_like ?? 0),
        tempMinC: Math.round(data.main?.temp_min ?? 0),
        tempMaxC: Math.round(data.main?.temp_max ?? 0),
        condition: conditionMain,
        description: data.weather?.[0]?.description || "",
        icon: getConditionIcon(conditionMain, iconCode),
        humidity: data.main?.humidity ?? 0,
        windSpeedMps: data.wind?.speed ?? 0,
        pressureHpa: data.main?.pressure ?? 1013,
        visibilityKm: Math.round((data.visibility ?? 10000) / 1000),
        sunriseTime: formatSunTime(data.sys?.sunrise, data.timezone ?? 0),
        sunsetTime: formatSunTime(data.sys?.sunset, data.timezone ?? 0),
        isDemo: false,
      };

      setWeather(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load weather data.";
      setErrorMessage(`${msg} (Falling back to demo mode)`);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  /**
   * Request browser location via navigator.geolocation
   */
  const detectCurrentLocation = (keyOverride?: string) => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }, keyOverride);
      },
      (err) => {
        setIsLoading(false);
        setErrorMessage(`Geolocation request failed (${err.message}). Try searching by city name.`);
      },
      { timeout: 8000 }
    );
  };

  /**
   * Handle city search form submit
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchWeather({ city: searchQuery.trim() });
  };

  /**
   * Save API Key
   */
  const handleSaveApiKey = () => {
    const trimmed = keyInputValue.trim();
    setApiKey(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("owm_api_key", trimmed);
    }
    setIsKeyModalOpen(false);
    if (trimmed) {
      detectCurrentLocation(trimmed);
    }
  };

  // Temperature unit helpers
  const formatTemp = (celsius: number) => {
    if (unit === "C") return `${celsius}°`;
    const fahrenheit = Math.round((celsius * 9) / 5 + 32);
    return `${fahrenheit}°`;
  };

  const formatWind = (mps: number) => {
    if (unit === "C") return `${mps.toFixed(1)} m/s`;
    const mph = (mps * 2.23694).toFixed(1);
    return `${mph} mph`;
  };

  return (
    <div className={styles.container}>
      {/* Top Header Navigation */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backButton}>
            ← Back to prototypes
          </Link>
          <div className={styles.titleArea}>
            <h1 className={styles.prototypeTitle}>Local Weather Dashboard</h1>
            <p className={styles.prototypeSubtitle}>
              OpenWeatherMap API & Geolocation Prototype
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Status badge: Live vs Demo */}
          <div className={styles.statusTag}>
            <span
              className={
                weather.isDemo
                  ? styles.statusIndicatorDemo
                  : styles.statusIndicatorLive
              }
            />
            <span>{weather.isDemo ? "DEMO MODE" : "LIVE API"}</span>
          </div>

          {/* Unit Toggle */}
          <button
            type="button"
            className={styles.unitToggleButton}
            onClick={() => setUnit((prev) => (prev === "C" ? "F" : "C"))}
            title="Toggle Celsius / Fahrenheit"
          >
            Units: °{unit}
          </button>

          {/* API Key Modal Button */}
          <button
            type="button"
            className={styles.apiKeyBtn}
            onClick={() => setIsKeyModalOpen(true)}
          >
            🔑 {apiKey ? "API Key Configured" : "Add API Key"}
          </button>
        </div>
      </header>

      {/* Error / Notice Banner */}
      {errorMessage && (
        <div className={styles.errorBanner}>
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className={styles.mainLayout}>
        {/* Left Column: Atmospheric Weather Hero Card */}
        <section
          className={`${styles.weatherHeroCard} ${getAtmosphericTheme(
            weather.condition
          )}`}
        >
          {/* Top Row: Location & Dynamic Icon */}
          <div className={styles.heroTopRow}>
            <div className={styles.locationInfo}>
              <h2 className={styles.locationCity}>
                {weather.city}
                {weather.country ? `, ${weather.country}` : ""}
              </h2>
              <div className={styles.locationCoords}>
                <span>📍 {weather.lat.toFixed(2)}°, {weather.lon.toFixed(2)}°</span>
                {isLoading && <span>• Updating...</span>}
              </div>
            </div>

            <div className={styles.weatherIconGraphic}>{weather.icon}</div>
          </div>

          {/* Middle Row: Large Temperature & Condition */}
          <div className={styles.heroMiddleRow}>
            <div className={styles.temperatureLarge}>
              {formatTemp(weather.tempC)}
            </div>

            <div className={styles.weatherConditionInfo}>
              <div className={styles.conditionMain}>{weather.condition}</div>
              <div className={styles.conditionFeelsLike}>
                Feels like {formatTemp(weather.feelsLikeC)} • {weather.description}
              </div>
              <div className={styles.tempRangeRow}>
                <span>L: {formatTemp(weather.tempMinC)}</span>
                <span>H: {formatTemp(weather.tempMaxC)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Weather Detail Metrics */}
          <div className={styles.heroMetricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Humidity</span>
              <span className={styles.metricValue}>{weather.humidity}%</span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Wind</span>
              <span className={styles.metricValue}>{formatWind(weather.windSpeedMps)}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Pressure</span>
              <span className={styles.metricValue}>{weather.pressureHpa} hPa</span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Visibility</span>
              <span className={styles.metricValue}>{weather.visibilityKm} km</span>
            </div>
          </div>
        </section>

        {/* Right Column: Controls & Search Side Panel */}
        <aside className={styles.sideControls}>
          {/* Geolocation & Search Card */}
          <div className={styles.cardSection}>
            <h3 className={styles.sectionHeading}>
              <span>Area & Location</span>
            </h3>

            {/* Geolocation Button */}
            <button
              type="button"
              className={styles.locateButton}
              onClick={() => detectCurrentLocation()}
              disabled={isLoading}
            >
              <span>🧭</span>
              <span>{isLoading ? "Locating..." : "Detect My Area (GPS)"}</span>
            </button>

            {/* City Search Form */}
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search city..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className={styles.searchButton}
                disabled={isLoading}
              >
                Search
              </button>
            </form>

            {/* Quick City Presets */}
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  display: "block",
                  marginBottom: "0.4rem",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Quick Jump:
              </span>
              <div className={styles.cityChipsRow}>
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={styles.cityChip}
                    onClick={() => fetchWeather({ city })}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Demo Presets Card */}
          <div className={styles.cardSection}>
            <h3 className={styles.sectionHeading}>
              <span>Simulate Weather States</span>
            </h3>
            <div className={styles.demoPresetsRow}>
              <button
                type="button"
                className={styles.presetStateButton}
                onClick={() => setWeather(DEMO_PRESETS.clear)}
              >
                <span>☀️</span> Clear Sky
              </button>
              <button
                type="button"
                className={styles.presetStateButton}
                onClick={() => setWeather(DEMO_PRESETS.rain)}
              >
                <span>🌧️</span> Rain
              </button>
              <button
                type="button"
                className={styles.presetStateButton}
                onClick={() => setWeather(DEMO_PRESETS.clouds)}
              >
                <span>⛅</span> Clouds
              </button>
              <button
                type="button"
                className={styles.presetStateButton}
                onClick={() => setWeather(DEMO_PRESETS.thunderstorm)}
              >
                <span>⛈️</span> Storm
              </button>
              <button
                type="button"
                className={styles.presetStateButton}
                onClick={() => setWeather(DEMO_PRESETS.snow)}
              >
                <span>❄️</span> Snow
              </button>
            </div>
          </div>

          {/* Educational Note for Workshop Students */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}>
              <span>💡</span>
              <span>Design & API Tip</span>
            </div>
            <p className={styles.infoCardText}>
              This prototype pairs the browser's <code>navigator.geolocation</code> API
              with OpenWeatherMap's <code>/data/2.5/weather</code> endpoint. The dynamic
              atmospheric card gradient adapts dynamically based on the current weather
              condition.
            </p>
          </div>
        </aside>
      </div>

      {/* API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsKeyModalOpen(false)}
        >
          <div
            className={styles.modalWindow}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>OpenWeatherMap API Key</h3>
            <p className={styles.modalBody}>
              Enter your free OpenWeatherMap API key below. You can get one from{" "}
              <a
                href="https://openweathermap.org/api"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#60a5fa", textDecoration: "underline" }}
              >
                openweathermap.org/api
              </a>
              . Your key will be safely saved in local storage.
            </p>

            <input
              type="text"
              className={styles.keyInput}
              placeholder="e.g. 4a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d"
              value={keyInputValue}
              onChange={(e) => setKeyInputValue(e.target.value)}
            />

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsKeyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSaveBtn}
                onClick={handleSaveApiKey}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
