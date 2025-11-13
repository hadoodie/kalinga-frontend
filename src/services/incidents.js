import api from "./api";

export const fetchResponderIncidents = (params = {}) =>
  api.get("/incidents", { params });

export const fetchIncidentHistory = (incidentId) =>
  api.get(`/incidents/${incidentId}/history`);

export const assignToIncident = (incidentId, payload = {}) =>
  api.post(`/incidents/${incidentId}/assign`, payload);

export const updateIncidentStatus = (incidentId, payload) =>
  api.post(`/incidents/${incidentId}/status`, payload);

export const assignNearestIncident = (payload) =>
  api.post("/incidents/assign-nearest", payload);
