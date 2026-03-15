// src/services/api.js
import axios from "axios";
import { getEchoInstance } from "./echo";
import { cleanupAuthStorage } from "../utils/storage";
import { resolveApiBaseUrl } from "../config/runtime";

const API_BASE_URL = resolveApiBaseUrl();

// The backend uses stateless token-based auth (Bearer tokens via Sanctum).
// statefulApi() / session / CSRF cookie middleware are intentionally NOT used.
// withCredentials is false to avoid the stricter cross-origin CORS rules that
// credentials mode imposes (cannot use wildcard origins, cookies rejected, etc.).
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Request interceptor — attach Bearer token and Echo socket id
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const echoInstance = getEchoInstance?.();
      const socketId = echoInstance?.socketId?.();
      if (socketId) {
        config.headers["X-Socket-Id"] = socketId;
      }
    } catch (socketError) {
      console.warn("Unable to attach Echo socket id", socketError);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Helper to clear auth state and notify listeners when session expires
const forceLogout = () => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    cleanupAuthStorage();
  } catch (storageError) {
    console.warn("Failed to clear auth storage", storageError);
  }

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
  } catch (eventError) {
    console.warn("Failed to dispatch auth:logout event", eventError);
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
      // You can show a toast/notification here
    }

    // Handle 401 Unauthorized - but be smart about it
    if (error.response?.status === 401) {
      // Check if this is truly an auth failure or just a network/temporary issue
      const isAuthEndpoint =
        originalRequest.url?.includes("/login") ||
        originalRequest.url?.includes("/register") ||
        originalRequest.url?.includes("/me");

      // Always clear stale auth data on 401s
      forceLogout();

      if (isAuthEndpoint) {
        // Route to home on forced logout to keep sign-out behavior consistent
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
