import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY || "ydxpycz90avrcgumitzo",
  wsHost: import.meta.env.VITE_REVERB_HOST || "localhost",
  wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
  enabledTransports: ["ws", "wss"],
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
