import api from "./api";

// Minimal emergency reporting helper used by the UI. It posts a payload
// to the backend incidents endpoint. Adjust the endpoint if your API
// exposes a different route for emergency alerts.
export const submitEmergencyReport = async (payload = {}) => {
  const response = await api.post("/incidents", payload);
  return response.data;
};

export default {
  submitEmergencyReport,
};
