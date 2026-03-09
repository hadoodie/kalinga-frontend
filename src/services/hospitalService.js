import api from "./api";
import { preloadCache } from "../lib/apiCache";

const HOSPITALS_TTL_MS = 5 * 60 * 1000; // 5 minutes

const CACHE_KEYS = {
  ALL: "hospitals:all",
};

const hospitalService = {
  getAll: async (params = {}) => {
    try {
      // Prefer real endpoint; fallback to test
      const res = await api.get("/hospitals", { params });
      return res.data;
    } catch (err) {
      const res = await api.get("/test/hospitals", { params });
      return res.data;
    }
  },

  getById: async (id) => {
    const res = await api.get(`/hospitals/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/hospitals", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/hospitals/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/hospitals/${id}`);
    return res.data;
  },

  preload() {
    preloadCache(
      CACHE_KEYS.ALL,
      async () => {
        try {
          const res = await api.get("/hospitals");
          return res.data;
        } catch {
          const res = await api.get("/test/hospitals");
          return res.data;
        }
      },
      HOSPITALS_TTL_MS
    );
  },
};

export default hospitalService;