import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  Sun,
  Sunrise,
  Sunset,
  ThermometerSun,
  Wind,
} from "lucide-react";
import {
  celsiusToFahrenheit,
  describeWeatherCode,
  formatDateLabel,
  formatHourLabel,
} from "@/lib/weather";
import { formatRelativeTime } from "@/lib/datetime";

const CITY_OPTIONS = [
  { name: "Metro Manila", latitude: 14.5995, longitude: 120.9842 },
  { name: "Baguio City", latitude: 16.4023, longitude: 120.596 },
  { name: "Cebu City", latitude: 10.3157, longitude: 123.8854 },
  { name: "Davao City", latitude: 7.1907, longitude: 125.4553 },
  { name: "Iloilo City", latitude: 10.7202, longitude: 122.5621 },
  { name: "Cagayan de Oro", latitude: 8.4542, longitude: 124.6319 },
  { name: "Zamboanga City", latitude: 6.9214, longitude: 122.079 },
  { name: "Legazpi City", latitude: 13.1391, longitude: 123.7438 },
  { name: "Puerto Princesa", latitude: 9.7392, longitude: 118.7353 },
  { name: "Tacloban City", latitude: 11.243, longitude: 125.0048 },
  { name: "General Santos", latitude: 6.1164, longitude: 125.1716 },
  { name: "Bacolod City", latitude: 10.6765, longitude: 122.9509 },
];

const FORECAST_LENGTH_OPTIONS = [5, 10, 14];

const WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast";

const iconForVariant = (variant) => {
  switch (variant) {
    case "clear":
      return Sun;
    case "partly":
      return CloudSun;
    case "cloudy":
      return Cloud;
    case "fog":
      return CloudFog;
    case "drizzle":
      return CloudDrizzle;
    case "rain":
      return CloudRain;
    case "snow":
      return Cloud;
    case "thunder":
      return CloudLightning;
    default:
      return Cloud;
  }
};

const formatTemperature = (value, unit) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "–";
  }
  const temp = unit === "f" ? celsiusToFahrenheit(value) : value;
  return `${Math.round(temp)}°${unit.toUpperCase()}`;
};

const buildQuery = (city) => {
  const params = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weathercode,wind_speed_10m,wind_direction_10m",
    hourly:
      "temperature_2m,precipitation_probability,weathercode,relative_humidity_2m,wind_speed_10m",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,sunrise,sunset",
    timezone: "Asia/Manila",
  });

  return `${WEATHER_API_BASE}?${params.toString()}`;
};

export default function WeatherSection() {
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);
  const [unit, setUnit] = useState("c");
  const [forecastLength, setForecastLength] = useState(
    FORECAST_LENGTH_OPTIONS[0]
  );
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState({
    current: null,
    hourly: [],
    daily: [],
    timezone: "Asia/Manila",
    fetchedAt: null,
  });

  const filteredCities = useMemo(() => {
    if (!query.trim()) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((city) =>
      city.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [query]);

  const fetchWeather = useCallback(async () => {
    setStatus((prev) => (prev === "success" ? "refreshing" : "loading"));
    setError(null);

    try {
      const response = await fetch(buildQuery(selectedCity));
      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
      }

      const payload = await response.json();

      const hourly = (payload.hourly?.time ?? []).map((time, index) => ({
        time,
        temperature: payload.hourly?.temperature_2m?.[index] ?? null,
        precipitationProbability:
          payload.hourly?.precipitation_probability?.[index] ?? null,
        weatherCode: payload.hourly?.weathercode?.[index] ?? null,
        humidity: payload.hourly?.relative_humidity_2m?.[index] ?? null,
        windSpeed: payload.hourly?.wind_speed_10m?.[index] ?? null,
      }));

      const daily = (payload.daily?.time ?? []).map((time, index) => ({
        date: time,
        temperatureMax: payload.daily?.temperature_2m_max?.[index] ?? null,
        temperatureMin: payload.daily?.temperature_2m_min?.[index] ?? null,
        precipitationProbability:
          payload.daily?.precipitation_probability_max?.[index] ?? null,
        weatherCode: payload.daily?.weathercode?.[index] ?? null,
        sunrise: payload.daily?.sunrise?.[index] ?? null,
        sunset: payload.daily?.sunset?.[index] ?? null,
      }));

      setWeather({
        current: payload.current ?? null,
        hourly,
        daily,
        timezone: payload.timezone ?? "Asia/Manila",
        fetchedAt: new Date(),
      });
      setStatus("success");
    } catch (err) {
      console.error("Failed to fetch weather data", err);
      setError(err);
      setStatus("error");
    }
  }, [selectedCity]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 1000 * 60 * 10);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    if (!pickerOpen) {
      setQuery(selectedCity.name);
    }
  }, [selectedCity, pickerOpen]);

  const currentDescriptor = useMemo(() => {
    const code = weather.current?.weathercode;
    return describeWeatherCode(code);
  }, [weather.current]);

  const WeatherIcon = iconForVariant(currentDescriptor.variant);

  const sunriseTime = weather.daily?.[0]?.sunrise
    ? new Date(weather.daily[0].sunrise)
    : null;
  const sunsetTime = weather.daily?.[0]?.sunset
    ? new Date(weather.daily[0].sunset)
    : null;

  const hourlySlice = weather.hourly.slice(0, 12);
  const dailySlice = weather.daily.slice(0, forecastLength);

  const lastUpdatedLabel = useMemo(() => {
    if (status === "loading" && !weather.fetchedAt) {
      return "Fetching weather telemetry…";
    }
    if (status === "error") {
      return "Weather source unavailable — showing last cached data";
    }
    if (!weather.fetchedAt) {
      return "Monitoring";
    }
    return `Updated ${formatRelativeTime(weather.fetchedAt, {
      short: true,
    })}`;
  }, [status, weather.fetchedAt]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-xs text-foreground/60">
              <MapPin className="h-4 w-4" />
              {selectedCity.name}, Philippines
            </div>
            <h1 className="text-2xl font-semibold">
              Philippines Weather Console
            </h1>
            <p className="text-sm text-foreground/60">
              Powered by the Open-Meteo public weather service, refreshed every
              10 minutes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-sm shadow-sm">
                <Search className="h-4 w-4 text-foreground/60" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPickerOpen(true);
                  }}
                  onFocus={() => setPickerOpen(true)}
                  placeholder="Search a Philippine city"
                  className="w-48 bg-transparent text-sm text-foreground focus:outline-none"
                />
              </div>
              {pickerOpen && (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-border/60 bg-card/90 backdrop-blur">
                  <ul className="max-h-52 overflow-y-auto text-sm">
                    {filteredCities.map((city) => (
                      <li
                        key={city.name}
                        className="flex cursor-pointer items-center justify-between px-3 py-2 text-foreground/80 transition hover:bg-primary/10 hover:text-primary"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSelectedCity(city);
                          setQuery(city.name);
                          setPickerOpen(false);
                        }}
                      >
                        {city.name}
                      </li>
                    ))}
                    {!filteredCities.length && (
                      <li className="px-3 py-2 text-xs text-foreground/50">
                        No matches found
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="inline-flex rounded-full border border-border/60 bg-card/60 p-1 text-xs shadow-sm">
              {["c", "f"].map((value) => (
                <button
                  key={value}
                  onClick={() => setUnit(value)}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    unit === value
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/60 hover:text-primary"
                  }`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-full border border-border/60 bg-card/60 p-1 text-xs shadow-sm">
              {FORECAST_LENGTH_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => setForecastLength(value)}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    forecastLength === value
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/60 hover:text-primary"
                  }`}
                >
                  {value} days
                </button>
              ))}
            </div>
            <button
              onClick={fetchWeather}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/50">
          {status === "loading" && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing live
              weather…
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1">
            <Gauge className="h-3.5 w-3.5" /> {lastUpdatedLabel}
          </span>
        </div>

        {status === "error" && (
          <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-400">
            Weather service is temporarily unavailable. Showing cached records
            from the last successful refresh.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <WeatherIcon className="h-10 w-10" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground/60">
                      Current Conditions
                    </p>
                    <p className="text-4xl font-semibold text-foreground">
                      {formatTemperature(weather.current?.temperature_2m, unit)}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {currentDescriptor.label}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-foreground/70">
                  <DataPoint
                    icon={ThermometerSun}
                    label="Feels like"
                    value={formatTemperature(
                      weather.current?.apparent_temperature,
                      unit
                    )}
                  />
                  <DataPoint
                    icon={Droplets}
                    label="Humidity"
                    value={
                      weather.current?.relative_humidity_2m != null
                        ? `${weather.current.relative_humidity_2m}%`
                        : "–"
                    }
                  />
                  <DataPoint
                    icon={CloudRain}
                    label="Rain"
                    value={
                      weather.current?.rain != null
                        ? `${weather.current.rain} mm`
                        : "–"
                    }
                  />
                  <DataPoint
                    icon={Wind}
                    label="Wind"
                    value={
                      weather.current?.wind_speed_10m != null
                        ? `${Math.round(weather.current.wind_speed_10m)} km/h`
                        : "–"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Next 12 hours
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Hourly forecast in {selectedCity.name}.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {hourlySlice.map((entry) => {
                  const descriptor = describeWeatherCode(entry.weatherCode);
                  const Icon = iconForVariant(descriptor.variant);
                  return (
                    <div
                      key={entry.time}
                      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-foreground/60">
                        <span>
                          {formatHourLabel(
                            new Date(entry.time),
                            weather.timezone
                          )}
                        </span>
                        <span>
                          {entry.precipitationProbability != null
                            ? `${entry.precipitationProbability}% rain`
                            : "–"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-semibold text-foreground">
                          {formatTemperature(entry.temperature, unit)}
                        </span>
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-xs text-foreground/60">
                        Humidity{" "}
                        {entry.humidity != null ? `${entry.humidity}%` : "–"} •
                        Wind{" "}
                        {entry.windSpeed != null
                          ? `${Math.round(entry.windSpeed)} km/h`
                          : "–"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {forecastLength}-day outlook
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Daily trend with maximum and minimum temperature plus
                    precipitation odds.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {dailySlice.map((entry) => {
                  const descriptor = describeWeatherCode(entry.weatherCode);
                  const Icon = iconForVariant(descriptor.variant);
                  return (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground/50">
                          {formatDateLabel(
                            new Date(entry.date),
                            weather.timezone
                          )}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {descriptor.label}
                        </p>
                        <p className="text-xs text-foreground/60">
                          Rain chance{" "}
                          {entry.precipitationProbability != null
                            ? `${entry.precipitationProbability}%`
                            : "–"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Icon className="h-10 w-10 text-primary" />
                        <div className="text-right text-sm">
                          <p className="font-semibold text-foreground">
                            {formatTemperature(entry.temperatureMax, unit)}
                          </p>
                          <p className="text-foreground/60">
                            {formatTemperature(entry.temperatureMin, unit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">
                Sun cycle
              </h3>
              <p className="text-sm text-foreground/60">
                Sunrise and sunset for today in {selectedCity.name}.
              </p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sunrise className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground/60">
                        Sunrise
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {sunriseTime
                          ? sunriseTime.toLocaleTimeString("en-PH", {
                              hour: "numeric",
                              minute: "numeric",
                            })
                          : "–"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sunset className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground/60">
                        Sunset
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {sunsetTime
                          ? sunsetTime.toLocaleTimeString("en-PH", {
                              hour: "numeric",
                              minute: "numeric",
                            })
                          : "–"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">
                Current metrics
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <KeyValue
                  label="Precipitation"
                  value={weather.current?.precipitation ?? 0}
                  suffix=" mm"
                />
                <KeyValue
                  label="Wind direction"
                  value={weather.current?.wind_direction_10m ?? null}
                  suffix="°"
                />
                <KeyValue
                  label="Rainfall"
                  value={weather.current?.rain ?? null}
                  suffix=" mm"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">
                Data provenance
              </h3>
              <p className="text-sm text-foreground/60">
                Forecasts are generated by the open-source{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Open-Meteo API
                </a>{" "}
                using ICON and GFS models tuned for Philippine conditions.
              </p>
              <p className="mt-3 text-xs text-foreground/50">
                Response includes hourly and daily predictions with 0.25°
                resolution. Values are refreshed from the API every 10 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DataPoint = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs">
    <Icon className="h-4 w-4 text-primary" />
    <span className="text-foreground/60">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

const KeyValue = ({ label, value, suffix = "" }) => (
  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
    <span className="text-foreground/60">{label}</span>
    <span className="font-semibold text-foreground">
      {value !== null && value !== "–" ? `${value}${suffix}` : "–"}
    </span>
  </div>
);
