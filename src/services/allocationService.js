// src/services/allocationService.js
import api from "./api";

const allocationService = {
  getSuggestions: (requestId) =>
    api.get(`/allocations/suggestions/${requestId}`),

  createAllocation: (payload) => api.post("/allocations", payload),

  confirmAllocation: (allocationId) =>
    api.patch(`/allocations/${allocationId}/confirm`),

  assignLogistics: (allocationId) =>
    api.patch(`/allocations/${allocationId}/assign`),

  bulkCreate: (allocations) => api.post("/allocations/bulk", { allocations }),

  rejectSuggestion: (allocationId) =>
    api.delete(`/allocations/${allocationId}/reject`),

  getPendingRequests: () =>
    api.get("/requests", { params: { status: "pending" } }),

  getMyAllocations: () => api.get("/allocations/my"),

  async getAssignmentDetails(allocationId) {
    const response = await api.get(
      `/allocations/${allocationId}/assignment-details`,
    );
    return response.data.data;
  },

  // Get pending requests count
  getPendingRequestsCount: async () => {
    try {
      const response = await api.get("/allocations/pending/count");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get my allocations count by status
  getMyAllocationsCount: async () => {
    try {
      const response = await api.get("/allocations/my/count");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get allocation with full details including relationships
  getAllocationDetails: async (id) => {
    try {
      const response = await api.get(`/allocations/${id}/details`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateLogisticsStatus: (requestId, status) =>
    api.patch(`/logistics/requests/${requestId}/status`, { status }),
};

export default allocationService;
