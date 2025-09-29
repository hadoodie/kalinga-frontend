import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CloudRain,
  Droplet,
  Loader2,
  MapPin,
  RefreshCcw,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { StatCard } from "@/components/admin/StatCard";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";
import { formatRelativeTime } from "@/lib/datetime";

const safeRound = (value, digits = 1) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const formatClock = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const createFallbackTelemetry = () => {
  const now = new Date();
  const sunrise = new Date(now);
  sunrise.setHours(6, 4, 0, 0);
  const sunset = new Date(now);
  sunset.setHours(18, 21, 0, 0);

  const outlook = Array.from({ length: 4 }, (_, index) => {
    const slot = new Date(now.getTime() + (index + 1) * 60 * 60 * 1000);
    const probabilities = [68, 60, 52, 40];
    return {
      time: slot.toISOString(),
      probability: probabilities[index] ?? Math.max(30 - index * 4, 15),
    };
  });

  return {
    source: "Command cache",
    updatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    latitude: 14.653,
    longitude: 121.037,
    temperature: 29.4,
    apparentTemperature: 33.1,
    humidity: 82,
    windSpeed: 14,
    precipitation: 2.4,
    precipitationProbability: 68,
    uvIndex: 6.2,
    airQuality: { pm25: 14, pm10: 24 },
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
    outlook,
  };
};

const FALLBACK_TELEMETRY = createFallbackTelemetry();

const buildWeatherUrl = (lat, lng) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&hourly=precipitation_probability&daily=sunrise,sunset,uv_index_max&forecast_days=1&timezone=Asia%2FSingapore`;

const buildAirQualityUrl = (lat, lng) =>
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm2_5,pm10&timezone=Asia%2FSingapore`;

export const WeatherTelemetry = () => {
  const { data, updateWeatherSnapshot, weatherSnapshot } = useResponderData();
  const [telemetry, setTelemetry] = useState(
    () => weatherSnapshot ?? FALLBACK_TELEMETRY
  );
  const [status, setStatus] = useState(weatherSnapshot ? "success" : "idle");
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(
    weatherSnapshot?.updatedAt ?? FALLBACK_TELEMETRY.updatedAt
  );
  const snapshotRef = useRef(weatherSnapshot ?? null);

  useEffect(() => {
    snapshotRef.current = weatherSnapshot ?? null;
  }, [weatherSnapshot]);

  const fetchTelemetry = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const fallbackIncident = data?.incidents?.[0]?.coordinates;
      const lat = safeRound(fallbackIncident?.lat, 3) ?? 14.653;
      const lng = safeRound(fallbackIncident?.lng, 3) ?? 121.037;

      const [weatherResponse, airResponse] = await Promise.all([
        fetch(buildWeatherUrl(lat, lng)),
        fetch(buildAirQualityUrl(lat, lng)),
      ]);

      if (!weatherResponse.ok) {
        throw new Error("weather request failed");
      }

      const weatherJson = await weatherResponse.json();
      const airJson = airResponse.ok ? await airResponse.json() : null;

      const current = weatherJson.current ?? {};
      const daily = weatherJson.daily ?? {};
      const hourly = weatherJson.hourly ?? {};

      const forecastSlots = [];
      if (Array.isArray(hourly.time)) {
        const nowTs = Date.now();
        for (let i = 0; i < hourly.time.length; i += 1) {
          const timeStr = hourly.time[i];
          const probability = hourly.precipitation_probability?.[i];
          const parsed = Date.parse(timeStr);
          if (
            !Number.isNaN(parsed) &&
            parsed >= nowTs &&
            forecastSlots.length < 4
          ) {
            forecastSlots.push({
              time: timeStr,
              probability,
            });
          }
        }
      }

      const snapshot = {
        source: "Open-Meteo",
        updatedAt: current.time ?? new Date().toISOString(),
        latitude: weatherJson.latitude ?? lat,
        longitude: weatherJson.longitude ?? lng,
        temperature: safeRound(current.temperature_2m, 1),
        apparentTemperature: safeRound(
          current.apparent_temperature ?? current.temperature_2m,
          1
        ),
        humidity: safeRound(current.relative_humidity_2m, 0),
        windSpeed: safeRound(current.wind_speed_10m, 0),
        precipitation: safeRound(current.precipitation ?? 0, 1),
        precipitationProbability:
          safeRound(
            forecastSlots[0]?.probability ??
              hourly.precipitation_probability?.[0],
            0
          ) ?? FALLBACK_TELEMETRY.precipitationProbability,
        uvIndex: safeRound(daily.uv_index_max?.[0], 1),
        sunrise: daily.sunrise?.[0] ?? null,
        sunset: daily.sunset?.[0] ?? null,
        airQuality: airJson?.hourly
          ? {
              pm25: safeRound(airJson.hourly.pm2_5?.[0], 0),
              pm10: safeRound(airJson.hourly.pm10?.[0], 0),
            }
          : null,
        outlook: forecastSlots.length
          ? forecastSlots
          : FALLBACK_TELEMETRY.outlook,
      };

      setTelemetry(snapshot);
      setLastUpdated(snapshot.updatedAt);
      updateWeatherSnapshot(snapshot);
      setStatus("success");
    } catch (caughtError) {
      console.error("Weather telemetry fetch failed", caughtError);
      const fallbackSnapshot = snapshotRef.current
        ? {
            ...snapshotRef.current,
            updatedAt: new Date().toISOString(),
          }
        : {
            ...FALLBACK_TELEMETRY,
            updatedAt: new Date().toISOString(),
          };
      snapshotRef.current = fallbackSnapshot;
      setTelemetry(fallbackSnapshot);
      setLastUpdated(fallbackSnapshot.updatedAt);
      updateWeatherSnapshot(fallbackSnapshot);
      setError("Live weather unavailable. Showing cached data.");
      setStatus("error");
    }
  }, [data?.incidents, updateWeatherSnapshot]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 120000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  useEffect(() => {
    if (weatherSnapshot && weatherSnapshot.updatedAt !== lastUpdated) {
      setTelemetry(weatherSnapshot);
      setLastUpdated(weatherSnapshot.updatedAt);
      if (status === "idle") {
        setStatus("success");
      }
    }
  }, [weatherSnapshot, lastUpdated, status]);

  const forecast = useMemo(() => telemetry.outlook ?? [], [telemetry.outlook]);
  const locationLabel = useMemo(() => {
    if (
      typeof telemetry.latitude === "number" &&
      typeof telemetry.longitude === "number"
    ) {
      return `${telemetry.latitude.toFixed(
        3
      )}° N, ${telemetry.longitude.toFixed(3)}° E`;
    }
    return "Local ops area";
  }, [telemetry.latitude, telemetry.longitude]);

  const humidityLabel =
    typeof telemetry.humidity === "number"
      ? `${Math.round(telemetry.humidity)}%`
      : "—";
  const temperatureLabel =
    typeof telemetry.temperature === "number"
      ? `${telemetry.temperature.toFixed(1)}°C`
      : "—";
  const apparentLabel =
    typeof telemetry.apparentTemperature === "number"
      ? `${telemetry.apparentTemperature.toFixed(1)}°C`
      : null;
  const precipitationLabel =
    typeof telemetry.precipitation === "number"
      ? `${telemetry.precipitation.toFixed(1)} mm`
      : "0 mm";
  const precipitationProbabilityLabel =
    typeof telemetry.precipitationProbability === "number"
      ? `${Math.round(telemetry.precipitationProbability)}% chance`
      : "—";
  const windLabel =
    typeof telemetry.windSpeed === "number"
      ? `${Math.round(telemetry.windSpeed)} km/h`
      : "—";
  const uvLabel =
    typeof telemetry.uvIndex === "number" ? telemetry.uvIndex.toFixed(1) : "—";

  const pm25 = telemetry.airQuality?.pm25 ?? null;
  const pm10 = telemetry.airQuality?.pm10 ?? null;
  const airQualityTone =
    pm25 !== null && pm25 > 35
      ? "bg-amber-500/15 text-amber-600"
      : "bg-emerald-500/15 text-emerald-600";

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Weather & Telemetry"
        description="Hyperlocal snapshot forecasting rainfall, wind, and air quality to guide safety callouts and medical prep."
        actions={
          <button
            onClick={fetchTelemetry}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:border-border/40 disabled:text-foreground/40"
          >
            {status === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="h-3.5 w-3.5" />
            )}
            {status === "loading" ? "Refreshing" : "Refresh telemetry"}
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Thermometer}
          label="Temperature"
          value={temperatureLabel}
          change={apparentLabel ? `Feels like ${apparentLabel}` : "Monitoring"}
          tone="primary"
        />
        <StatCard
          icon={Droplet}
          label="Humidity"
          value={humidityLabel}
          change="Ambient moisture"
          tone="warning"
        />
        <StatCard
          icon={CloudRain}
          label="Rain window"
          value={precipitationLabel}
          change={precipitationProbabilityLabel}
          tone="danger"
        />
        <StatCard
          icon={Wind}
          label="Wind speed"
          value={windLabel}
          change={`UV index ${uvLabel}`}
          tone="neutral"
        />
      </div>

      {error && (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-3xl border border-border/60 bg-card/70 p-5 text-sm shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
                Field telemetry pulse
              </p>
              <h3 className="text-lg font-semibold text-foreground">
                {locationLabel}
              </h3>
              <p className="mt-1 text-xs text-foreground/60">
                Updated{" "}
                {lastUpdated ? formatRelativeTime(lastUpdated) : "moments ago"}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              {telemetry.source ?? "Telemetry cache"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground/70">
              <Sun className="h-4 w-4 text-amber-500" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Sunrise</p>
                <p>{formatClock(telemetry.sunrise)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground/70">
              <Sun className="h-4 w-4 rotate-180 text-rose-500" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Sunset</p>
                <p>{formatClock(telemetry.sunset)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Next precipitation slots
            </h4>
            <ul className="mt-3 grid gap-2 text-xs text-foreground/70 sm:grid-cols-2 lg:grid-cols-4">
              {forecast.length ? (
                forecast.map((slot, index) => (
                  <li
                    key={slot.time ?? index}
                    className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2"
                  >
                    <p className="font-semibold text-foreground">
                      {formatClock(slot.time)}
                    </p>
                    <p className="text-foreground/60">
                      Rain probability{" "}
                      {typeof slot.probability === "number"
                        ? `${Math.round(slot.probability)}%`
                        : "—"}
                    </p>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2">
                  <p className="font-semibold text-foreground">
                    No radar window
                  </p>
                  <p className="text-foreground/60">
                    Precipitation chance minimal for the next cycle.
                  </p>
                </li>
              )}
            </ul>
          </div>
        </article>

        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-border/60 bg-card/70 p-5 text-sm shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
              Air quality snapshot
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${airQualityTone}`}
              >
                <Activity className="h-3.5 w-3.5" />
                PM2.5 {pm25 ?? "—"}
              </span>
            </div>
            <p className="mt-3 text-xs text-foreground/60">
              Particulates: PM2.5 {pm25 ?? "—"} µg/m³ • PM10 {pm10 ?? "—"}{" "}
              µg/m³. Refresh intake filters if PM2.5 exceeds 35.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/70 p-5 text-sm shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/50">
              Infrastructure telemetry
            </p>
            <ul className="mt-3 space-y-2 text-xs text-foreground/70">
              <li className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-2">
                <span>Flood sensors online</span>
                <span className="font-semibold text-foreground">
                  {data?.infrastructure?.floodSensors ?? 6}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-2">
                <span>Generator status</span>
                <span className="font-semibold text-foreground">
                  {data?.infrastructure?.generatorStatus ?? "Nominal"}
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};
