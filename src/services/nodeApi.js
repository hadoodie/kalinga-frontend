/**
 * Axios client for the Node.js / Express + Supabase backend (port 5000).
 * This is separate from api.js which targets the Laravel backend.
 */
import axios from "axios";

const NODE_API_URL =
  import.meta.env.VITE_NODE_API_URL || "http://localhost:5000";

const nodeApi = axios.create({
  baseURL: `${NODE_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach JWT Bearer token on every request
nodeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handling
nodeApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — dispatch the same logout event used elsewhere
      window.dispatchEvent(new Event("auth:logout"));
    }

    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers?.["retry-after"] || "0", 10);
      if (retryAfter > 0 && !error.config._retried429) {
        // Back off for the server-specified duration and retry once
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        error.config._retried429 = true;
        return nodeApi(error.config);
      }
      // Surface a user-friendly error message
      const friendly = new Error("Too many requests. Please slow down and try again in a moment.");
      friendly.status = 429;
      return Promise.reject(friendly);
    }

    return Promise.reject(error);
  }
);

export default nodeApi;
