// src/services/requestService.js 
import api from "/src/services/api.js";

const requestService = {
  // Save Draft
  saveDraft: async (data) => {
    const response = await api.post("/requests/draft", data);
    return response.data.request;
  },

  // Submit Final
  submitRequest: async (data) => {
    const response = await api.post("/requests", data);
    return response.data.request;
  },

  // Update Draft
  updateDraft: async (requestId, data) => {
    const response = await api.patch(`/requests/${requestId}/draft`, data);
    return response.data.request;
  },

  // Submit Draft → Pending
  submitFromDraft: async (requestId) => {
    const response = await api.patch(`/requests/${requestId}/submit`);
    return response.data.request;
  },

  // List all requests
  getMyRequests: async (filters = {}) => {
    const response = await api.get("/requests", { params: filters });
    return response.data;  // full pagination object
  },

  // Get single request
  getById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data; // backend does NOT wrap it
  },

  // Delete draft
  deleteDraft: async (requestId) => {
    await api.delete(`/requests/${requestId}`);
  },

    markAsUnderReview: async (requestId) => {
    try {
      const response = await axios.post(`/api/requests/${requestId}/under-review`);
      return response.data;
    } catch (error) {
      console.error('Error marking request as under review:', error);
      throw error;
    }
  },
};

export default requestService;
