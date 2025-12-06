import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const inferApiBase = () => {
  const envApi = import.meta.env.VITE_API_URL;

  // If env is set but mistakenly points to the frontend host, rewrite to backend
  if (envApi) {
    try {
      const url = new URL(envApi);
      if (url.hostname.includes("kalinga-frontend.onrender.com")) {
        url.hostname = "kalinga-backend.onrender.com";
        return url.toString().replace(/\/$/, "");
      }
      return envApi.replace(/\/$/, "");
    } catch (e) {
      // fall through to inference
    }
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Render prod inference: if we are on frontend host, point API to backend host
    if (host.includes("kalinga-frontend.onrender.com")) {
      return "https://kalinga-backend.onrender.com";
    }
    // Custom domains default to backend host unless explicitly set
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
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
const inferReverbHost = () => {
  if (import.meta.env.VITE_REVERB_HOST) {
    const host = import.meta.env.VITE_REVERB_HOST;
    if (host.includes("kalinga-frontend.onrender.com")) {
      return "kalinga-reverb.onrender.com";
    }
    return host;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("kalinga-frontend.onrender.com")) {
      return "kalinga-reverb.onrender.com";
    }
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return "kalinga-reverb.onrender.com";
    }
    return host;
  }

  return "localhost";
};

const fallbackHost = inferReverbHost();
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
  // Force auth for presence/private channels in case Echo defaults are skipped
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        fetch(`${API_BASE_URL}/api/broadcasting/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: buildAuthHeader(),
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
          credentials: "include",
        })
          .then(async (response) => {
            if (!response.ok) {
              const text = await response.text();
              console.error("Broadcast auth failed", response.status, text);
              return callback(true, { message: `Auth failed ${response.status}` });
            }
            const data = await response.json();
            callback(false, data);
          })
          .catch((error) => {
            console.error("Broadcast auth request error", error);
            callback(true, error);
          });
      },
    };
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
