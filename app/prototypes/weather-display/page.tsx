"use client";

/**
 * ==============================================================================
 * Meteorological Archive & Dispatch (Editorial Paper Weather Prototype)
 * ------------------------------------------------------------------------------
 * Designed in the tactile editorial aesthetic of Shuotong Huang's portfolio
 * (https://shuotong-huang-portfolio.vercel.app/) for "Prototyping for Masters".
 *
 * Core Capabilities:
 * 1. Native Browser Geolocation: reads device GPS coordinates via
 *    `navigator.geolocation.getCurrentPosition()`.
 * 2. OpenWeatherMap Live Fetching: current conditions (`/weather`) and
 *    5-day / 3-hour forecast (`/forecast`).
 * 3. Ambient Poetic Observations: literary dispatch tailored to atmospheric states,
 *    inspired by Shuotong's research into ambient desktop displays.
 * 4. Tactile Paper Slips & Seals: cinnabar stamp (`#8B2622`), parchment paper (`#FAF7F0`),
 *    ink carbon (`#2B2826`), and rotated sticky note simulation presets.
 * 5. Strict CSS Scoping: zero bare tag selectors and zero :root leaks per AGENTS.md.
 * ==============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

// -----------------------------------------------------------------------------
// Data Types
// -----------------------------------------------------------------------------

export interface HourlyForecast {
  timeStr: string;
  tempC: number;
  condition: string;
  icon: string;
}

export interface DailyForecast {
  dayName: string;
  dateStr: string;
  condition: string;
  description: string;
  icon: string;
  tempMinC: number;
  tempMaxC: number;
  pop: number; // Probability of precipitation (0 - 100%)
}

export interface WeatherState {
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
  poeticNote: string;
  isDemo: boolean;
  sourceType: "gps" | "search" | "preset";
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

// -----------------------------------------------------------------------------
// Poetic & Observational Notes (Ambient Desktop Inspiration)
// -----------------------------------------------------------------------------

const POETIC_DISPATCHES: Record<string, string> = {
  clear:
    "The sky holds a quiet lucidity. Crisp daylight washes over the pavements, and shadows sharpen like woodcut ink against stone.",
  rain:
    "A steady rhythmic drumming upon the sills. The city softens into charcoal and wet slate, breathing in the scent of damp loam.",
  clouds:
    "Muted linen light filters through stratified cloud cover. A gentle calm settles across the afternoon, still and contemplative.",
  thunderstorm:
    "Sudden electrical tension hangs in the charged air. Deep rumblings roll across the broadside horizon as squalls sweep through.",
  snow:
    "Silence blankets the geometry of the streets. Cold crystalline flakes drift gently downward, settling like powdered gypsum on iron rails.",
  mist:
    "The edges of buildings dissolve into pale suspension. Damp vapor carries the breath of the river inland, muting sound and distance.",
};

// -----------------------------------------------------------------------------
// Realistic Presets (Modeled as Tactile Paper Archive Cards)
// -----------------------------------------------------------------------------

const DEMO_PRESETS: Record<string, WeatherState> = {
  clear: {
    city: "San Francisco",
    country: "US",
    lat: 37.7749,
    lon: -122.4194,
    tempC: 21,
    feelsLikeC: 20,
    tempMinC: 15,
    tempMaxC: 24,
    condition: "Clear",
    description: "clear sky & brilliant sunshine",
    icon: "☀️",
    humidity: 52,
    windSpeedMps: 4.2,
    pressureHpa: 1016,
    visibilityKm: 10,
    sunriseTime: "06:45 AM",
    sunsetTime: "07:18 PM",
    poeticNote: POETIC_DISPATCHES.clear,
    isDemo: true,
    sourceType: "preset",
    hourly: [
      { timeStr: "Now", tempC: 21, condition: "Clear", icon: "☀️" },
      { timeStr: "14:00", tempC: 23, condition: "Clear", icon: "☀️" },
      { timeStr: "17:00", tempC: 20, condition: "Clear", icon: "☀️" },
      { timeStr: "20:00", tempC: 17, condition: "Clear", icon: "🌙" },
      { timeStr: "23:00", tempC: 15, condition: "Clear", icon: "🌙" },
      { timeStr: "02:00", tempC: 14, condition: "Clear", icon: "🌙" },
    ],
    daily: [
      { dayName: "Today", dateStr: "Oct 9", condition: "Clear", description: "Sunny & bright", icon: "☀️", tempMinC: 15, tempMaxC: 24, pop: 0 },
      { dayName: "Fri", dateStr: "Oct 10", condition: "Clear", description: "Sunny skies", icon: "☀️", tempMinC: 14, tempMaxC: 23, pop: 5 },
      { dayName: "Sat", dateStr: "Oct 11", condition: "Clouds", description: "Partly cloudy", icon: "⛅", tempMinC: 15, tempMaxC: 21, pop: 15 },
      { dayName: "Sun", dateStr: "Oct 12", condition: "Clear", description: "Crisp breeze", icon: "☀️", tempMinC: 13, tempMaxC: 22, pop: 0 },
      { dayName: "Mon", dateStr: "Oct 13", condition: "Clouds", description: "Scattered clouds", icon: "⛅", tempMinC: 14, tempMaxC: 20, pop: 10 },
    ],
  },
  rain: {
    city: "Seattle",
    country: "US",
    lat: 47.6062,
    lon: -122.3321,
    tempC: 13,
    feelsLikeC: 11,
    tempMinC: 10,
    tempMaxC: 15,
    condition: "Rain",
    description: "steady continuous rainfall",
    icon: "🌧️",
    humidity: 91,
    windSpeedMps: 6.8,
    pressureHpa: 1006,
    visibilityKm: 6,
    sunriseTime: "07:05 AM",
    sunsetTime: "06:35 PM",
    poeticNote: POETIC_DISPATCHES.rain,
    isDemo: true,
    sourceType: "preset",
    hourly: [
      { timeStr: "Now", tempC: 13, condition: "Rain", icon: "🌧️" },
      { timeStr: "14:00", tempC: 14, condition: "Rain", icon: "🌧️" },
      { timeStr: "17:00", tempC: 13, condition: "Drizzle", icon: "🌦️" },
      { timeStr: "20:00", tempC: 12, condition: "Rain", icon: "🌧️" },
      { timeStr: "23:00", tempC: 11, condition: "Clouds", icon: "☁️" },
      { timeStr: "02:00", tempC: 10, condition: "Clouds", icon: "☁️" },
    ],
    daily: [
      { dayName: "Today", dateStr: "Oct 9", condition: "Rain", description: "Periods of rain", icon: "🌧️", tempMinC: 10, tempMaxC: 15, pop: 85 },
      { dayName: "Fri", dateStr: "Oct 10", condition: "Rain", description: "Scattered showers", icon: "🌦️", tempMinC: 9, tempMaxC: 14, pop: 70 },
      { dayName: "Sat", dateStr: "Oct 11", condition: "Clouds", description: "Heavy overcast", icon: "☁️", tempMinC: 8, tempMaxC: 13, pop: 35 },
      { dayName: "Sun", dateStr: "Oct 12", condition: "Rain", description: "Afternoon showers", icon: "🌧️", tempMinC: 9, tempMaxC: 14, pop: 60 },
      { dayName: "Mon", dateStr: "Oct 13", condition: "Clear", description: "Sun breaks through", icon: "⛅", tempMinC: 7, tempMaxC: 16, pop: 20 },
    ],
  },
  clouds: {
    city: "London",
    country: "GB",
    lat: 51.5074,
    lon: -0.1278,
    tempC: 16,
    feelsLikeC: 15,
    tempMinC: 12,
    tempMaxC: 18,
    condition: "Clouds",
    description: "overcast stratocumulus clouds",
    icon: "⛅",
    humidity: 78,
    windSpeedMps: 4.8,
    pressureHpa: 1018,
    visibilityKm: 10,
    sunriseTime: "07:12 AM",
    sunsetTime: "06:22 PM",
    poeticNote: POETIC_DISPATCHES.clouds,
    isDemo: true,
    sourceType: "preset",
    hourly: [
      { timeStr: "Now", tempC: 16, condition: "Clouds", icon: "⛅" },
      { timeStr: "14:00", tempC: 18, condition: "Clouds", icon: "☁️" },
      { timeStr: "17:00", tempC: 16, condition: "Clouds", icon: "☁️" },
      { timeStr: "20:00", tempC: 14, condition: "Clouds", icon: "☁️" },
      { timeStr: "23:00", tempC: 13, condition: "Clouds", icon: "☁️" },
      { timeStr: "02:00", tempC: 12, condition: "Clouds", icon: "☁️" },
    ],
    daily: [
      { dayName: "Today", dateStr: "Oct 9", condition: "Clouds", description: "Overcast", icon: "⛅", tempMinC: 12, tempMaxC: 18, pop: 20 },
      { dayName: "Fri", dateStr: "Oct 10", condition: "Clouds", description: "Cloudy intervals", icon: "⛅", tempMinC: 11, tempMaxC: 17, pop: 15 },
      { dayName: "Sat", dateStr: "Oct 11", condition: "Rain", description: "Light drizzle", icon: "🌦️", tempMinC: 12, tempMaxC: 16, pop: 45 },
      { dayName: "Sun", dateStr: "Oct 12", condition: "Clouds", description: "Overcast skies", icon: "☁️", tempMinC: 10, tempMaxC: 15, pop: 25 },
      { dayName: "Mon", dateStr: "Oct 13", condition: "Clear", description: "Partly sunny", icon: "🌤️", tempMinC: 9, tempMaxC: 16, pop: 10 },
    ],
  },
  thunderstorm: {
    city: "Miami",
    country: "US",
    lat: 25.7617,
    lon: -80.1918,
    tempC: 28,
    feelsLikeC: 32,
    tempMinC: 25,
    tempMaxC: 30,
    condition: "Thunderstorm",
    description: "severe thunderstorm & wind squalls",
    icon: "⛈️",
    humidity: 92,
    windSpeedMps: 11.2,
    pressureHpa: 1002,
    visibilityKm: 4,
    sunriseTime: "07:14 AM",
    sunsetTime: "07:01 PM",
    poeticNote: POETIC_DISPATCHES.thunderstorm,
    isDemo: true,
    sourceType: "preset",
    hourly: [
      { timeStr: "Now", tempC: 28, condition: "Thunderstorm", icon: "⛈️" },
      { timeStr: "14:00", tempC: 29, condition: "Thunderstorm", icon: "⛈️" },
      { timeStr: "17:00", tempC: 27, condition: "Rain", icon: "🌧️" },
      { timeStr: "20:00", tempC: 26, condition: "Clouds", icon: "☁️" },
      { timeStr: "23:00", tempC: 25, condition: "Clouds", icon: "☁️" },
      { timeStr: "02:00", tempC: 25, condition: "Clouds", icon: "☁️" },
    ],
    daily: [
      { dayName: "Today", dateStr: "Oct 9", condition: "Thunderstorm", description: "Severe storms", icon: "⛈️", tempMinC: 25, tempMaxC: 30, pop: 95 },
      { dayName: "Fri", dateStr: "Oct 10", condition: "Rain", description: "Heavy downpours", icon: "🌧️", tempMinC: 24, tempMaxC: 29, pop: 75 },
      { dayName: "Sat", dateStr: "Oct 11", condition: "Clouds", description: "Tropical humidity", icon: "⛅", tempMinC: 24, tempMaxC: 31, pop: 40 },
      { dayName: "Sun", dateStr: "Oct 12", condition: "Clear", description: "Sunny & hot", icon: "☀️", tempMinC: 25, tempMaxC: 32, pop: 20 },
      { dayName: "Mon", dateStr: "Oct 13", condition: "Clouds", description: "Humid intervals", icon: "⛅", tempMinC: 25, tempMaxC: 31, pop: 30 },
    ],
  },
  snow: {
    city: "Reykjavik",
    country: "IS",
    lat: 64.1466,
    lon: -21.9426,
    tempC: -2,
    feelsLikeC: -7,
    tempMinC: -5,
    tempMaxC: 1,
    condition: "Snow",
    description: "light powdery snowfall",
    icon: "❄️",
    humidity: 84,
    windSpeedMps: 7.6,
    pressureHpa: 996,
    visibilityKm: 3,
    sunriseTime: "08:05 AM",
    sunsetTime: "06:12 PM",
    poeticNote: POETIC_DISPATCHES.snow,
    isDemo: true,
    sourceType: "preset",
    hourly: [
      { timeStr: "Now", tempC: -2, condition: "Snow", icon: "❄️" },
      { timeStr: "14:00", tempC: 0, condition: "Snow", icon: "❄️" },
      { timeStr: "17:00", tempC: -2, condition: "Snow", icon: "❄️" },
      { timeStr: "20:00", tempC: -4, condition: "Clouds", icon: "☁️" },
      { timeStr: "23:00", tempC: -5, condition: "Clear", icon: "🌙" },
      { timeStr: "02:00", tempC: -6, condition: "Clear", icon: "🌙" },
    ],
    daily: [
      { dayName: "Today", dateStr: "Oct 9", condition: "Snow", description: "Snow flurries", icon: "❄️", tempMinC: -5, tempMaxC: 1, pop: 80 },
      { dayName: "Fri", dateStr: "Oct 10", condition: "Snow", description: "Blowing snow", icon: "❄️", tempMinC: -6, tempMaxC: -1, pop: 70 },
      { dayName: "Sat", dateStr: "Oct 11", condition: "Clouds", description: "Freezing fog", icon: "🌫️", tempMinC: -7, tempMaxC: -2, pop: 30 },
      { dayName: "Sun", dateStr: "Oct 12", condition: "Clear", description: "Clear & freezing", icon: "☀️", tempMinC: -8, tempMaxC: -3, pop: 10 },
      { dayName: "Mon", dateStr: "Oct 13", condition: "Snow", description: "Fresh powder", icon: "❄️", tempMinC: -4, tempMaxC: 0, pop: 65 },
    ],
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

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function EditorialWeatherPrototype() {
  const [weather, setWeather] = useState<WeatherState>(DEMO_PRESETS.clear);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // API Key state
  const [apiKey, setApiKey] = useState<string>("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState("");

  // Live observation clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("12:00:00");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-US", { hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Helper to format Unix timestamps to 24h or 12h time string
   */
  const formatSunTime = (timestampSec: number, timezoneSec: number) => {
    if (!timestampSec) return "--:--";
    const date = new Date((timestampSec + timezoneSec) * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  /**
   * Map condition string & icon code to visual emoji
   */
  const getConditionIcon = (condition: string, iconCode: string = "") => {
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
        return isNight ? "🌙" : "🌤️";
    }
  };

  /**
   * Get poetic reflection matching live condition
   */
  const getPoeticNote = (condition: string) => {
    const key = condition.toLowerCase();
    if (POETIC_DISPATCHES[key]) return POETIC_DISPATCHES[key];
    if (key.includes("rain") || key.includes("drizzle")) return POETIC_DISPATCHES.rain;
    if (key.includes("snow") || key.includes("ice")) return POETIC_DISPATCHES.snow;
    if (key.includes("cloud") || key.includes("overcast")) return POETIC_DISPATCHES.clouds;
    if (key.includes("storm")) return POETIC_DISPATCHES.thunderstorm;
    if (key.includes("mist") || key.includes("fog") || key.includes("haze")) return POETIC_DISPATCHES.mist;
    return POETIC_DISPATCHES.clear;
  };

  /**
   * Parse 5-day / 3-hour forecast from OpenWeatherMap
   */
  const parseForecastData = (forecastData: {
    list?: Array<{
      dt: number;
      main: { temp: number; temp_min: number; temp_max: number; humidity: number };
      weather: Array<{ main: string; description: string; icon: string }>;
      pop?: number;
      dt_txt?: string;
    }>;
    city?: { timezone?: number };
  }) => {
    if (!forecastData?.list || !forecastData.list.length) {
      return { hourly: DEMO_PRESETS.clear.hourly, daily: DEMO_PRESETS.clear.daily };
    }

    const timezoneSec = forecastData.city?.timezone ?? 0;

    // 1. Hourly: first 6 time slices (~18h ahead)
    const hourly: HourlyForecast[] = forecastData.list.slice(0, 6).map((item, idx) => {
      const d = new Date((item.dt + timezoneSec) * 1000);
      const timeStr = idx === 0 ? "Now" : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
      const mainCond = item.weather?.[0]?.main || "Clear";
      const iconCode = item.weather?.[0]?.icon || "";
      return {
        timeStr,
        tempC: Math.round(item.main.temp),
        condition: mainCond,
        icon: getConditionIcon(mainCond, iconCode),
      };
    });

    // 2. Daily: group items by YYYY-MM-DD
    interface DayBucket {
      date: Date;
      temps: number[];
      conditions: string[];
      descriptions: string[];
      icons: string[];
      pops: number[];
    }
    const dayMap = new Map<string, DayBucket>();

    forecastData.list.forEach((item) => {
      const d = new Date((item.dt + timezoneSec) * 1000);
      const dateKey = d.toISOString().split("T")[0];
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: d,
          temps: [],
          conditions: [],
          descriptions: [],
          icons: [],
          pops: [],
        });
      }
      const b = dayMap.get(dateKey)!;
      b.temps.push(item.main.temp);
      if (item.weather?.[0]?.main) b.conditions.push(item.weather[0].main);
      if (item.weather?.[0]?.description) b.descriptions.push(item.weather[0].description);
      if (item.weather?.[0]?.icon) b.icons.push(item.weather[0].icon);
      if (item.pop !== undefined) b.pops.push(item.pop);
    });

    const daily: DailyForecast[] = Array.from(dayMap.entries()).slice(0, 5).map(([dateKey, b], idx) => {
      const minTemp = Math.round(Math.min(...b.temps));
      const maxTemp = Math.round(Math.max(...b.temps));
      const mainCond = b.conditions[Math.floor(b.conditions.length / 2)] || "Clear";
      const mainDesc = b.descriptions[Math.floor(b.descriptions.length / 2)] || "clear sky";
      const mainIcon = b.icons[Math.floor(b.icons.length / 2)] || "01d";
      const avgPop = b.pops.length ? Math.round((b.pops.reduce((s, c) => s + c, 0) / b.pops.length) * 100) : 0;

      const dayName = idx === 0 ? "Today" : b.date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      const dateStr = b.date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

      return {
        dayName,
        dateStr,
        condition: mainCond,
        description: mainDesc,
        icon: getConditionIcon(mainCond, mainIcon),
        tempMinC: minTemp,
        tempMaxC: maxTemp,
        pop: avgPop,
      };
    });

    return { hourly, daily };
  };

  /**
   * Fetch live weather and forecast from OpenWeatherMap
   */
  const fetchWeather = useCallback(
    async (
      params: { lat?: number; lon?: number; city?: string },
      keyOverride?: string,
      source: "gps" | "search" | "preset" = "search"
    ) => {
      const key = keyOverride !== undefined ? keyOverride : apiKey;
      if (!key) {
        setErrorMessage(
          "OpenWeatherMap API key required for live telemetric data. Configure key above or click a specimen card."
        );
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        let weatherUrl = "";
        let forecastUrl = "";

        if (params.lat !== undefined && params.lon !== undefined) {
          weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${params.lat}&lon=${params.lon}&units=metric&appid=${key}`;
          forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${params.lat}&lon=${params.lon}&units=metric&appid=${key}`;
        } else if (params.city) {
          weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            params.city
          )}&units=metric&appid=${key}`;
          forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
            params.city
          )}&units=metric&appid=${key}`;
        }

        const [weatherRes, forecastRes] = await Promise.all([
          fetch(weatherUrl),
          fetch(forecastUrl).catch(() => null),
        ]);

        if (!weatherRes.ok) {
          const errorData = await weatherRes.json().catch(() => ({}));
          throw new Error(
            errorData.message || `API Query failed: Status ${weatherRes.status}`
          );
        }

        const data = await weatherRes.json();
        const conditionMain = data.weather?.[0]?.main || "Clear";
        const iconCode = data.weather?.[0]?.icon || "01d";

        let parsedHourly = DEMO_PRESETS.clear.hourly;
        let parsedDaily = DEMO_PRESETS.clear.daily;

        if (forecastRes && forecastRes.ok) {
          const forecastData = await forecastRes.json();
          const parsed = parseForecastData(forecastData);
          parsedHourly = parsed.hourly;
          parsedDaily = parsed.daily;
        }

        const mapped: WeatherState = {
          city: data.name || (params.city ?? "Local Station"),
          country: data.sys?.country || "",
          lat: data.coord?.lat ?? params.lat ?? 0,
          lon: data.coord?.lon ?? params.lon ?? 0,
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
          poeticNote: getPoeticNote(conditionMain),
          isDemo: false,
          sourceType: source,
          hourly: parsedHourly,
          daily: parsedDaily,
        };

        setWeather(mapped);
        if (source === "gps") {
          setGpsStatus("Station coordinates calibrated via device GPS.");
        } else {
          setGpsStatus(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Meteorological request failed.";
        setErrorMessage(`${msg} (Verify API key or query preset specimens)`);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey]
  );

  /**
   * Request device location via native Geolocation API
   */
  const detectCurrentLocation = useCallback(
    (keyOverride?: string) => {
      if (!navigator.geolocation) {
        setErrorMessage("Browser does not support native Geolocation API.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setGpsStatus("Querying hardware GPS coordinates...");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const activeKey = keyOverride !== undefined ? keyOverride : apiKey;

          if (activeKey) {
            fetchWeather({ lat, lon }, activeKey, "gps");
          } else {
            setIsLoading(false);
            setWeather((prev) => ({
              ...prev,
              city: "Local Station (Device GPS)",
              country: "Station",
              lat,
              lon,
              sourceType: "gps",
              poeticNote:
                "Hardware coordinates recorded. Enter an OpenWeatherMap API key to initiate real-time telemetry.",
            }));
            setGpsStatus(
              `📍 GPS Coordinates recorded: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E. Enter API Key to fetch live dispatch.`
            );
          }
        },
        (err) => {
          setIsLoading(false);
          setGpsStatus(null);
          setErrorMessage(
            `Location query declined: "${err.message}". Use index search or select an archival specimen.`
          );
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    },
    [apiKey, fetchWeather]
  );

  // Initialize API key on client mount
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";
    const storedKey =
      typeof window !== "undefined"
        ? localStorage.getItem("owm_api_key") || ""
        : "";
    const activeKey = storedKey || envKey;
    setApiKey(activeKey);
    setKeyInputValue(activeKey);

    if (activeKey) {
      detectCurrentLocation(activeKey);
    }
  }, [detectCurrentLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchWeather({ city: searchQuery.trim() }, undefined, "search");
  };

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

  const formatTemp = (celsius: number) => {
    if (unit === "C") return `${celsius}°C`;
    const fahrenheit = Math.round((celsius * 9) / 5 + 32);
    return `${fahrenheit}°F`;
  };

  const formatWind = (mps: number) => {
    if (unit === "C") return `${mps.toFixed(1)} m/s`;
    const mph = (mps * 2.23694).toFixed(1);
    return `${mph} mph`;
  };

  return (
    <div className={styles.editorialContainer}>
      {/* Editorial Broadside Masthead Header */}
      <header className={styles.masthead}>
        <div className={styles.mastheadTopRow}>
          <Link href="/" className={styles.returnLink}>
            ← Archive Index
          </Link>
          <div className={styles.mastheadMeta}>
            <span className={styles.metaEntry}>ARCHIVE NO. 2026-MET</span>
            <span className={styles.metaDivider}>/</span>
            <span className={styles.metaEntry}>UTC: {currentTimeStr}</span>
            <span className={styles.metaDivider}>/</span>
            <span className={styles.metaEntry}>
              {weather.isDemo ? "SPECIMEN SIMULATION" : "LIVE TELEMETRIC"}
            </span>
          </div>
        </div>

        <div className={styles.mastheadMain}>
          <div className={styles.mastheadTitleGroup}>
            <h1 className={styles.broadsideTitle}>
              Meteorological Archive & Dispatch
            </h1>
            <p className={styles.broadsideSubtitle}>
              Physical & Ambient Weather Telemetry / OpenWeatherMap & Geolocation
            </p>
          </div>

          {/* Red Cinnabar Seal Stamp: Shuotong / Atmosphere Emblem */}
          <div className={styles.cinnabarStamp} title="Seal of Meteorological Dispatch">
            <div className={styles.stampInner}>
              <span className={styles.stampTopGlyph}>氣</span>
              <span className={styles.stampSubText}>SHUOTONG</span>
            </div>
          </div>
        </div>

        {/* Action Belt: Units, GPS, Key Config */}
        <div className={styles.actionBelt}>
          <div className={styles.beltLeft}>
            <button
              type="button"
              className={styles.stampButtonPrimary}
              onClick={() => detectCurrentLocation()}
              disabled={isLoading}
            >
              <span>🧭</span>
              <span>{isLoading ? "Querying GPS..." : "Calibrate Local Area (GPS)"}</span>
            </button>

            <button
              type="button"
              className={styles.unitStampToggle}
              onClick={() => setUnit((prev) => (prev === "C" ? "F" : "C"))}
            >
              Scale: <strong>°{unit}</strong>
            </button>
          </div>

          <div className={styles.beltRight}>
            <button
              type="button"
              className={styles.apiKeyStampBtn}
              onClick={() => setIsKeyModalOpen(true)}
            >
              🔑 {apiKey ? "API Key Authenticated" : "Authenticate API Key"}
            </button>
          </div>
        </div>
      </header>

      {/* Telemetry Status / Notice Strip */}
      {gpsStatus && (
        <div className={styles.dispatchNoticeBanner}>
          <span className={styles.noticeText}>📍 {gpsStatus}</span>
          <button
            type="button"
            className={styles.noticeCloseBtn}
            onClick={() => setGpsStatus(null)}
          >
            [close]
          </button>
        </div>
      )}

      {errorMessage && (
        <div className={styles.dispatchErrorBanner}>
          <span className={styles.errorText}>⚠ {errorMessage}</span>
          <button
            type="button"
            className={styles.noticeCloseBtn}
            onClick={() => setErrorMessage(null)}
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* Main Broadside Grid */}
      <main className={styles.broadsideLayout}>
        {/* Left Column: Primary Meteorological Paper Card & Outlook */}
        <div className={styles.leadColumn}>
          {/* Main Paper Specimen Card */}
          <article className={styles.specimenSheet}>
            {/* Sheet Header: Station & Coordinates */}
            <div className={styles.specimenHeader}>
              <div className={styles.stationBlock}>
                <span className={styles.stationLabel}>OBSERVATION STATION</span>
                <h2 className={styles.stationName}>
                  {weather.city}
                  {weather.country ? `, ${weather.country}` : ""}
                </h2>
              </div>

              <div className={styles.coordinatesBlock}>
                <span className={styles.coordLabel}>COORDINATES</span>
                <span className={styles.coordValue}>
                  {weather.lat.toFixed(4)}° N, {weather.lon.toFixed(4)}° E
                </span>
                <span className={styles.sourceTagMini}>
                  SOURCE: {weather.sourceType.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Core Reading: Large Serif Temperature & Icon */}
            <div className={styles.temperatureDisplaySection}>
              <div className={styles.tempNumeral}>
                {formatTemp(weather.tempC)}
              </div>

              <div className={styles.conditionLedger}>
                <div className={styles.conditionIconSymbol}>
                  {weather.icon}
                </div>
                <div className={styles.conditionNameTitle}>
                  {weather.condition}
                </div>
                <div className={styles.conditionSubscript}>
                  Feels like {formatTemp(weather.feelsLikeC)} • {weather.description}
                </div>
                <div className={styles.diurnalRangeRow}>
                  <span>MIN: {formatTemp(weather.tempMinC)}</span>
                  <span className={styles.rangeSep}>|</span>
                  <span>MAX: {formatTemp(weather.tempMaxC)}</span>
                </div>
              </div>
            </div>

            {/* Ambient Poetic Weather Dispatch */}
            <div className={styles.ambientPoeticCard}>
              <div className={styles.poeticHeader}>
                <span className={styles.poeticLabel}>AMBIENT OBSERVATION</span>
                <span className={styles.poeticSealChar}>[草木有情]</span>
              </div>
              <p className={styles.poeticText}>
                &ldquo;{weather.poeticNote}&rdquo;
              </p>
            </div>

            {/* Archival Meteorological Metrics Ledger */}
            <div className={styles.specimenMetricsGrid}>
              <div className={styles.metricCell}>
                <span className={styles.metricName}>HUMIDITY</span>
                <span className={styles.metricDigit}>{weather.humidity}%</span>
              </div>

              <div className={styles.metricCell}>
                <span className={styles.metricName}>WIND VELOCITY</span>
                <span className={styles.metricDigit}>{formatWind(weather.windSpeedMps)}</span>
              </div>

              <div className={styles.metricCell}>
                <span className={styles.metricName}>BAROMETRIC</span>
                <span className={styles.metricDigit}>{weather.pressureHpa} hPa</span>
              </div>

              <div className={styles.metricCell}>
                <span className={styles.metricName}>VISIBILITY</span>
                <span className={styles.metricDigit}>{weather.visibilityKm} km</span>
              </div>

              <div className={styles.metricCell}>
                <span className={styles.metricName}>SUNRISE</span>
                <span className={styles.metricDigit}>{weather.sunriseTime}</span>
              </div>

              <div className={styles.metricCell}>
                <span className={styles.metricName}>SUNSET</span>
                <span className={styles.metricDigit}>{weather.sunsetTime}</span>
              </div>
            </div>

            {/* Hourly Chronological Strip */}
            <div className={styles.chronologicalSection}>
              <div className={styles.chronologicalTitle}>
                CHRONOLOGICAL 18-HOUR PROJECTION
              </div>
              <div className={styles.chronologicalStrip}>
                {weather.hourly.map((h, i) => (
                  <div key={i} className={styles.chronologicalCard}>
                    <span className={styles.chronoTime}>{h.timeStr}</span>
                    <span className={styles.chronoIcon}>{h.icon}</span>
                    <span className={styles.chronoTemp}>{formatTemp(h.tempC)}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* 5-Day Outlook Printed Slip */}
          <section className={styles.fiveDaySection}>
            <div className={styles.fiveDayHeader}>
              <h3 className={styles.fiveDayTitle}>
                5-Day Synoptic Weather Outlook
              </h3>
              <span className={styles.fiveDaySub}>
                DATA: OPENWEATHERMAP /FORECAST
              </span>
            </div>

            <div className={styles.fiveDayTable}>
              {weather.daily.map((d, index) => (
                <div key={index} className={styles.fiveDayRow}>
                  <div className={styles.dayCol}>
                    <span className={styles.dayName}>{d.dayName}</span>
                    <span className={styles.dayDate}>{d.dateStr}</span>
                  </div>

                  <div className={styles.weatherIconCol}>
                    <span className={styles.tableIcon}>{d.icon}</span>
                    <span className={styles.tableCondDesc}>{d.condition}</span>
                  </div>

                  <div className={styles.precipitationCol}>
                    {d.pop > 0 ? (
                      <span className={styles.popBadge}>
                        💧 {d.pop}% prob.
                      </span>
                    ) : (
                      <span className={styles.popZero}>dry</span>
                    )}
                  </div>

                  <div className={styles.temperatureRangeCol}>
                    <span className={styles.tempLow}>{formatTemp(d.tempMinC)}</span>
                    <div className={styles.rangeBarTrack}>
                      <div
                        className={styles.rangeBarFill}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(25, (d.tempMaxC - d.tempMinC + 4) * 8)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className={styles.tempHigh}>{formatTemp(d.tempMaxC)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Search, Physical Paper Presets & Theory Note */}
        <aside className={styles.sideRegister}>
          {/* Station Locator Form */}
          <div className={styles.registerCard}>
            <h3 className={styles.registerCardTitle}>
              Index Search & Quick Stations
            </h3>

            <form onSubmit={handleSearchSubmit} className={styles.typewriterForm}>
              <input
                type="text"
                placeholder="Query station (e.g. Kyoto, Boston)..."
                className={styles.typewriterInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className={styles.typewriterSubmitBtn}
                disabled={isLoading}
              >
                Inquire
              </button>
            </form>

            <div className={styles.quickStationChips}>
              <span className={styles.quickLabel}>RECORDED STATIONS:</span>
              <div className={styles.chipsWrapper}>
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.stationChip}
                    onClick={() => fetchWeather({ city: c }, undefined, "search")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tactile Paper Slips (Rotated Sticky Note Simulation Presets) */}
          <div className={styles.registerCard}>
            <h3 className={styles.registerCardTitle}>
              Atmospheric Specimen Slips
            </h3>
            <p className={styles.slipsExplainer}>
              Pre-calibrated tactile cards for physical interaction testing:
            </p>

            <div className={styles.stickySlipsGrid}>
              <button
                type="button"
                className={`${styles.paperSlip} ${styles.slipYellow}`}
                onClick={() => setWeather(DEMO_PRESETS.clear)}
              >
                <span className={styles.slipPin}>📌</span>
                <span className={styles.slipGlyph}>☀️</span>
                <span className={styles.slipTitle}>Clear Sunlight</span>
                <span className={styles.slipSub}>21°C • Lucidity</span>
              </button>

              <button
                type="button"
                className={`${styles.paperSlip} ${styles.slipKraft}`}
                onClick={() => setWeather(DEMO_PRESETS.rain)}
              >
                <span className={styles.slipPin}>📌</span>
                <span className={styles.slipGlyph}>🌧️</span>
                <span className={styles.slipTitle}>Continuous Rain</span>
                <span className={styles.slipSub}>13°C • Wet Slate</span>
              </button>

              <button
                type="button"
                className={`${styles.paperSlip} ${styles.slipSage}`}
                onClick={() => setWeather(DEMO_PRESETS.clouds)}
              >
                <span className={styles.slipPin}>📌</span>
                <span className={styles.slipGlyph}>⛅</span>
                <span className={styles.slipTitle}>Stratified Clouds</span>
                <span className={styles.slipSub}>16°C • Muted Linen</span>
              </button>

              <button
                type="button"
                className={`${styles.paperSlip} ${styles.slipRose}`}
                onClick={() => setWeather(DEMO_PRESETS.thunderstorm)}
              >
                <span className={styles.slipPin}>📌</span>
                <span className={styles.slipGlyph}>⛈️</span>
                <span className={styles.slipTitle}>Squall & Storm</span>
                <span className={styles.slipSub}>28°C • Electric</span>
              </button>

              <button
                type="button"
                className={`${styles.paperSlip} ${styles.slipIvory}`}
                onClick={() => setWeather(DEMO_PRESETS.snow)}
              >
                <span className={styles.slipPin}>📌</span>
                <span className={styles.slipGlyph}>❄️</span>
                <span className={styles.slipTitle}>Fresh Powder</span>
                <span className={styles.slipSub}>-2°C • Gypsum</span>
              </button>
            </div>
          </div>

          {/* Archival Research Colophon */}
          <div className={styles.colophonCard}>
            <div className={styles.colophonHeader}>
              <span className={styles.colophonSeal}>[印]</span>
              <span className={styles.colophonTitle}>Design Research Colophon</span>
            </div>
            <p className={styles.colophonParagraph}>
              Inspired by Shuotong Huang&apos;s physical computing and ambient desktop experiments:
              pairing the browser&apos;s native <span className={styles.codeTag}>navigator.geolocation</span>{" "}
              with OpenWeatherMap telemetry to create calm, tactile interfaces that bridge digital data
              and physical paper crafts.
            </p>
          </div>
        </aside>
      </main>

      {/* API Key Modal (Archival Library Checkout Card) */}
      {isKeyModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsKeyModalOpen(false)}
        >
          <div
            className={styles.libraryCardModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.libraryCardHeader}>
              <h3 className={styles.libraryCardTitle}>
                Meteorological Key Registration
              </h3>
              <span className={styles.libraryCardBadge}>SPECIMEN CHECKOUT</span>
            </div>

            <p className={styles.libraryCardBody}>
              Enter your personal OpenWeatherMap API key. Obtainable without cost at{" "}
              <a
                href="https://openweathermap.org/api"
                target="_blank"
                rel="noreferrer"
                className={styles.externalLink}
              >
                openweathermap.org/api
              </a>
              . Key is preserved safely in your local browser storage.
            </p>

            <input
              type="text"
              className={styles.cardInputField}
              placeholder="Paste 32-character API key..."
              value={keyInputValue}
              onChange={(e) => setKeyInputValue(e.target.value)}
            />

            <div className={styles.cardActionsRow}>
              <button
                type="button"
                className={styles.cardDismissBtn}
                onClick={() => setIsKeyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.cardRegisterBtn}
                onClick={handleSaveApiKey}
              >
                Register & Calibrate Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
