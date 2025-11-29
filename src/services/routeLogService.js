import api from "./api";

export const createRouteLog = async (payload) => {
  const { data } = await api.post("/route-logs", payload);
  return data;
};

export const appendRouteDeviation = async (logId, payload) => {
  const { data } = await api.post(`/route-logs/${logId}/deviations`, payload);
  return data;
};
