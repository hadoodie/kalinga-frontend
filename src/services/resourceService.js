import api from "./api";

const resourceService = {
  // Get all resources with filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/resources", {
        params: {
          ...params,
          all: true, // Get all resources without pagination
        },
      });
      // Return the data array directly for easier consumption
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  // Get resources by location/facility - needed for both pages
  getByLocation: async (location) => {
    try {
      const response = await api.get("/resources", {
        params: { location, all: true },
      });
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching resources by location:", error);
      throw error;
    }
  },

  // Get single resource by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/resources/${id}`);
      return response.data.resource || response.data;
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

  // Update resource - enhanced to support partial updates
  update: async (id, data) => {
    try {
      const response = await api.put(`/resources/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating resource:", error);
      throw error;
    }
  },

  // Add stock adjustment method - critical for Resource Management
  adjustStock: async (id, adjustmentData) => {
    try {
      // Try the dedicated adjust-stock endpoint first
      const response = await api.post(`/resources/${id}/adjust-stock`, adjustmentData);
      return response.data;
    } catch (error) {
      // Fallback: If endpoint doesn't exist, update the resource directly
      console.warn("Adjust stock endpoint not found, using update fallback");
      try {
        const resource = await resourceService.getById(id);
        const newQuantity = resource.quantity + adjustmentData.quantity;
        const newReceived = (resource.received || 0) + adjustmentData.quantity;
        
        return await resourceService.update(id, {
          quantity: newQuantity,
          received: newReceived,
        });
      } catch (fallbackError) {
        console.error("Error in fallback stock adjustment:", fallbackError);
        throw error;
      }
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

  // Get low stock resources - useful for Dashboard alerts
  getLowStock: async () => {
    try {
      const response = await api.get("/resources/low-stock");
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching low stock resources:", error);
      throw error;
    }
  },

  // Get critical resources - needed for both Dashboard and Resource Management
  getCritical: async () => {
    try {
      const response = await api.get("/resources/critical");
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching critical resources:", error);
      // Fallback: filter from all resources
      try {
        const allResources = await resourceService.getAll();
        return allResources.filter(r => r.status === 'Critical');
      } catch (fallbackError) {
        throw error;
      }
    }
  },

  // Get expiring resources
  getExpiring: async (days = 30) => {
    try {
      const response = await api.get("/resources/expiring", {
        params: { days },
      });
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching expiring resources:", error);
      throw error;
    }
  },

  // Get resources by category - needed for Resource Management filters
  getByCategory: async (category) => {
    try {
      const response = await api.get("/resources", { 
        params: { category, all: true } 
      });
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error fetching resources by category:", error);
      throw error;
    }
  },

  // Search resources
  search: async (searchTerm) => {
    try {
      const response = await api.get("/resources", {
        params: { search: searchTerm, all: true },
      });
      return response.data.resources || response.data || [];
    } catch (error) {
      console.error("Error searching resources:", error);
      throw error;
    }
  },

  // Get summary statistics - useful for Dashboard
  getStats: async () => {
    try {
      const response = await api.get("/resources/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching resource stats:", error);
      // Fallback: Calculate from all resources
      try {
        const allResources = await resourceService.getAll();
        return {
          total: allResources.length,
          critical: allResources.filter(r => r.status === 'Critical').length,
          totalQuantity: allResources.reduce((sum, r) => sum + (r.quantity || 0), 0),
          totalValue: allResources.reduce((sum, r) => sum + ((r.quantity || 0) * (r.unitPrice || 0)), 0),
        };
      } catch (fallbackError) {
        throw error;
      }
    }
  },

  // Get resources grouped by facility - useful for Dashboard pie chart
  getByFacility: async () => {
    try {
      const response = await api.get("/resources/by-facility");
      return response.data;
    } catch (error) {
      console.error("Error fetching resources by facility:", error);
      // Fallback: Group manually from all resources
      try {
        const allResources = await resourceService.getAll();
        const grouped = {};
        
        allResources.forEach(resource => {
          const facility = resource.location || resource.facility || 'Unknown';
          if (!grouped[facility]) {
            grouped[facility] = { name: facility, resources: 0, items: [] };
          }
          grouped[facility].resources += resource.quantity || 0;
          grouped[facility].items.push(resource);
        });
        
        return Object.values(grouped);
      } catch (fallbackError) {
        throw error;
      }
    }
  },
};

export default resourceService;