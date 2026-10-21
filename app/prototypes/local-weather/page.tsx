"use client";

/**
 * ==============================================================================
 * Local Weather Dashboard - Feature-Rich Real-Time Meteorological Station
 * ------------------------------------------------------------------------------
 * Rebuilt with live satellite data from Open-Meteo API & Three.js WebGL:
 * 1. Zero API key requirement — works instantly worldwide.
 * 2. Dynamic Ambient Weather Canvas (Rain, Lightning, Sunbeams, Snow, Mist).
 * 3. Interactive Three.js 3D World Globe with Satellite, Radar & Thermal layers.
 * 4. Interactive Forecast: Hourly Spline with [Temperature / Precipitation %] toggle.
 * 5. Enhanced 7-Day Forecast with Min/Max temperature ranges and Rain Probability.
 * 6. Sunrise & Sunset Solar Arc Widget tracking daylight progression.
 * 7. City Favorites Management: Star pin/unpin, favorite shelf, 1-click switching.
 * 8. Real-time City Search (Open-Meteo Geocoding) & Browser GPS Detection.
 * 9. Smart Insights: Computed Weather Alerts, Clothing Advice & Outdoor Activities Index.
 * 10. Deep Personalization: °C/°F, 12h/24h formats, and localStorage persistence.
 * ==============================================================================
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { WorldGlobe } from "./WorldGlobe";
import { WeatherBackdrop } from "./WeatherBackdrop";
import styles from "./styles.module.css";

// -----------------------------------------------------------------------------
// Data Types
// -----------------------------------------------------------------------------

export interface CityLocation {
  name: string;
  region?: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
}

export interface CurrentWeatherState {
  tempC: number;
  feelsLikeC: number;
  conditionTitle: string;
  conditionDescription: string;
  wmoCode: number;
  iconType: "storm" | "sun" | "rain" | "snow" | "cloud";
  windSpeedKmh: number;
  windDirectionDeg?: number;
  humidityPercent: number;
  surfacePressureHpa?: number;
  isDay: boolean;
  dateStr: string;
}

export interface HourlyDataPoint {
  timeISO: string;
  timeStr: string;
  tempC: number;
  precipProbPercent: number;
  precipMm: number;
  wmoCode: number;
  iconType: "storm" | "sun" | "rain" | "snow" | "cloud";
  conditionTitle: string;
}

export interface DailyForecastDay {
  dayName: string;
  dateStr: string;
  wmoCode: number;
  conditionTitle: string;
  iconType: "storm" | "sun" | "rain" | "snow" | "cloud";
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  precipProbMaxPercent: number;
  sunriseIso: string;
  sunsetIso: string;
  uvIndexMax: number;
}

export interface SunData {
  sunriseStr: string;
  sunsetStr: string;
  daylightDurationStr: string;
  sunProgressPercent: number; // 0 to 100
  isDay: boolean;
}

export interface WeatherAlert {
  level: "severe" | "warning" | "normal";
  title: string;
  detail: string;
}

export interface ClothingAdvice {
  headline: string;
  tags: { text: string; icon: string }[];
}

export interface ActivityRating {
  name: string;
  icon: string;
  score: "Great" | "Good" | "Fair" | "Poor";
  rationale: string;
}

export interface SmartInsights {
  alert: WeatherAlert;
  clothing: ClothingAdvice;
  activities: ActivityRating[];
}

// -----------------------------------------------------------------------------
// WMO Weather Interpretation Helper
// -----------------------------------------------------------------------------

function parseWmoCode(code: number): {
  title: string;
  description: string;
  iconType: "storm" | "sun" | "rain" | "snow" | "cloud";
} {
  switch (code) {
    case 0:
      return { title: "Clear Sky", description: "Clear and sunny sky", iconType: "sun" };
    case 1:
      return { title: "Mainly Clear", description: "Mainly clear with sparse clouds", iconType: "sun" };
    case 2:
      return { title: "Partly Cloudy", description: "Partly cloudy atmospheric conditions", iconType: "cloud" };
    case 3:
      return { title: "Overcast", description: "Overcast with dense cloud cover", iconType: "cloud" };
    case 45:
    case 48:
      return { title: "Fog", description: "Low visibility and morning fog", iconType: "cloud" };
    case 51:
    case 53:
    case 55:
      return { title: "Light Drizzle", description: "Scattered light drizzle showers", iconType: "rain" };
    case 56:
    case 57:
      return { title: "Freezing Drizzle", description: "Icy drizzle with freezing fog", iconType: "snow" };
    case 61:
      return { title: "Slight Rain", description: "Gentle intermittent rain showers", iconType: "rain" };
    case 63:
      return { title: "Moderate Rain", description: "Steady continuous rain", iconType: "rain" };
    case 65:
      return { title: "Heavy Rain", description: "Heavy downpours and wet surface", iconType: "rain" };
    case 66:
    case 67:
      return { title: "Freezing Rain", description: "Cold freezing rain and sleet", iconType: "rain" };
    case 71:
    case 73:
    case 75:
      return { title: "Snowfall", description: "Winter snowfall and frosty breeze", iconType: "snow" };
    case 77:
      return { title: "Snow Grains", description: "Fine granular crystalline snow", iconType: "snow" };
    case 80:
    case 81:
    case 82:
      return { title: "Rain Showers", description: "Sudden gusty rain showers", iconType: "rain" };
    case 85:
    case 86:
      return { title: "Snow Showers", description: "Passing winter snow flurries", iconType: "snow" };
    case 95:
      return { title: "Storm with Rain", description: "Thunderstorm with torrential rain", iconType: "storm" };
    case 96:
    case 99:
      return { title: "Thunderstorm with Hail", description: "Severe storm with hail and lightning", iconType: "storm" };
    default:
      return { title: "Cloudy with Rain", description: "Scattered atmospheric showers", iconType: "rain" };
  }
}

// Global Cities Dataset across Continents for the 3D World Globe
const GLOBAL_BEACON_CITIES: CityLocation[] = [
  { name: "Brooklyn", region: "New York", country: "USA", countryCode: "US", lat: 40.6782, lon: -73.9442 },
  { name: "San Francisco", region: "California", country: "USA", countryCode: "US", lat: 37.7749, lon: -122.4194 },
  { name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lon: -0.1278 },
  { name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lon: 2.3522 },
  { name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lon: 13.405 },
  { name: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lon: 139.6503 },
  { name: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lon: 126.978 },
  { name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198 },
  { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lon: 55.2708 },
  { name: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lon: 31.2357 },
  { name: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lon: 151.2093 },
  { name: "Rio de Janeiro", country: "Brazil", countryCode: "BR", lat: -22.9068, lon: -43.1729 },
  { name: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6037, lon: -58.3816 },
  { name: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9249, lon: 18.4241 },
  { name: "Reykjavik", country: "Iceland", countryCode: "IS", lat: 64.1466, lon: -21.9426 },
  { name: "Mumbai", country: "India", countryCode: "IN", lat: 19.076, lon: 72.8777 },
  { name: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lon: 100.5018 },
  { name: "Toronto", region: "Ontario", country: "Canada", countryCode: "CA", lat: 43.6532, lon: -79.3832 },
];

export default function LocalWeatherPrototype() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [currentCity, setCurrentCity] = useState<CityLocation>(GLOBAL_BEACON_CITIES[0]);
  const [cityList, setCityList] = useState<CityLocation[]>(GLOBAL_BEACON_CITIES);
  const [favorites, setFavorites] = useState<CityLocation[]>(GLOBAL_BEACON_CITIES.slice(0, 6));

  // Preferences
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [ambientFxEnabled, setAmbientFxEnabled] = useState<boolean>(true);

  // View Switcher: "dashboard" or "globe"
  const [activeView, setActiveView] = useState<"dashboard" | "globe">("dashboard");

  // Forecast Metric Switcher: "temp" or "precip"
  const [forecastMetric, setForecastMetric] = useState<"temp" | "precip">("temp");

  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherState | null>(null);
  const [allHourly, setAllHourly] = useState<HourlyDataPoint[]>([]);
  const [dailyDays, setDailyDays] = useState<DailyForecastDay[]>([]);
  const [sunData, setSunData] = useState<SunData | null>(null);
  const [smartInsights, setSmartInsights] = useState<SmartInsights | null>(null);

  // Selection & Timeline Navigation
  const [hourlyPageIndex, setHourlyPageIndex] = useState<number>(0);
  const [selectedHourLocalIdx, setSelectedHourLocalIdx] = useState<number>(1);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Search & Dropdown Popover
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);

  // App & Telemetry Status
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search debounce ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------------------------
  // Unit & Clock Formatting Helpers
  // ---------------------------------------------------------------------------
  const formatTemp = useCallback(
    (celsiusVal: number) => {
      if (unit === "imperial") {
        return Math.round((celsiusVal * 9) / 5 + 32);
      }
      return Math.round(celsiusVal);
    },
    [unit]
  );

  const formatWindSpeed = useCallback(
    (kmhVal: number) => {
      if (unit === "imperial") {
        return `${(kmhVal * 0.621371).toFixed(1)}mph`;
      }
      return `${kmhVal.toFixed(1)}km/h`;
    },
    [unit]
  );

  const formatClock = useCallback(
    (isoOrDate: string | Date) => {
      const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
      if (isNaN(d.getTime())) return "--:--";
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: timeFormat === "12h",
      });
    },
    [timeFormat]
  );

  // ---------------------------------------------------------------------------
  // Load Saved Preferences on Mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load saved unit
    const savedUnit = localStorage.getItem("weather_temp_unit");
    if (savedUnit === "metric" || savedUnit === "imperial") {
      setUnit(savedUnit);
    }

    // Load saved time format
    const savedTimeFormat = localStorage.getItem("weather_time_format");
    if (savedTimeFormat === "12h" || savedTimeFormat === "24h") {
      setTimeFormat(savedTimeFormat);
    }

    // Load saved ambient fx
    const savedFx = localStorage.getItem("weather_ambient_fx");
    if (savedFx !== null) {
      setAmbientFxEnabled(savedFx === "true");
    }

    // Load saved favorites
    const savedFavs = localStorage.getItem("weather_favorite_cities");
    if (savedFavs) {
      try {
        const parsed = JSON.parse(savedFavs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFavorites(parsed);
        }
      } catch (err) {
        console.warn("Could not parse saved favorites:", err);
      }
    }

    // Load saved city
    const savedCity = localStorage.getItem("weather_selected_city");
    if (savedCity) {
      try {
        const parsed = JSON.parse(savedCity);
        if (parsed.lat && parsed.lon && parsed.name) {
          setCurrentCity(parsed);
          setCityList((prev) => {
            if (!prev.some((c) => c.name.toLowerCase() === parsed.name.toLowerCase())) {
              return [parsed, ...prev];
            }
            return prev;
          });
          return;
        }
      } catch (err) {
        console.warn("Could not parse saved city:", err);
      }
    }
  }, []);

  // Preference Handlers
  const handleToggleUnit = (newUnit: "metric" | "imperial") => {
    setUnit(newUnit);
    if (typeof window !== "undefined") {
      localStorage.setItem("weather_temp_unit", newUnit);
    }
  };

  const handleToggleTimeFormat = (newFormat: "12h" | "24h") => {
    setTimeFormat(newFormat);
    if (typeof window !== "undefined") {
      localStorage.setItem("weather_time_format", newFormat);
    }
  };

  const handleToggleAmbientFx = () => {
    setAmbientFxEnabled((prev) => {
      const nextVal = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("weather_ambient_fx", String(nextVal));
      }
      return nextVal;
    });
  };

  const handleSelectCity = (city: CityLocation) => {
    setCurrentCity(city);
    setIsLocationDropdownOpen(false);
    setSearchQuery("");
    setSearchResults([]);

    setCityList((prev) => {
      if (!prev.some((c) => c.name.toLowerCase() === city.name.toLowerCase())) {
        return [city, ...prev];
      }
      return prev;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("weather_selected_city", JSON.stringify(city));
    }
  };

  // City Favorites Handlers
  const isCurrentCityFavorite = useMemo(() => {
    return favorites.some((f) => f.name.toLowerCase() === currentCity.name.toLowerCase());
  }, [favorites, currentCity]);

  const handleToggleFavorite = () => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.name.toLowerCase() === currentCity.name.toLowerCase());
      let nextFavs: CityLocation[];
      if (exists) {
        nextFavs = prev.filter((f) => f.name.toLowerCase() !== currentCity.name.toLowerCase());
      } else {
        nextFavs = [currentCity, ...prev];
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("weather_favorite_cities", JSON.stringify(nextFavs));
      }
      return nextFavs;
    });
  };

  const handleRemoveFavorite = (e: React.MouseEvent, favToRemove: CityLocation) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const nextFavs = prev.filter((f) => f.name.toLowerCase() !== favToRemove.name.toLowerCase());
      if (typeof window !== "undefined") {
        localStorage.setItem("weather_favorite_cities", JSON.stringify(nextFavs));
      }
      return nextFavs;
    });
  };

  // ---------------------------------------------------------------------------
  // Smart Meteorological Insights Computer
  // ---------------------------------------------------------------------------
  const computeSmartInsights = useCallback(
    (
      current: {
        tempC: number;
        feelsLikeC: number;
        wmoCode: number;
        windSpeedKmh: number;
        humidityPercent: number;
        isDay: boolean;
        precipitation: number;
      },
      dailyFirst: {
        maxTempC: number;
        minTempC: number;
        precipProbMaxPercent: number;
        uvIndexMax: number;
      }
    ): SmartInsights => {
      // 1. Weather Alert
      let alert: WeatherAlert;
      if (current.wmoCode >= 95) {
        alert = {
          level: "severe",
          title: "Thunderstorm & Lightning Warning",
          detail: "Active severe convective thunderstorm with heavy rainfall and lightning risk. Remain indoors.",
        };
      } else if (current.windSpeedKmh > 45) {
        alert = {
          level: "warning",
          title: "High Wind / Gale Advisory",
          detail: `Gusts reaching ${current.windSpeedKmh.toFixed(0)} km/h. Secure loose outdoor objects.`,
        };
      } else if (dailyFirst.precipProbMaxPercent > 75 || current.precipitation > 5) {
        alert = {
          level: "warning",
          title: "Heavy Precipitation Watch",
          detail: `High probability of continuous showers (${dailyFirst.precipProbMaxPercent}%). Reduced road traction.`,
        };
      } else if (current.tempC > 34) {
        alert = {
          level: "warning",
          title: "Excessive Heat Advisory",
          detail: "High temperatures observed. Stay hydrated and avoid strenuous midday outdoor activity.",
        };
      } else if (current.tempC < 0) {
        alert = {
          level: "warning",
          title: "Freeze / Frost Advisory",
          detail: "Sub-zero temperatures. Watch for ice formations on walkways and roadways.",
        };
      } else if (dailyFirst.uvIndexMax >= 7) {
        alert = {
          level: "warning",
          title: "High UV Radiation Index",
          detail: `UV peak at ${dailyFirst.uvIndexMax.toFixed(0)}. Sun protection is strongly advised between 10am and 4pm.`,
        };
      } else {
        alert = {
          level: "normal",
          title: "Optimal Atmospheric Conditions",
          detail: "No severe weather hazards detected. Clear air quality and stable barometric pressure.",
        };
      }

      // 2. Clothing Advice
      let headline = "Comfortable everyday attire suitable for mild conditions.";
      const tags: { text: string; icon: string }[] = [];

      if (current.feelsLikeC < 5) {
        headline = "Heavy winter outerwear and thermal layers strongly recommended.";
        tags.push({ text: "Heavy Winter Coat", icon: "🧥" });
        tags.push({ text: "Thermal Underlayer", icon: "🧣" });
        tags.push({ text: "Gloves & Beanie", icon: "🧤" });
      } else if (current.feelsLikeC < 14) {
        headline = "Cool breeze expected. Layer with a sweater or warm jacket.";
        tags.push({ text: "Warm Jacket", icon: "🧥" });
        tags.push({ text: "Knit Sweater", icon: "🧶" });
        tags.push({ text: "Denim / Chinos", icon: "👖" });
      } else if (current.feelsLikeC < 23) {
        headline = "Pleasantly mild temperatures. Ideal for light clothing.";
        tags.push({ text: "Long-Sleeve / Tee", icon: "👕" });
        tags.push({ text: "Light Cardigan", icon: "👔" });
        tags.push({ text: "Comfortable Sneakers", icon: "👟" });
      } else {
        headline = "Warm conditions. Wear breathable fabrics and sunglasses.";
        tags.push({ text: "Breathable T-Shirt", icon: "🎽" });
        tags.push({ text: "Shorts or Linens", icon: "🩳" });
        tags.push({ text: "UV Sunglasses", icon: "🕶️" });
      }

      if (dailyFirst.precipProbMaxPercent > 35 || current.wmoCode >= 50) {
        tags.unshift({ text: "Carry Umbrella", icon: "☂️" });
        tags.push({ text: "Waterproof Shoes", icon: "🥾" });
      }
      if (current.windSpeedKmh > 25) {
        tags.push({ text: "Windbreaker", icon: "🌬️" });
      }

      // 3. Outdoor Activities Index
      const activities: ActivityRating[] = [];

      // Running / Jogging
      if (current.wmoCode >= 95 || current.tempC > 32 || current.tempC < -2 || dailyFirst.precipProbMaxPercent > 70) {
        activities.push({ name: "Running & Jogging", icon: "🏃", score: "Poor", rationale: "Rain or extreme temperatures present risk." });
      } else if (current.tempC >= 10 && current.tempC <= 21 && dailyFirst.precipProbMaxPercent < 30) {
        activities.push({ name: "Running & Jogging", icon: "🏃", score: "Great", rationale: "Crisp temperature and dry ground." });
      } else {
        activities.push({ name: "Running & Jogging", icon: "🏃", score: "Good", rationale: "Acceptable conditions; stay hydrated." });
      }

      // Cycling
      if (current.windSpeedKmh > 35 || dailyFirst.precipProbMaxPercent > 60 || current.wmoCode >= 60) {
        activities.push({ name: "Cycling & Commuting", icon: "🚴", score: "Poor", rationale: "High crosswinds or wet asphalt." });
      } else if (current.windSpeedKmh < 18 && dailyFirst.precipProbMaxPercent < 20) {
        activities.push({ name: "Cycling & Commuting", icon: "🚴", score: "Great", rationale: "Light breeze and dry road surface." });
      } else {
        activities.push({ name: "Cycling & Commuting", icon: "🚴", score: "Fair", rationale: "Moderate winds; exercise caution." });
      }

      // Outdoor Dining
      if (current.tempC >= 18 && current.tempC <= 28 && dailyFirst.precipProbMaxPercent < 20 && current.windSpeedKmh < 22) {
        activities.push({ name: "Outdoor Dining & Cafe", icon: "☕", score: "Great", rationale: "Warm, calm, and dry atmosphere." });
      } else if (current.tempC < 13 || dailyFirst.precipProbMaxPercent > 40 || current.windSpeedKmh > 30) {
        activities.push({ name: "Outdoor Dining & Cafe", icon: "☕", score: "Poor", rationale: "Chilly breeze or precipitation risk." });
      } else {
        activities.push({ name: "Outdoor Dining & Cafe", icon: "☕", score: "Fair", rationale: "Tolerable with patio heaters or light coat." });
      }

      // Stargazing / Night Walk
      if (current.wmoCode <= 1 && dailyFirst.precipProbMaxPercent < 15) {
        activities.push({ name: "Stargazing & Night Sky", icon: "🔭", score: "Great", rationale: "Clear skies and minimal cloud interference." });
      } else if (current.wmoCode >= 3 || dailyFirst.precipProbMaxPercent > 50) {
        activities.push({ name: "Stargazing & Night Sky", icon: "🔭", score: "Poor", rationale: "Dense overcast blocks celestial visibility." });
      } else {
        activities.push({ name: "Stargazing & Night Sky", icon: "🔭", score: "Good", rationale: "Partially clear sky with open intervals." });
      }

      return {
        alert,
        clothing: { headline, tags: tags.slice(0, 5) },
        activities,
      };
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Fetch Real-Time Weather from Open-Meteo
  // ---------------------------------------------------------------------------
  const fetchWeatherData = useCallback(
    async (lat: number, lon: number) => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=auto&forecast_days=7`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Open-Meteo API returned status ${res.status}`);
        }

        const data = await res.json();

        // 1. Current Weather
        const current = data.current;
        const parsedCurrentWmo = parseWmoCode(current.weather_code);
        const now = new Date();
        const formattedDate = now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        setCurrentWeather({
          tempC: current.temperature_2m,
          feelsLikeC: current.apparent_temperature,
          conditionTitle: parsedCurrentWmo.title,
          conditionDescription: parsedCurrentWmo.description,
          wmoCode: current.weather_code,
          iconType: parsedCurrentWmo.iconType,
          windSpeedKmh: current.wind_speed_10m,
          windDirectionDeg: current.wind_direction_10m,
          humidityPercent: current.relative_humidity_2m,
          surfacePressureHpa: current.surface_pressure,
          isDay: current.is_day === 1,
          dateStr: formattedDate,
        });

        // 2. Hourly Forecast (next 24 hours starting from current hour)
        if (data.hourly && Array.isArray(data.hourly.time)) {
          const currentIsoHour = now.toISOString().slice(0, 13);
          let startIdx = data.hourly.time.findIndex((t: string) => t.startsWith(currentIsoHour));
          if (startIdx === -1) startIdx = 0;

          const hourlySlice: HourlyDataPoint[] = data.hourly.time
            .slice(startIdx, startIdx + 24)
            .map((timeStr: string, idx: number) => {
              const globalIdx = startIdx + idx;
              const dateObj = new Date(timeStr);
              const hourFormatted = dateObj.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: timeFormat === "12h",
              });
              const code = data.hourly.weather_code[globalIdx] || 0;
              const parsed = parseWmoCode(code);

              return {
                timeISO: timeStr,
                timeStr: hourFormatted,
                tempC: data.hourly.temperature_2m[globalIdx] ?? 16,
                precipProbPercent: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[globalIdx] ?? 0 : 0,
                precipMm: data.hourly.precipitation ? data.hourly.precipitation[globalIdx] ?? 0 : 0,
                wmoCode: code,
                iconType: parsed.iconType,
                conditionTitle: parsed.title,
              };
            });

          setAllHourly(hourlySlice);
          setHourlyPageIndex(0);
          setSelectedHourLocalIdx(0);
        }

        // 3. 7-Day Daily Forecast
        if (data.daily && Array.isArray(data.daily.time)) {
          const days: DailyForecastDay[] = data.daily.time.slice(0, 7).map((dayIso: string, i: number) => {
            const dateObj = new Date(dayIso + "T12:00:00");
            const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const code = data.daily.weather_code[i] ?? 0;
            const parsed = parseWmoCode(code);
            const maxT = data.daily.temperature_2m_max[i] ?? 20;
            const minT = data.daily.temperature_2m_min[i] ?? 10;
            const avgT = Math.round((maxT + minT) / 2);
            const precipMax = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] ?? 0 : 0;
            const sunriseIso = data.daily.sunrise ? data.daily.sunrise[i] : "";
            const sunsetIso = data.daily.sunset ? data.daily.sunset[i] : "";
            const uvMax = data.daily.uv_index_max ? data.daily.uv_index_max[i] ?? 5 : 5;

            return {
              dayName,
              dateStr,
              wmoCode: code,
              conditionTitle: parsed.title,
              iconType: parsed.iconType,
              maxTempC: maxT,
              minTempC: minT,
              avgTempC: avgT,
              precipProbMaxPercent: precipMax,
              sunriseIso,
              sunsetIso,
              uvIndexMax: uvMax,
            };
          });

          setDailyDays(days);
          setSelectedDayIdx(0);

          // 4. Solar Widget Computation (Sunrise, Sunset, Progress)
          if (days[0] && days[0].sunriseIso && days[0].sunsetIso) {
            const srDate = new Date(days[0].sunriseIso);
            const ssDate = new Date(days[0].sunsetIso);
            const srMs = srDate.getTime();
            const ssMs = ssDate.getTime();
            const nowMs = now.getTime();

            const daylightDiffMs = Math.max(0, ssMs - srMs);
            const daylightHours = Math.floor(daylightDiffMs / (1000 * 60 * 60));
            const daylightMins = Math.floor((daylightDiffMs % (1000 * 60 * 60)) / (1000 * 60));

            let sunProgress = 0;
            if (nowMs <= srMs) {
              sunProgress = 0;
            } else if (nowMs >= ssMs) {
              sunProgress = 100;
            } else {
              sunProgress = Math.min(100, Math.max(0, Math.round(((nowMs - srMs) / daylightDiffMs) * 100)));
            }

            setSunData({
              sunriseStr: formatClock(srDate),
              sunsetStr: formatClock(ssDate),
              daylightDurationStr: `${daylightHours}h ${daylightMins}m`,
              sunProgressPercent: sunProgress,
              isDay: nowMs >= srMs && nowMs <= ssMs,
            });
          }

          // 5. Smart Insights
          if (days[0]) {
            const insights = computeSmartInsights(
              {
                tempC: current.temperature_2m,
                feelsLikeC: current.apparent_temperature,
                wmoCode: current.weather_code,
                windSpeedKmh: current.wind_speed_10m,
                humidityPercent: current.relative_humidity_2m,
                isDay: current.is_day === 1,
                precipitation: current.precipitation || 0,
              },
              {
                maxTempC: days[0].maxTempC,
                minTempC: days[0].minTempC,
                precipProbMaxPercent: days[0].precipProbMaxPercent,
                uvIndexMax: days[0].uvIndexMax,
              }
            );
            setSmartInsights(insights);
          }
        }
      } catch (err: unknown) {
        console.error("Open-Meteo fetch failed:", err);
        const msg = err instanceof Error ? err.message : "Network error";
        setErrorMsg(`Failed to fetch live weather: ${msg}. Click refresh or check connection.`);
      } finally {
        setLoading(false);
      }
    },
    [computeSmartInsights, formatClock, timeFormat]
  );

  // Fetch when city changes
  useEffect(() => {
    fetchWeatherData(currentCity.lat, currentCity.lon);
  }, [currentCity, fetchWeatherData]);

  // ---------------------------------------------------------------------------
  // City Search with Auto-Complete (Open-Meteo Geocoding)
  // ---------------------------------------------------------------------------
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearchingCities(false);
      return;
    }

    setIsSearchingCities(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          val.trim()
        )}&count=6&language=en&format=json`;
        const res = await fetch(geoUrl);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        if (data.results && Array.isArray(data.results)) {
          const mapped: CityLocation[] = data.results.map((r: {
            name: string;
            admin1?: string;
            country?: string;
            country_code?: string;
            latitude: number;
            longitude: number;
          }) => ({
            name: r.name,
            region: r.admin1,
            country: r.country || "",
            countryCode: r.country_code,
            lat: r.latitude,
            lon: r.longitude,
          }));
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn("Geocoding lookup error:", err);
        setSearchResults([]);
      } finally {
        setIsSearchingCities(false);
      }
    }, 280);
  };

  // ---------------------------------------------------------------------------
  // Browser Geolocation Detection with Reverse Geocoding
  // ---------------------------------------------------------------------------
  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser. Use the search bar to find your city.");
      return;
    }

    setLoading(true);
    setIsLocationDropdownOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            const cityName = revData.locality || revData.city || "Current Location";
            const region = revData.principalSubdivision || "";
            const country = revData.countryName || "";

            const detectedCity: CityLocation = {
              name: cityName,
              region: region,
              country: country,
              countryCode: revData.countryCode,
              lat: latitude,
              lon: longitude,
            };

            handleSelectCity(detectedCity);
            return;
          }
        } catch (err) {
          console.warn("Reverse geocode failed, using coordinates:", err);
        }

        const fallbackCity: CityLocation = {
          name: "My Location",
          country: "GPS Coordinates",
          lat: latitude,
          lon: longitude,
        };
        handleSelectCity(fallbackCity);
      },
      (err) => {
        setLoading(false);
        console.warn("Geolocation denied or error:", err);
        setErrorMsg("Location access denied or unavailable. Please search for your city above.");
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    if (isLocationDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isLocationDropdownOpen]);

  // ---------------------------------------------------------------------------
  // Active Hourly Window & Smooth SVG Bezier Spline Computation
  // ---------------------------------------------------------------------------
  const visibleHourly = useMemo(() => {
    const start = hourlyPageIndex * 8;
    return allHourly.slice(start, start + 8);
  }, [allHourly, hourlyPageIndex]);

  const maxHourlyPages = useMemo(() => {
    return Math.max(1, Math.ceil(allHourly.length / 8));
  }, [allHourly]);

  // Compute smooth cubic bezier spline curve for Temperature or Precipitation
  const splineData = useMemo(() => {
    if (visibleHourly.length < 2) return null;

    const width = 820;
    const height = 90;
    const paddingX = 35;
    const effectiveWidth = width - paddingX * 2;

    if (forecastMetric === "precip") {
      // Precipitation Probability curve (0 to 100%)
      const points = visibleHourly.map((node, i) => {
        const x = paddingX + (i / (visibleHourly.length - 1)) * effectiveWidth;
        const normalized = Math.min(100, Math.max(0, node.precipProbPercent)) / 100;
        const y = height - 20 - normalized * 50;
        return { x, y, value: node.precipProbPercent };
      });

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cx = (p0.x + p1.x) / 2;
        d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      // Area fill path down to baseline
      const areaPath = `${d} L ${points[points.length - 1].x} ${height - 10} L ${points[0].x} ${height - 10} Z`;

      return { d, areaPath, points, metric: "precip" as const };
    }

    // Temperature spline curve
    const temps = visibleHourly.map((h) => h.tempC);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const rangeT = maxT - minT || 1;

    const points = visibleHourly.map((node, i) => {
      const x = paddingX + (i / (visibleHourly.length - 1)) * effectiveWidth;
      const normalized = (node.tempC - minT) / rangeT;
      const y = height - 25 - normalized * 40;
      return { x, y, value: node.tempC };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    return { d, areaPath: null, points, metric: "temp" as const };
  }, [visibleHourly, forecastMetric]);

  // Handle selecting an hour on the timeline
  const activeSelectedHour = useMemo(() => {
    if (visibleHourly.length === 0) return null;
    return visibleHourly[selectedHourLocalIdx] || visibleHourly[0];
  }, [visibleHourly, selectedHourLocalIdx]);

  // Hero Display Values
  const displayHeroTemp = useMemo(() => {
    if (activeSelectedHour) {
      return formatTemp(activeSelectedHour.tempC);
    }
    return currentWeather ? formatTemp(currentWeather.tempC) : 16;
  }, [activeSelectedHour, currentWeather, formatTemp]);

  const displayHeroCondition = useMemo(() => {
    if (activeSelectedHour) {
      return activeSelectedHour.conditionTitle;
    }
    return currentWeather?.conditionTitle || "Storm with Rain";
  }, [activeSelectedHour, currentWeather]);

  const displayHeroIconType = useMemo(() => {
    if (activeSelectedHour) {
      return activeSelectedHour.iconType;
    }
    return currentWeather?.iconType || "storm";
  }, [activeSelectedHour, currentWeather]);

  return (
    <div className={styles.pageBackground}>
      {/* Dynamic Ambient Canvas Weather Backdrop */}
      <WeatherBackdrop
        iconType={displayHeroIconType}
        isDay={currentWeather?.isDay ?? true}
        enabled={ambientFxEnabled}
      />

      {/* Discreet Utility Navigation Bar */}
      <nav className={styles.utilityBar}>
        <Link href="/" className={styles.utilityBackLink}>
          <span className={styles.backArrow}>←</span>
          <span>Prototypes Home</span>
        </Link>

        {/* View Switcher: Dashboard vs 3D World Globe */}
        <div className={styles.viewSwitcherPill}>
          <button
            type="button"
            onClick={() => setActiveView("dashboard")}
            className={`${styles.viewSwitcherOption} ${activeView === "dashboard" ? styles.viewSwitcherOptionActive : ""}`}
            title="Switch to Dark Tablet Dashboard"
          >
            <span>🌦️ Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("globe")}
            className={`${styles.viewSwitcherOption} ${activeView === "globe" ? styles.viewSwitcherOptionActive : ""}`}
            title="Switch to Interactive Three.js 3D World Globe"
          >
            <span>🌍 3D World Globe</span>
          </button>
        </div>

        <div className={styles.utilityControls}>
          {/* Ambient FX Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleAmbientFx}
            className={`${styles.ambientToggleBtn} ${ambientFxEnabled ? styles.ambientToggleBtnActive : ""}`}
            title="Toggle Dynamic Ambient Weather Canvas FX"
          >
            <span>✨ FX: {ambientFxEnabled ? "On" : "Off"}</span>
          </button>

          {/* 12h / 24h Time Format Toggle Switch */}
          <div className={styles.timeFormatPill}>
            <button
              type="button"
              onClick={() => handleToggleTimeFormat("12h")}
              className={`${styles.timeFormatOption} ${timeFormat === "12h" ? styles.timeFormatOptionActive : ""}`}
              aria-label="12-Hour Clock"
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => handleToggleTimeFormat("24h")}
              className={`${styles.timeFormatOption} ${timeFormat === "24h" ? styles.timeFormatOptionActive : ""}`}
              aria-label="24-Hour Clock"
            >
              24h
            </button>
          </div>

          {/* Functional Unit Toggle Switch */}
          <div className={styles.unitPill}>
            <button
              type="button"
              onClick={() => handleToggleUnit("metric")}
              className={`${styles.unitOption} ${unit === "metric" ? styles.unitOptionActive : ""}`}
              aria-label="Switch to Celsius"
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => handleToggleUnit("imperial")}
              className={`${styles.unitOption} ${unit === "imperial" ? styles.unitOptionActive : ""}`}
              aria-label="Switch to Fahrenheit"
            >
              °F
            </button>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => fetchWeatherData(currentCity.lat, currentCity.lon)}
            className={styles.refreshBtn}
            title="Refresh live data from Open-Meteo"
            disabled={loading}
          >
            {loading ? "⟳ Syncing..." : "⟳ Refresh"}
          </button>
        </div>
      </nav>

      {/* Main Sleek Dark Tablet Frame */}
      <div className={styles.tabletFrame}>
        {/* ================================================================= */}
        {/* Top Header: Location, Star Favorite, Search & Date               */}
        {/* ================================================================= */}
        <header className={styles.topHeader}>
          <div className={styles.locationSelectorWrap} ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
              className={styles.locationButton}
              title="Click to search city or detect location"
            >
              <span className={styles.locationPinIcon}>📍</span>
              <span className={styles.locationText}>
                {currentCity.name}
                {currentCity.region ? `, ${currentCity.region}` : ""}
                {currentCity.country ? `, ${currentCity.country}` : ""}
              </span>
              <span className={styles.chevronIcon}>⌄</span>
            </button>

            {/* Favorite Pin Star Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`${styles.favoriteStarBtn} ${isCurrentCityFavorite ? styles.favoriteStarBtnActive : ""}`}
              title={isCurrentCityFavorite ? "Remove from favorite cities" : "Pin to favorite cities"}
              aria-label="Favorite City"
            >
              {isCurrentCityFavorite ? "★" : "☆"}
            </button>

            <span className={styles.dateStamp}>
              ({currentWeather?.dateStr || "Friday, October 16"})
            </span>

            {/* City Search & Geolocation Popover */}
            {isLocationDropdownOpen && (
              <div className={styles.locationPopover}>
                <div className={styles.popoverHeader}>
                  <span>Search Location</span>
                  <button
                    type="button"
                    onClick={() => setIsLocationDropdownOpen(false)}
                    className={styles.popoverCloseBtn}
                  >
                    ✕
                  </button>
                </div>

                {/* GPS Current Location Option */}
                <button
                  type="button"
                  onClick={handleDetectGPSLocation}
                  className={styles.gpsDetectOption}
                  disabled={loading}
                >
                  <span className={styles.gpsIcon}>🎯</span>
                  <span className={styles.gpsLabel}>Use Exact Current Location (GPS)</span>
                </button>

                {/* Search Input Bar */}
                <div className={styles.searchInputWrap}>
                  <input
                    type="text"
                    placeholder="Search any global city (e.g. Tokyo, Paris, London)..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className={styles.popoverInput}
                    autoFocus
                  />
                  {isSearchingCities && <span className={styles.inputSpinner}>⟳</span>}
                </div>

                {/* Search Results Dropdown List */}
                {searchResults.length > 0 && (
                  <ul className={styles.searchResultsList}>
                    {searchResults.map((city, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className={styles.searchResultItem}
                        >
                          <span className={styles.resultCityName}>{city.name}</span>
                          <span className={styles.resultCountry}>
                            {city.region ? `${city.region}, ` : ""}
                            {city.country}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Popular Quick Cities */}
                <div className={styles.popularCitiesSection}>
                  <span className={styles.popularCitiesLabel}>Popular Destinations:</span>
                  <div className={styles.popularCitiesRow}>
                    {GLOBAL_BEACON_CITIES.slice(0, 6).map((beacon, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => handleSelectCity(beacon)}
                        className={styles.popularCityChip}
                      >
                        {beacon.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Favorite Cities Shelf */}
        {favorites.length > 0 && (
          <div className={styles.favoriteShelf}>
            <span className={styles.favoriteShelfLabel}>
              <span>★</span> Favorites:
            </span>
            {favorites.map((fav, fIdx) => {
              const isActive = fav.name.toLowerCase() === currentCity.name.toLowerCase();
              return (
                <div
                  key={fIdx}
                  onClick={() => handleSelectCity(fav)}
                  className={`${styles.favoriteChip} ${isActive ? styles.favoriteChipActive : ""}`}
                  title={`Switch to ${fav.name}, ${fav.country}`}
                >
                  <span className={styles.favoriteChipCity}>{fav.name}</span>
                  {fav.countryCode && <span className={styles.favoriteChipCountry}>{fav.countryCode}</span>}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFavorite(e, fav)}
                    className={styles.favoriteRemoveBtn}
                    title="Remove from favorites"
                    aria-label={`Remove ${fav.name}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback / Error Notice Banner */}
        {errorMsg && (
          <div className={styles.statusBanner}>
            <span>⚠️ {errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className={styles.statusCloseBtn}
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1: THREE.JS 3D WORLD GLOBE VIEW                              */}
        {/* ================================================================= */}
        {activeView === "globe" ? (
          <section className={styles.globeViewWrapper}>
            <WorldGlobe
              cities={cityList}
              selectedCity={currentCity}
              onSelectCity={(clickedCity) => {
                handleSelectCity(clickedCity);
              }}
              tempUnit={unit}
              activeWeather={
                currentWeather
                  ? {
                      conditionTitle: displayHeroCondition,
                      tempC: currentWeather.tempC,
                      wmoCode: currentWeather.wmoCode,
                      iconType: displayHeroIconType,
                    }
                  : null
              }
            />

            {/* Floating Live Telemetry Badge for Current City */}
            <div className={styles.globeFloatingBadge}>
              <div className={styles.badgeLeft}>
                <div className={styles.badgeCityName}>
                  <span>📍</span>
                  <strong>{currentCity.name}</strong>
                  <span>({currentCity.country})</span>
                </div>
                <div className={styles.badgeWeatherDetails}>
                  <span className={styles.badgeTemp}>{displayHeroTemp}°</span>
                  <span className={styles.badgeCondition}>{displayHeroCondition}</span>
                  <span className={styles.badgeWind}>
                    💨 {currentWeather ? formatWindSpeed(currentWeather.windSpeedKmh) : ""}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
                className={styles.badgeInspectBtn}
              >
                <span>View Full Dashboard →</span>
              </button>
            </div>
          </section>
        ) : (
          /* =============================================================== */
          /* VIEW 2: ORIGINAL SLEEK DARK TABLET DASHBOARD                    */
          /* =============================================================== */
          <>
            <section className={styles.heroStage}>
              {/* Left Column: Temperature, Condition, Telemetry */}
              <div className={styles.heroLeftCol}>
                <div className={styles.temperatureDisplay}>
                  <span className={styles.tempNumber}>{displayHeroTemp}</span>
                  <span className={styles.tempDegree}>°</span>
                </div>

                <h2 className={styles.conditionTitle}>{displayHeroCondition}</h2>

                <div className={styles.telemetryRow}>
                  {/* Wind Speed */}
                  <div className={styles.telemetryItem}>
                    <div className={styles.telemetryHeader}>
                      <svg className={styles.telemetryIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className={styles.telemetryLabel}>Wind</span>
                    </div>
                    <span className={styles.telemetryValue}>
                      {currentWeather ? formatWindSpeed(currentWeather.windSpeedKmh) : "2.4km/h"}
                    </span>
                  </div>

                  {/* Relative Humidity */}
                  <div className={styles.telemetryItem}>
                    <div className={styles.telemetryHeader}>
                      <svg className={styles.telemetryIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className={styles.telemetryLabel}>Humidity</span>
                    </div>
                    <span className={styles.telemetryValue}>
                      {currentWeather ? `${currentWeather.humidityPercent}%` : "70%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Column: Dynamic Volumetric Atmospheric Visual Artwork */}
              <div className={styles.cloudVisualContainer}>
                {/* Condition 1: Thunderstorm */}
                {displayHeroIconType === "storm" && (
                  <div className={styles.volumetricCloud}>
                    <div className={styles.cloudAmberGlow} />
                    <div className={styles.cloudPuffBack} />
                    <div className={styles.cloudPuffMid} />
                    <div className={styles.cloudPuffFront} />
                    <div className={styles.lightningBolt}>
                      <svg viewBox="0 0 120 180" className={styles.lightningSvg} fill="none">
                        <defs>
                          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF2A3" />
                            <stop offset="40%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                          <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        <polygon
                          points="65,5 20,95 55,95 30,175 105,75 68,75"
                          fill="url(#boltGrad)"
                          filter="url(#boltGlow)"
                        />
                        <polygon
                          points="65,5 20,95 55,95 30,175 105,75 68,75"
                          fill="url(#boltGrad)"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Condition 2: Clear / Sunny */}
                {displayHeroIconType === "sun" && (
                  <div className={styles.sunArtworkContainer}>
                    <div className={styles.sunAuraGlow} />
                    <div className={styles.sunCoreCircle} />
                    <div className={styles.sunRayRing}>
                      <div className={styles.sunRayBeam1} />
                      <div className={styles.sunRayBeam2} />
                      <div className={styles.sunRayBeam3} />
                      <div className={styles.sunRayBeam4} />
                    </div>
                  </div>
                )}

                {/* Condition 3: Rain / Drizzle */}
                {displayHeroIconType === "rain" && (
                  <div className={styles.volumetricCloud}>
                    <div className={styles.rainCloudPuffBack} />
                    <div className={styles.cloudPuffMid} />
                    <div className={styles.cloudPuffFront} />
                    <div className={styles.rainDropsWrap}>
                      <span className={styles.rainDrop1} />
                      <span className={styles.rainDrop2} />
                      <span className={styles.rainDrop3} />
                      <span className={styles.rainDrop4} />
                      <span className={styles.rainDrop5} />
                    </div>
                  </div>
                )}

                {/* Condition 4: Snow */}
                {displayHeroIconType === "snow" && (
                  <div className={styles.volumetricCloud}>
                    <div className={styles.snowCloudGlow} />
                    <div className={styles.cloudPuffBack} />
                    <div className={styles.cloudPuffMid} />
                    <div className={styles.cloudPuffFront} />
                    <div className={styles.snowflakesWrap}>
                      <span className={styles.snowflake1}>❄</span>
                      <span className={styles.snowflake2}>✦</span>
                      <span className={styles.snowflake3}>❄</span>
                    </div>
                  </div>
                )}

                {/* Condition 5: Clouds / Overcast */}
                {displayHeroIconType === "cloud" && (
                  <div className={styles.volumetricCloud}>
                    <div className={styles.cloudPuffBack} />
                    <div className={styles.cloudPuffMid} />
                    <div className={styles.cloudPuffFront} />
                  </div>
                )}
              </div>

              {/* Right Column: Enhanced 7-Day Forecast Card */}
              <aside className={styles.forecastCard}>
                <ul className={styles.forecastList}>
                  {dailyDays.map((day, idx) => {
                    const isActive = idx === selectedDayIdx;
                    return (
                      <li
                        key={idx}
                        onClick={() => {
                          setSelectedDayIdx(idx);
                          if (currentWeather) {
                            setCurrentWeather((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    tempC: day.avgTempC,
                                    conditionTitle: day.conditionTitle,
                                    iconType: day.iconType,
                                    dateStr: `${day.dayName}, ${day.dateStr}`,
                                  }
                                : null
                            );
                          }
                        }}
                        className={`${styles.forecastItem} ${isActive ? styles.forecastItemActive : ""}`}
                        title={`Click to preview ${day.dayName}'s weather`}
                      >
                        <div className={styles.forecastItemLeft}>
                          {/* Vertical Amber Active Indicator Bar */}
                          <span
                            className={`${styles.activeLine} ${isActive ? styles.activeLineVisible : ""}`}
                          />

                          {/* Weather Icon */}
                          <span className={styles.forecastIcon}>
                            {day.iconType === "sun" ? (
                              <svg className={styles.weatherSvgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeWidth="1.8" />
                              </svg>
                            ) : day.iconType === "storm" ? (
                              <svg className={styles.weatherSvgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" strokeWidth="1.8" />
                                <path d="M13 11l-3 4h4l-2 5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : day.iconType === "rain" ? (
                              <svg className={styles.weatherSvgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 15A5 5 0 0 0 18 5h-1.26A8 8 0 1 0 4 13.25" strokeWidth="1.8" />
                                <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                            ) : day.iconType === "snow" ? (
                              <svg className={styles.weatherSvgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M19 15A5 5 0 0 0 18 5h-1.26A8 8 0 1 0 4 13.25" strokeWidth="1.8" />
                                <circle cx="8" cy="18" r="1" fill="currentColor" />
                                <circle cx="12" cy="19" r="1" fill="currentColor" />
                                <circle cx="16" cy="18" r="1" fill="currentColor" />
                              </svg>
                            ) : (
                              <svg className={styles.weatherSvgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" strokeWidth="1.8" />
                              </svg>
                            )}
                          </span>

                          {/* Day Name & Condition */}
                          <div className={styles.forecastTextCol}>
                            <span className={styles.forecastDayName}>{day.dayName}</span>
                            <span className={styles.forecastConditionText}>{day.conditionTitle}</span>
                          </div>
                        </div>

                        {/* Min / Max Range & Precipitation Probability */}
                        <div className={styles.forecastMinMaxWrap}>
                          <div className={styles.forecastMinMaxRow}>
                            <span className={styles.forecastMaxTemp}>{formatTemp(day.maxTempC)}°</span>
                            <span className={styles.forecastMinTemp}>{formatTemp(day.minTempC)}°</span>
                          </div>
                          {day.precipProbMaxPercent > 10 && (
                            <span className={styles.forecastPrecipTag}>
                              💧 {day.precipProbMaxPercent}%
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            </section>

            {/* ============================================================= */}
            {/* Middle Section: Hourly Forecast Spline Wave & Timeline       */}
            {/* ============================================================= */}
            <footer className={styles.timelineSection}>
              {/* Metric Switcher: Temperature vs Precipitation Probability */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Hourly Timeline
                </span>
                <div className={styles.metricSwitcherPill}>
                  <button
                    type="button"
                    onClick={() => setForecastMetric("temp")}
                    className={`${styles.metricOption} ${forecastMetric === "temp" ? styles.metricOptionActive : ""}`}
                    title="Display 24h Temperature Spline"
                  >
                    <span>🌡️ Temp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForecastMetric("precip")}
                    className={`${styles.metricOption} ${forecastMetric === "precip" ? styles.metricOptionActiveCyan : ""}`}
                    title="Display 24h Precipitation Probability"
                  >
                    <span>💧 Rain %</span>
                  </button>
                </div>
              </div>

              <div className={styles.splineGraphWrap}>
                {/* Dynamic Smooth SVG Cubic Bezier Spline Wave */}
                <svg
                  className={styles.splineSvg}
                  viewBox="0 0 820 90"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="precipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {splineData && (
                    <>
                      {/* Area Fill for Precipitation Probability */}
                      {splineData.areaPath && (
                        <path d={splineData.areaPath} fill="url(#precipGradient)" />
                      )}

                      {/* The Continuous Spline Wave */}
                      <path
                        d={splineData.d}
                        stroke={forecastMetric === "precip" ? "#38bdf8" : "rgba(255, 255, 255, 0.25)"}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />

                      {/* Node Dots on the Wave Curve */}
                      {splineData.points.map((pt, i) => {
                        const isActive = i === selectedHourLocalIdx;
                        return (
                          <g key={i}>
                            {isActive ? (
                              <>
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="5"
                                  fill={forecastMetric === "precip" ? "#38bdf8" : "#F59E0B"}
                                  className={styles.activeDotPulse}
                                />
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="8"
                                  stroke={forecastMetric === "precip" ? "rgba(56, 189, 248, 0.4)" : "rgba(245, 158, 11, 0.4)"}
                                  strokeWidth="1.5"
                                />
                              </>
                            ) : (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="2.5"
                                fill={forecastMetric === "precip" ? "rgba(56, 189, 248, 0.5)" : "rgba(255, 255, 255, 0.3)"}
                              />
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>

                {/* Interactive Floating Labels Above Points */}
                <div className={styles.tempPointsRow}>
                  {visibleHourly.map((hour, idx) => {
                    const isActive = idx === selectedHourLocalIdx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedHourLocalIdx(idx)}
                        className={`${styles.tempPointWrap} ${isActive ? styles.tempPointActive : ""}`}
                        title={`Click to select ${hour.timeStr} (${formatTemp(hour.tempC)}° • ${hour.precipProbPercent}% rain)`}
                      >
                        {isActive && <span className={styles.activeTopDot} />}
                        <span className={styles.hourlyTempLabel}>
                          {forecastMetric === "precip" ? `${hour.precipProbPercent}%` : `${formatTemp(hour.tempC)}°`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Labels Track & Pager Navigation */}
              <div className={styles.timeTrackRow}>
                <div className={styles.timeChipsList}>
                  {visibleHourly.map((hour, idx) => {
                    const isActive = idx === selectedHourLocalIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedHourLocalIdx(idx)}
                        className={`${styles.timeChip} ${isActive ? styles.timeChipActive : ""}`}
                      >
                        {hour.timeStr}
                      </button>
                    );
                  })}
                </div>

                {/* 8-Hour Forward / Backward Pagination */}
                <div className={styles.timelinePager}>
                  <button
                    type="button"
                    onClick={() => {
                      setHourlyPageIndex((prev) => Math.max(0, prev - 1));
                      setSelectedHourLocalIdx(0);
                    }}
                    disabled={hourlyPageIndex === 0}
                    className={styles.pagerBtn}
                    title="Previous 8 Hours"
                    aria-label="Previous 8 Hours"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHourlyPageIndex((prev) => Math.min(maxHourlyPages - 1, prev + 1));
                      setSelectedHourLocalIdx(0);
                    }}
                    disabled={hourlyPageIndex >= maxHourlyPages - 1}
                    className={styles.pagerBtn}
                    title="Next 8 Hours"
                    aria-label="Next 8 Hours"
                  >
                    ›
                  </button>
                </div>
              </div>
            </footer>

            {/* ============================================================= */}
            {/* Bottom Section: Smart Meteorological Insights Grid           */}
            {/* ============================================================= */}
            <section className={styles.insightsSection}>
              <div className={styles.insightsSectionHeader}>
                <h3 className={styles.insightsTitle}>
                  <span>🧠</span> Smart Meteorological Insights & Solar Arc
                </h3>
              </div>

              <div className={styles.insightsGrid}>
                {/* Card 1: Weather Alerts */}
                {smartInsights && (
                  <div className={styles.insightCard}>
                    <div className={styles.insightCardTop}>
                      <span className={styles.insightCardHeading}>
                        <span>🚨</span> Weather Alerts
                      </span>
                      <span
                        className={
                          smartInsights.alert.level === "severe"
                            ? styles.alertBadgeSevere
                            : smartInsights.alert.level === "warning"
                            ? styles.alertBadgeWarning
                            : styles.alertBadgeNormal
                        }
                      >
                        {smartInsights.alert.level.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.alertSummaryText}>{smartInsights.alert.title}</div>
                    <div className={styles.alertDescriptionText}>{smartInsights.alert.detail}</div>
                  </div>
                )}

                {/* Card 2: Clothing Recommendations */}
                {smartInsights && (
                  <div className={styles.insightCard}>
                    <div className={styles.insightCardTop}>
                      <span className={styles.insightCardHeading}>
                        <span>👔</span> Clothing Advice
                      </span>
                    </div>
                    <div className={styles.clothingSummaryText}>{smartInsights.clothing.headline}</div>
                    <div className={styles.clothingTagsWrap}>
                      {smartInsights.clothing.tags.map((tag, tIdx) => (
                        <span key={tIdx} className={styles.clothingTag}>
                          <span>{tag.icon}</span>
                          <span>{tag.text}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card 3: Outdoor Activities Index */}
                {smartInsights && (
                  <div className={styles.insightCard}>
                    <div className={styles.insightCardTop}>
                      <span className={styles.insightCardHeading}>
                        <span>🏃</span> Outdoor Activity Index
                      </span>
                    </div>
                    <div className={styles.activityList}>
                      {smartInsights.activities.map((act, aIdx) => (
                        <div key={aIdx} className={styles.activityRow}>
                          <div className={styles.activityLabelCol}>
                            <span className={styles.activityIconSpan}>{act.icon}</span>
                            <span className={styles.activityNameSpan}>{act.name}</span>
                          </div>
                          <span
                            className={`${styles.activityRatingBadge} ${
                              act.score === "Great"
                                ? styles.ratingGreat
                                : act.score === "Good"
                                ? styles.ratingGood
                                : act.score === "Fair"
                                ? styles.ratingFair
                                : styles.ratingPoor
                            }`}
                            title={act.rationale}
                          >
                            {act.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card 4: Sunrise & Sunset Solar Arc */}
                {sunData && (
                  <div className={styles.insightCard}>
                    <div className={styles.insightCardTop}>
                      <span className={styles.insightCardHeading}>
                        <span>☀️</span> Sun & Daylight Arc
                      </span>
                      <span className={styles.daylightBadge}>{sunData.daylightDurationStr}</span>
                    </div>

                    <div className={styles.solarWidgetBody}>
                      <div className={styles.solarArcContainer}>
                        <svg viewBox="0 0 200 65" className={styles.solarArcSvg}>
                          {/* Semicircle Dotted Horizon Arc */}
                          <path
                            d="M 20 55 A 80 40 0 0 1 180 55"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          {/* Horizon Base Line */}
                          <line
                            x1="10"
                            y1="55"
                            x2="190"
                            y2="55"
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="1"
                          />
                          {/* Solar Position Pip */}
                          {(() => {
                            const angle = Math.PI - (sunData.sunProgressPercent / 100) * Math.PI;
                            const cx = 100 + 80 * Math.cos(angle);
                            const cy = 55 - 40 * Math.sin(angle);
                            return (
                              <g>
                                <circle cx={cx} cy={cy} r="8" fill="rgba(245, 158, 11, 0.25)" />
                                <circle cx={cx} cy={cy} r="4.5" fill="#f59e0b" />
                                <circle cx={cx} cy={cy} r="2" fill="#fff" />
                              </g>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className={styles.solarTimeFooter}>
                        <div className={styles.solarTimePill}>
                          <span className={styles.solarLabelSmall}>Sunrise</span>
                          <span className={styles.solarValBold}>{sunData.sunriseStr}</span>
                        </div>
                        <div className={styles.solarTimePill}>
                          <span className={styles.solarLabelSmall}>Progress</span>
                          <span className={styles.solarValBold}>{sunData.sunProgressPercent}%</span>
                        </div>
                        <div className={styles.solarTimePill}>
                          <span className={styles.solarLabelSmall}>Sunset</span>
                          <span className={styles.solarValBold}>{sunData.sunsetStr}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
