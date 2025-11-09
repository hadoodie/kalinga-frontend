import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      Accept: "application/json",
    },
  },
});

// Reconnect when token changes
export const reconnectEcho = () => {
  const token = localStorage.getItem("token");
  if (echo.connector?.pusher?.config?.auth?.headers) {
    echo.connector.pusher.config.auth.headers.Authorization = `Bearer ${token}`;
  }
};

export default echo;
