const RENDER_BACKEND_HOST = "kalinga-backend.onrender.com";
const RENDER_REALTIME_HOST = "kalinga-reverb.onrender.com";
const LOCAL_FALLBACK_API = "http://localhost:8000";

const stripProtocol = (value) => {
  if (!value) return "";
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
};

const normalizeUrl = (value) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch (error) {
    return null;
  }
};

const isLocalHost = (host) => {
  if (!host) return false;
  const value = host.toLowerCase();
  return (
    value === "localhost" ||
    value === "127.0.0.1" ||
    value === "::1" ||
    value.endsWith(".localhost")
  );
};

const getRuntimeHost = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.location.hostname;
};

export const resolveApiBaseUrl = () => {
  const runtimeHost = getRuntimeHost();
  const runningLocally = runtimeHost ? isLocalHost(runtimeHost) : true;

  const envValue = import.meta.env.VITE_API_URL?.trim();
  const sanitizedEnv = normalizeUrl(envValue);
  const envHost = sanitizedEnv ? new URL(sanitizedEnv).hostname : null;
  const envPointsToFrontend = envHost?.includes("kalinga-frontend.onrender.com");
  const envIsLocal = envHost ? isLocalHost(envHost) : false;

  if (sanitizedEnv && !envPointsToFrontend) {
    if (envIsLocal && !runningLocally) {
      return `https://${RENDER_BACKEND_HOST}`;
    }
    return sanitizedEnv;
  }

  if (!runningLocally) {
    return `https://${RENDER_BACKEND_HOST}`;
  }

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }

  return LOCAL_FALLBACK_API;
};

export const resolveRealtimeSettings = () => {
  const runtimeHost = getRuntimeHost();
  const runningLocally = runtimeHost ? isLocalHost(runtimeHost) : true;

  const envHostRaw = import.meta.env.VITE_REVERB_HOST?.trim();
  const sanitizedEnvHost = stripProtocol(envHostRaw);
  const envIsFrontend = sanitizedEnvHost?.includes("kalinga-frontend.onrender.com");
  const envIsLocal = sanitizedEnvHost ? isLocalHost(sanitizedEnvHost) : false;

  let host = sanitizedEnvHost;
  if (!host || envIsFrontend || (envIsLocal && !runningLocally)) {
    host = runningLocally ? sanitizedEnvHost || "localhost" : RENDER_REALTIME_HOST;
  }

  let scheme = import.meta.env.VITE_REVERB_SCHEME?.trim().toLowerCase();
  let port = Number(import.meta.env.VITE_REVERB_PORT);
  const hasValidPort = Number.isInteger(port) && port > 0;

  if (!runningLocally) {
    scheme = "https";
    port = 443;
  } else {
    if (!scheme) {
      if (typeof window !== "undefined" && window.location.protocol === "https:") {
        scheme = "https";
      } else {
        scheme = "http";
      }
    }
    if (!hasValidPort) {
      port = scheme === "https" ? 443 : 80;
    }
  }

  return {
    host,
    scheme,
    port,
  };
};
