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

  // Update request status (approve, reject, allocate, etc.)
  updateStatus: async (requestId, status, reason = null) => {
    const response = await api.patch(`/requests/${requestId}/status`, { status, reason });
    return response.data;
  },

  // Mark as under review (DOH dispatcher)
  markAsUnderReview: async (requestId) => {
    const response = await api.post(`/requests/${requestId}/under-review`);
    return response.data;
  },
};

export default requestService;
