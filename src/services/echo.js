import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { resolveApiBaseUrl, resolveRealtimeSettings } from "../config/runtime";

window.Pusher = Pusher;

const API_BASE_URL = resolveApiBaseUrl();
const {
  host: resolvedReverbHost,
  scheme: reverbScheme,
  port: reverbPort,
} = resolveRealtimeSettings();
const useTls = reverbScheme === "https";
const transportModes = useTls ? ["wss"] : ["ws"];

// Debug: surface computed API and reverb defaults for troubleshooting
try {
  // eslint-disable-next-line no-console
  console.info("[echo debug] API_BASE_URL ->", API_BASE_URL);
  // eslint-disable-next-line no-console
  console.info(
    "[echo debug] realtime host ->",
    resolvedReverbHost,
    "scheme ->",
    reverbScheme,
    "port ->",
    reverbPort
  );
} catch (e) {}
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

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY || "ydxpycz90avrcgumitzo",
  wsHost: resolvedReverbHost,
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
        // Debug: announce when attempting to auth
        // eslint-disable-next-line no-console
        console.debug("[echo debug] authorizer start", {
          channel: channel.name,
          socketId,
          api: API_BASE_URL,
        });

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
              // eslint-disable-next-line no-console
              console.error(
                "[echo debug] Broadcast auth failed",
                response.status,
                text
              );
              return callback(true, {
                message: `Auth failed ${response.status}`,
              });
            }
            const data = await response.json();
            // eslint-disable-next-line no-console
            console.debug("[echo debug] Broadcast auth success", data);
            callback(false, data);
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error("[echo debug] Broadcast auth request error", error);
            callback(true, error);
          });
      },
    };
  },
});

// Ensure the runtime instance always reflects the latest token
applyAuthHeader(echo, echo.options?.auth?.headers?.Authorization);

// Debug: bind to underlying Pusher/Reverb connection events (state, connected, error)
try {
  const pusher = echo.connector?.pusher;
  if (pusher && pusher.connection) {
    // eslint-disable-next-line no-console
    console.debug("[echo debug] binding pusher connection events");
    pusher.connection.bind("state_change", (states) => {
      // eslint-disable-next-line no-console
      console.debug(
        "[echo debug] pusher state_change",
        states.previous,
        "->",
        states.current
      );
    });
    pusher.connection.bind("connected", () => {
      // eslint-disable-next-line no-console
      console.info(
        "[echo debug] pusher connected, socket_id ->",
        pusher.connection.socket_id
      );
    });
    pusher.connection.bind("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[echo debug] pusher connection error", err);
    });
  } else {
    // eslint-disable-next-line no-console
    console.debug("[echo debug] pusher connector not available at init");
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error("[echo debug] error binding pusher events", e);
}

// Reconnect when token changes
export const reconnectEcho = () => {
  const headerValue = buildAuthHeader();
  applyAuthHeader(echo, headerValue);
};

export const getEchoInstance = () => echo;

export default echo;

// Extra debug helper for manual inspection in console
export const debugEcho = () => {
  try {
    // eslint-disable-next-line no-console
    console.info("[echo debug] echo.options ->", echo.options || {});
    // eslint-disable-next-line no-console
    console.info("[echo debug] echo.connector ->", echo.connector || {});
    // eslint-disable-next-line no-console
    console.info(
      "[echo debug] pusher connection socket_id ->",
      echo.connector?.pusher?.connection?.socket_id
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[echo debug] debugEcho error", e);
  }
};

// Expose helpers for Ops/QA via DevTools without extra imports
if (typeof window !== "undefined") {
  window.$echo = echo;
  window.debugEcho = debugEcho;
}
