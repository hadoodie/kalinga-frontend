// src/services/hospitalService.js
import api from "./api";

const hospitalService = {
  // Get all hospitals
  getAll: async () => {
    try {
      // For now, use test endpoint (no auth required)
      const response = await api.get("/test/hospitals");
      return response.data;
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      throw error;
    }
  },

  // Get single hospital by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/hospitals/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching hospital:", error);
      throw error;
    }
  },

  // Create new hospital
  create: async (data) => {
    try {
      const response = await api.post("/hospitals", data);
      return response.data;
    } catch (error) {
      console.error("Error creating hospital:", error);
      throw error;
    }
  },

  // Update hospital
  update: async (id, data) => {
    try {
      const response = await api.put(`/hospitals/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating hospital:", error);
      throw error;
    }
  },

  // Delete hospital
  delete: async (id) => {
    try {
      const response = await api.delete(`/hospitals/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting hospital:", error);
      throw error;
    }
  },
};

export default hospitalService;
