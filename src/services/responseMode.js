import api from "./api";

const responseModeService = {
  async getIncident(incidentId) {
    const response = await api.get(`/incidents/${incidentId}`);
    return response.data?.data ?? response.data;
  },

  async getConversation(incidentId) {
    const response = await api.get(`/incidents/${incidentId}/conversation`);
    return response.data?.data ?? response.data;
  },

  async getHospitalRecommendations(incidentId) {
    const response = await api.get(
      `/incidents/${incidentId}/hospital-recommendations`
    );
    return response.data?.data ?? response.data ?? [];
  },
};

export default responseModeService;
