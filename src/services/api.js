// src/services/api.js
import axios from "axios";
import { getEchoInstance } from "./echo";
import { cleanupAuthStorage } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Enable cookies for CSRF protection
});

// CSRF token management
let csrfToken = null;

// Function to get CSRF cookie
export const getCsrfCookie = async () => {
  try {
    await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
    // Extract CSRF token from cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];
    if (token) {
      csrfToken = decodeURIComponent(token);
    }
  } catch (error) {
    console.error("Failed to fetch CSRF cookie:", error);
  }
};

// Request interceptor for auth token and CSRF
api.interceptors.request.use(
  async (config) => {
    // Add CSRF token for state-changing requests
    if (["post", "put", "patch", "delete"].includes(config.method)) {
      if (!csrfToken) {
        await getCsrfCookie();
      }
      if (csrfToken) {
        config.headers["X-XSRF-TOKEN"] = csrfToken;
      }
    }

    // Fallback: Also support Bearer token for mobile/external clients
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
  }
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

    // Handle 419 CSRF token mismatch
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;
      await getCsrfCookie();
      return api(originalRequest);
    }

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
        // Redirect back to login so the user can authenticate again
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      } else if (!originalRequest._authRetry) {
        // For non-auth endpoints try a single retry after refreshing CSRF cookie
        console.log("401 error - attempting to refresh auth and retry");
        originalRequest._authRetry = true;
        await getCsrfCookie();
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
