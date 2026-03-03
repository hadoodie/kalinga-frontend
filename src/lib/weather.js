const WEATHER_CODE_MAP = {
  0: { label: "Clear sky", variant: "clear" },
  1: { label: "Mainly clear", variant: "partly" },
  2: { label: "Partly cloudy", variant: "partly" },
  3: { label: "Overcast", variant: "cloudy" },
  45: { label: "Fog", variant: "fog" },
  48: { label: "Depositing rime fog", variant: "fog" },
  51: { label: "Light drizzle", variant: "drizzle" },
  53: { label: "Moderate drizzle", variant: "drizzle" },
  55: { label: "Dense drizzle", variant: "drizzle" },
  56: { label: "Freezing drizzle", variant: "drizzle" },
  57: { label: "Dense freezing drizzle", variant: "drizzle" },
  61: { label: "Slight rain", variant: "rain" },
  63: { label: "Moderate rain", variant: "rain" },
  65: { label: "Heavy rain", variant: "rain" },
  66: { label: "Light freezing rain", variant: "rain" },
  67: { label: "Heavy freezing rain", variant: "rain" },
  71: { label: "Slight snow fall", variant: "snow" },
  73: { label: "Moderate snow fall", variant: "snow" },
  75: { label: "Heavy snow fall", variant: "snow" },
  77: { label: "Snow grains", variant: "snow" },
  80: { label: "Slight rain showers", variant: "rain" },
  81: { label: "Moderate rain showers", variant: "rain" },
  82: { label: "Violent rain showers", variant: "rain" },
  85: { label: "Slight snow showers", variant: "snow" },
  86: { label: "Heavy snow showers", variant: "snow" },
  95: { label: "Thunderstorm", variant: "thunder" },
  96: { label: "Thunderstorm with slight hail", variant: "thunder" },
  99: { label: "Thunderstorm with heavy hail", variant: "thunder" },
};

export const describeWeatherCode = (code) =>
  WEATHER_CODE_MAP[code] ?? { label: "Unknown", variant: "cloudy" };

export const celsiusToFahrenheit = (tempC) => (tempC * 9) / 5 + 32;

export const formatHourLabel = (date, timezone) =>
  date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    timeZone: timezone,
  });

export const formatDateLabel = (date, timezone) =>
  date.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
