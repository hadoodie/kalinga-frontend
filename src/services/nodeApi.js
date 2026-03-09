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
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — dispatch the same logout event used elsewhere
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  }
);

export default nodeApi;
