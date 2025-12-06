import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const inferApiBase = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) return envApi;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Render prod inference: if we are on frontend host, point API to backend host
    if (host.includes("kalinga-frontend.onrender.com")) {
      return "https://kalinga-backend.onrender.com";
    }
    return window.location.origin;
  }

  return "http://localhost:8000";
};

const API_BASE_URL = inferApiBase();

const buildAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? `Bearer ${token}` : "";
};

const applyAuthHeader = (echoInstance, headerValue) => {
  if (!echoInstance) return;

  if (echoInstance.options?.auth?.headers) {
    if (headerValue) {
      echoInstance.options.auth.headers.Authorization = headerValue;
    } else {
      delete echoInstance.options.auth.headers.Authorization;
    }
  }

  if (echoInstance.connector?.pusher?.config?.auth?.headers) {
    if (headerValue) {
      echoInstance.connector.pusher.config.auth.headers.Authorization =
        headerValue;
    } else {
      delete echoInstance.connector.pusher.config.auth.headers.Authorization;
    }
  }

  if (echoInstance.connector?.options?.auth?.headers) {
    if (headerValue) {
      echoInstance.connector.options.auth.headers.Authorization = headerValue;
    } else {
      delete echoInstance.connector.options.auth.headers.Authorization;
    }
  }
};

// Configure Echo for Laravel Reverb WebSocket connections
const fallbackHost =
  import.meta.env.VITE_REVERB_HOST ||
  (typeof window !== "undefined"
    ? window.location.hostname.includes("kalinga-frontend.onrender.com")
      ? "kalinga-reverb.onrender.com"
      : window.location.hostname
    : "localhost");
const reverbScheme =
  import.meta.env.VITE_REVERB_SCHEME ||
  (typeof window !== "undefined" && window.location.protocol === "https:"
    ? "https"
    : "http");
const useTls = reverbScheme === "https";
const reverbPort =
  Number(import.meta.env.VITE_REVERB_PORT) || (useTls ? 443 : 80);
const transportModes = useTls ? ["wss"] : ["ws"];

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY || "ydxpycz90avrcgumitzo",
  wsHost: import.meta.env.VITE_REVERB_HOST || fallbackHost,
  wsPort: reverbPort,
  wssPort: reverbPort,
  forceTLS: useTls,
  encrypted: useTls,
  enabledTransports: transportModes,
  disableStats: true, // Disable statistics for better performance
  authEndpoint: `${API_BASE_URL}/api/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: buildAuthHeader(),
      Accept: "application/json",
    },
  },
});

// Ensure the runtime instance always reflects the latest token
applyAuthHeader(echo, echo.options?.auth?.headers?.Authorization);

// Reconnect when token changes
export const reconnectEcho = () => {
  const headerValue = buildAuthHeader();
  applyAuthHeader(echo, headerValue);
};

export const getEchoInstance = () => echo;

export default echo;
