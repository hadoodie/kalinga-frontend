// src/services/sensorService.js
// Alisto Health Monitoring — Sensor data bridge (RPi 5 ↔ Dashboard)

import api from "./api";

const SENSOR_TTL_MS = 10 * 1000; // 10 seconds

let _cache = {};
const getCached = (key) => {
  const entry = _cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > SENSOR_TTL_MS) {
    delete _cache[key];
    return null;
  }
  return entry.data;
};
const setCached = (key, data) => {
  _cache[key] = { data, ts: Date.now() };
};

const sensorService = {
  // ─── Vitals ───────────────────────────────────────────────────────────

  /** Fetch latest vitals (single patient or all) */
  getLatestVitals: async (userUuid = null) => {
    const cacheKey = `vitals:latest:${userUuid || "all"}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const params = userUuid ? { user_uuid: userUuid } : {};
    const res = await api.get("/sensor/vitals/latest", { params });
    setCached(cacheKey, res.data);
    return res.data;
  },

  /** Fetch vitals time-series for charts */
  getVitalsHistory: async (userUuid = null, limit = 50) => {
    const params = { limit };
    if (userUuid) params.user_uuid = userUuid;
    const res = await api.get("/sensor/vitals/history", { params });
    return res.data;
  },

  /** Aggregate summary for dashboard cards */
  getVitalsSummary: async () => {
    const cacheKey = "vitals:summary";
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await api.get("/sensor/vitals/summary");
    setCached(cacheKey, res.data);
    return res.data;
  },

  /** Push a new sensor reading (usually called from RPi, but also usable from web) */
  pushVitals: async (payload) => {
    const res = await api.post("/sensor/vitals", payload);
    _cache = {}; // invalidate all sensor caches
    return res.data;
  },

  // ─── Device Status ────────────────────────────────────────────────────

  /** Check if the RPi edge device is online */
  getDeviceStatus: async () => {
    const res = await api.get("/sensor/status");
    return res.data;
  },

  // ─── Simulator ────────────────────────────────────────────────────────

  /** List available simulation scenarios */
  getSimulatorScenarios: async () => {
    const res = await api.get("/simulator/scenarios");
    return res.data;
  },

  /** Start a batch simulation */
  startSimulation: async (params = {}) => {
    const res = await api.post("/simulator/start", params);
    _cache = {};
    return res.data;
  },

  /** Get a single simulated reading (no DB write) */
  streamSimulation: async (userUuid = null, scenario = null) => {
    const body = {};
    if (userUuid) body.user_uuid = userUuid;
    if (scenario) body.scenario = scenario;
    const res = await api.post("/simulator/stream", body);
    return res.data;
  },

  /** Cleanup simulated data */
  cleanupSimulation: async () => {
    const res = await api.delete("/simulator/cleanup");
    _cache = {};
    return res.data;
  },

  // ─── Dashboard Reports ────────────────────────────────────────────────

  /** Hospital patient distribution (matches capacity tables) */
  getPatientDistribution: async () => {
    const cacheKey = "reports:patient-distribution";
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await api.get("/hospitals/patient-distribution");
    setCached(cacheKey, res.data);
    return res.data;
  },

  /** DOH Hospital reports — categorized by priority */
  getDohHospitalReports: async () => {
    const cacheKey = "reports:doh-hospital";
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await api.get("/reports/doh-hospital");
    setCached(cacheKey, res.data);
    return res.data;
  },

  /** DOH Triage status (linked to vitals/QR auth) */
  getDohTriageStatus: async () => {
    const cacheKey = "reports:doh-triage";
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await api.get("/reports/doh-triage");
    setCached(cacheKey, res.data);
    return res.data;
  },

  /** Incident polling (since timestamp) */
  pollIncidents: async (since = null) => {
    const params = since ? { since } : {};
    const res = await api.get("/incidents/poll", { params });
    return res.data;
  },
};

export default sensorService;
