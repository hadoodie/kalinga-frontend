// src/services/resourceService.js
import api from "./api";

const resourceService = {
  // Get all resources with filters
  getAll: async (params = {}) => {
    try {
      // Use authenticated endpoint with filters
      const response = await api.get("/resources", {
        params: {
          ...params,
          all: true, // Get all resources without pagination
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  // Get single resource by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/resources/${id}`);
      return response.data.resource;
    } catch (error) {
      console.error("Error fetching resource:", error);
      throw error;
    }
  },

  // Create new resource
  create: async (data) => {
    try {
      const response = await api.post("/resources", data);
      return response.data;
    } catch (error) {
      console.error("Error creating resource:", error);
      throw error;
    }
  },

  // Update resource
  update: async (id, data) => {
    try {
      const response = await api.put(`/resources/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating resource:", error);
      throw error;
    }
  },

  // Delete resource
  delete: async (id) => {
    try {
      const response = await api.delete(`/resources/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting resource:", error);
      throw error;
    }
  },

  // Get low stock resources
  getLowStock: async () => {
    try {
      const response = await api.get("/resources/low-stock");
      return response.data;
    } catch (error) {
      console.error("Error fetching low stock resources:", error);
      throw error;
    }
  },

  // Get critical resources
  getCritical: async () => {
    try {
      const response = await api.get("/resources/critical");
      return response.data;
    } catch (error) {
      console.error("Error fetching critical resources:", error);
      throw error;
    }
  },

  // Get expiring resources
  getExpiring: async (days = 30) => {
    try {
      const response = await api.get("/resources/expiring", {
        params: { days },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching expiring resources:", error);
      throw error;
    }
  },

  // Get resources by category
  getByCategory: async (category) => {
    try {
      const response = await api.get("/resources", { params: { category } });
      return response.data;
    } catch (error) {
      console.error("Error fetching resources by category:", error);
      throw error;
    }
  },

  // Search resources
  search: async (searchTerm) => {
    try {
      const response = await api.get("/resources", {
        params: { search: searchTerm },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching resources:", error);
      throw error;
    }
  },
};

export default resourceService;
