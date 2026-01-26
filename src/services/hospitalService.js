import api from "./api";

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
};

export default hospitalService;