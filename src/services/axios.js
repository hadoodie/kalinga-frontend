/**
 * Unified API client module for the Kalinga system.
 *
 * Exports two pre-configured Axios instances:
 *   - `api`      — Laravel/Sanctum backend (port 8000 / kalinga-backend.onrender.com)
 *   - `nodeApi`  — Node.js/Express backend  (port 5000 / separate service)
 *
 * Also exports typed endpoint helpers for every route defined in API-DICTIONARY.md.
 */
import axios from "axios";
import api from "./api";

// ---------------------------------------------------------------------------
// Node.js / Express API client (port 5000)
// ---------------------------------------------------------------------------

const NODE_API_BASE_URL = import.meta.env.VITE_NODE_API_URL?.trim()
  ? import.meta.env.VITE_NODE_API_URL.trim().replace(/\/$/, "")
  : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://kalinga-node.onrender.com"
    : "http://localhost:5000";

export const nodeApi = axios.create({
  baseURL: `${NODE_API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

nodeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Generic request helpers — Laravel API
// ---------------------------------------------------------------------------

/** @param {string} url @param {object} [config] */
export const get = (url, config) => api.get(url, config);

/** @param {string} url @param {object} [data] @param {object} [config] */
export const post = (url, data, config) => api.post(url, data, config);

/** @param {string} url @param {object} [data] @param {object} [config] */
export const put = (url, data, config) => api.put(url, data, config);

/** @param {string} url @param {object} [data] @param {object} [config] */
export const patch = (url, data, config) => api.patch(url, data, config);

/** @param {string} url @param {object} [config] */
export const del = (url, config) => api.delete(url, config);

/**
 * Factory that returns a CRUD client for a given base path on the Laravel API.
 * @param {string} basePath - e.g. '/resources', '/hospitals'
 */
export const createResource = (basePath) => ({
  list: (params) => get(basePath, { params }),
  get: (id) => get(`${basePath}/${id}`),
  create: (data) => post(basePath, data),
  update: (id, data) => put(`${basePath}/${id}`, data),
  patch: (id, data) => patch(`${basePath}/${id}`, data),
  remove: (id) => del(`${basePath}/${id}`),
});

// ---------------------------------------------------------------------------
// § 1  Node.js / Express endpoints (port 5000)
// ---------------------------------------------------------------------------

// § 1.1  System & Health
export const nodeHealth = {
  ping: () => nodeApi.get("/health"),
  status: () => nodeApi.get("/system/status"),
};

// § 1.2  Auth & Device Tracking
export const nodeAuth = {
  recordDevice: (data) => nodeApi.post("/auth/record-device", data),
  getUserDevices: (userId) => nodeApi.get(`/users/${userId}/devices`),
};

// § 1.3  Profile (Node)
export const nodeProfile = {
  get: () => nodeApi.get("/profile"),
  update: (data) => nodeApi.put("/profile", data),
  uploadAvatar: (formData) =>
    nodeApi.post("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (data) => nodeApi.put("/profile/password", data),
  getDevices: () => nodeApi.get("/profile/devices"),
  removeDevice: (deviceId) => nodeApi.delete(`/profile/devices/${deviceId}`),
};

// § 1.4  Account (Node)
export const nodeAccount = {
  status: () => nodeApi.get("/account/status"),
  verify: (data) => nodeApi.put("/account/verify", data),
  deactivate: (data) => nodeApi.put("/account/deactivate", data),
};

// § 1.5  Activity (Node)
export const nodeActivity = {
  list: (params) => nodeApi.get("/activity", { params }),
};

// § 1.6  Dashboard (Node)
export const nodeDashboard = {
  hospitals: (params) => nodeApi.get("/dashboard/hospitals", { params }),
  realtimeIncidents: (params) =>
    nodeApi.get("/dashboard/incidents/realtime", { params }),
};

// § 1.7  Hospitals (Node — read-only)
export const nodeHospitals = {
  list: (params) => nodeApi.get("/hospitals", { params }),
  patientDistribution: () => nodeApi.get("/hospitals/patient-distribution"),
  get: (id) => nodeApi.get(`/hospitals/${id}`),
  patients: (id, params) => nodeApi.get(`/hospitals/${id}/patients`, { params }),
};

// § 1.8  Incidents (Node)
export const nodeIncidents = {
  list: (params) => nodeApi.get("/incidents", { params }),
  get: (id) => nodeApi.get(`/incidents/${id}`),
  create: (data) => nodeApi.post("/incidents", data),
  update: (id, data) => nodeApi.put(`/incidents/${id}`, data),
  remove: (id) => nodeApi.delete(`/incidents/${id}`),
};

// § 1.9  Triage (Node)
export const nodeTriage = {
  list: (params) => nodeApi.get("/triage", { params }),
  stats: () => nodeApi.get("/triage/stats"),
  patients: (params) => nodeApi.get("/triage/patients", { params }),
  get: (id) => nodeApi.get(`/triage/${id}`),
  create: (data) => nodeApi.post("/triage", data),
  update: (id, data) => nodeApi.put(`/triage/${id}`, data),
  addPatient: (data) => nodeApi.post("/triage/patient", data),
  updatePatient: (id, data) => nodeApi.put(`/triage/patient/${id}`, data),
};

// § 1.10  Responders (Node)
export const nodeResponders = {
  list: (params) => nodeApi.get("/responders", { params }),
  active: () => nodeApi.get("/responders/active"),
  stats: () => nodeApi.get("/responders/stats"),
  get: (id) => nodeApi.get(`/responders/${id}`),
  create: (data) => nodeApi.post("/responders", data),
  updateStatus: (id, data) => nodeApi.put(`/responders/${id}/status`, data),
  update: (id, data) => nodeApi.put(`/responders/${id}`, data),
};

// § 1.11  Resources (Node)
export const nodeResources = {
  list: (params) => nodeApi.get("/resources", { params }),
  summary: () => nodeApi.get("/resources/summary"),
  get: (id) => nodeApi.get(`/resources/${id}`),
  create: (data) => nodeApi.post("/resources", data),
  update: (id, data) => nodeApi.put(`/resources/${id}`, data),
  remove: (id) => nodeApi.delete(`/resources/${id}`),
};

// § 1.12  Reports (Node)
export const nodeReports = {
  list: (params) => nodeApi.get("/reports", { params }),
  get: (id) => nodeApi.get(`/reports/${id}`),
  create: (data) => nodeApi.post("/reports", data),
  update: (id, data) => nodeApi.put(`/reports/${id}`, data),
  remove: (id) => nodeApi.delete(`/reports/${id}`),
};

// § 1.13  Notifications (Node)
export const nodeNotifications = {
  list: (params) => nodeApi.get("/notifications", { params }),
  unread: () => nodeApi.get("/notifications/unread"),
  markAllRead: () => nodeApi.put("/notifications/read-all"),
  markRead: (id) => nodeApi.put(`/notifications/${id}/read`),
  create: (data) => nodeApi.post("/notifications", data),
  remove: (id) => nodeApi.delete(`/notifications/${id}`),
};

// § 1.14  QR Codes (Node)
export const nodeQr = {
  bind: (data) => nodeApi.post("/qr/bind", data),
  scan: (data) => nodeApi.post("/qr/scan", data),
  getByUser: (userId) => nodeApi.get(`/qr/user/${userId}`),
  regenerate: (data) => nodeApi.post("/qr/regenerate", data),
  updateStatus: (data) => nodeApi.post("/qr/status", data),
};

// § 1.15  Location (Node)
export const nodeLocation = {
  areas: () => nodeApi.get("/location/areas"),
  getCurrent: () => nodeApi.get("/location/current"),
  updateCurrent: (data) => nodeApi.post("/location/current", data),
};

// § 1.16  Logs (Node)
export const nodeLogs = {
  create: (data) => nodeApi.post("/logs", data),
  getByUser: (userId) => nodeApi.get(`/logs/${userId}`),
};

// § 1.17  Search (Node)
export const nodeSearch = {
  global: (params) => nodeApi.get("/search", { params }),
};

// § 1.18  Settings (Node)
export const nodeSettings = {
  get: () => nodeApi.get("/settings"),
  update: (data) => nodeApi.put("/settings", data),
};

// § 1.19  Training (Node)
export const nodeTraining = {
  progress: () => nodeApi.get("/training/progress"),
  updateProgress: (courseId, data) =>
    nodeApi.put(`/training/progress/${courseId}`, data),
  certifications: () => nodeApi.get("/training/certifications"),
  bulkUpdate: (data) => nodeApi.post("/training/update", data),
  getProgressByUser: (userId) => nodeApi.get(`/training/${userId}`),
};

// ---------------------------------------------------------------------------
// § 2  Laravel / Sanctum endpoints (port 8000)
// ---------------------------------------------------------------------------

// § 2.1  Public — Auth & Registration
export const auth = {
  register: (data) => api.post("/register", data),
  login: (data) => api.post("/login", data),
  forgotPassword: (data) => api.post("/forgot-password", data),
  health: () => api.get("/health"),
};

// § 2.2  Public — Read-Only Data
export const publicData = {
  hospitals: (params) => api.get("/hospitals", { params }),
  resources: (params) => api.get("/resources", { params }),
  reverseGeocode: (params) => api.get("/geocode/reverse", { params }),
  hospitalPatientDistribution: () =>
    api.get("/hospitals/patient-distribution"),
  dohHospitalReport: () => api.get("/reports/doh-hospital"),
  dohTriageReport: () => api.get("/reports/doh-triage"),
  pollIncidents: (params) => api.get("/incidents/poll", { params }),
};

// § 2.3  Public — Sensor Data
export const sensor = {
  latestVitals: (params) => api.get("/sensor/vitals/latest", { params }),
  vitalsHistory: (params) => api.get("/sensor/vitals/history", { params }),
  vitalsSummary: (params) => api.get("/sensor/vitals/summary", { params }),
  deviceStatus: () => api.get("/sensor/status"),
  ingestVitals: (data) => api.post("/sensor/vitals", data),
};

// § 2.4  Authenticated — Common
export const account = {
  logout: () => api.post("/logout"),
  me: () => api.get("/me"),
  updateProfile: (data) => api.put("/profile", data),
  verifyId: (data) => api.post("/verify-id", data),
  submitVerification: (data) => api.post("/submit-verification", data),
  notifications: (params) => api.get("/notifications", { params }),
  broadcastAuth: (data) => api.post("/broadcasting/auth", data),
};

// § 2.5  Authenticated — Health Simulator
export const simulator = {
  scenarios: () => api.get("/simulator/scenarios"),
  start: (data) => api.post("/simulator/start", data),
  stream: (data) => api.post("/simulator/stream", data),
  cleanup: () => api.delete("/simulator/cleanup"),
};

// § 2.6  Authenticated — Chat & NLP
export const chat = {
  conversations: (params) => api.get("/chat/conversations", { params }),
  messages: (userId, params) =>
    api.get(`/chat/messages/${userId}`, { params }),
  sendMessage: (data) => api.post("/chat/messages", data),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
};

export const nlp = {
  analyzeMessage: (data) => api.post("/nlp/analyze-message", data),
  urgencyCheck: (data) => api.post("/nlp/urgency-check", data),
  analyzeConversation: (data) => api.post("/nlp/analyze-conversation", data),
  bulkUrgency: (data) => api.post("/nlp/bulk-urgency", data),
  incidentAnalysis: (id) => api.get(`/nlp/incident/${id}/analysis`),
};

// § 2.7  Authenticated — Appointments & Route Logs
export const appointments = {
  book: (data) => api.post("/book-appointment", data),
  list: (params) => api.get("/appointments", { params }),
  cancel: (id) => api.delete(`/appointments/${id}`),
};

export const routeLogs = {
  create: (data) => api.post("/route-logs", data),
  storeDeviation: (id, data) => api.post(`/route-logs/${id}/deviations`, data),
  list: (params) => api.get("/route-logs", { params }),
};

// § 2.8  Authenticated — Gemini AI
export const gemini = {
  context: (data) => api.post("/gemini/context", data),
};

// § 2.9  Admin Only
export const adminUsers = {
  list: (params) => api.get("/admin/users", { params }),
  activate: (id) => api.put(`/admin/users/${id}/activate`),
  deactivate: (id) => api.put(`/admin/users/${id}/deactivate`),
  broadcastNotification: (data) => api.post("/notifications", data),
};

// § 2.10  Admin + Logistics — Requests & Allocations
export const requests = {
  list: (params) => api.get("/requests", { params }),
  create: (data) => api.post("/requests", data),
  get: (id) => api.get(`/requests/${id}`),
  saveDraft: (data) => api.post("/requests/draft", data),
  remove: (id) => api.delete(`/requests/${id}`),
  updateDraft: (id, data) => api.patch(`/requests/${id}/draft`, data),
  submitDraft: (id) => api.post(`/requests/${id}/submit`),
  markUnderReview: (id) => api.post(`/requests/${id}/under-review`),
};

export const allocations = {
  list: (params) => api.get("/allocations", { params }),
  create: (data) => api.post("/allocations", data),
  bulkCreate: (data) => api.post("/allocations/bulk", data),
  mine: (params) => api.get("/allocations/my", { params }),
  confirm: (id, data) => api.patch(`/allocations/${id}/confirm`, data),
  suggestions: (requestId) =>
    api.get(`/allocations/suggestions/${requestId}`),
  rejectSuggestion: (id) => api.delete(`/allocations/${id}/reject`),
  assign: (id, data) => api.patch(`/allocations/${id}/assign`, data),
  assignmentDetails: (id) =>
    api.get(`/allocations/${id}/assignment-details`),
  pendingCount: () => api.get("/allocations/pending/count"),
  myCount: () => api.get("/allocations/my/count"),
  details: (id) => api.get(`/allocations/${id}/details`),
  get: (id) => api.get(`/allocations/${id}`),
  assignment: (id) => api.get(`/allocations/${id}/assignment`),
  suggestVehicle: (id) => api.get(`/allocations/${id}/suggest-vehicle`),
  suggestResponder: (id) =>
    api.get(`/allocations/${id}/suggest-responder`),
  availableVehicles: (id) =>
    api.get(`/allocations/${id}/available-vehicles`),
  availableResponders: (id) =>
    api.get(`/allocations/${id}/available-responders`),
};

// § 2.11  Admin + Logistics — Assets
export const assets = {
  list: (params) => api.get("/assets", { params }),
  create: (data) => api.post("/assets", data),
  metrics: () => api.get("/assets/metrics"),
  exportCsv: () => api.get("/assets/export/csv"),
  available: (params) => api.get("/assets/available", { params }),
  get: (code) => api.get(`/assets/${code}`),
  update: (code, data) => api.put(`/assets/${code}`, data),
  remove: (code) => api.delete(`/assets/${code}`),
  adjustStock: (code, data) =>
    api.post(`/assets/${code}/adjust-stock`, data),
  availableResponders: () => api.get("/responders/available"),
};

// § 2.12  Admin + Logistics — Resources (Inventory)
export const resources = {
  list: (params) => api.get("/resources", { params }),
  create: (data) => api.post("/resources", data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  remove: (id) => api.delete(`/resources/${id}`),
  calendarEvents: (params) =>
    api.get("/resources/calendar/events", { params }),
  dateEvents: (date, params) =>
    api.get(`/resources/calendar/events/${date}`, { params }),
  history: (id, params) =>
    api.get(`/resources/${id}/history`, { params }),
  stockMovements: (params) =>
    api.get("/resources/stock-movements", { params }),
  adjustStock: (id, data) =>
    api.post(`/resources/${id}/adjust-stock`, data),
  lowStock: (params) => api.get("/resources/low-stock", { params }),
  critical: (params) => api.get("/resources/critical", { params }),
  expiring: (params) => api.get("/resources/expiring", { params }),
};

// § 2.13  Admin + Logistics — Hospitals (CRUD)
export const hospitals = {
  list: (params) => api.get("/hospitals", { params }),
  get: (id) => api.get(`/hospitals/${id}`),
  create: (data) => api.post("/hospitals", data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  remove: (id) => api.delete(`/hospitals/${id}`),
  patientDistribution: () => api.get("/hospitals/patient-distribution"),
};

// § 2.14  Admin + Logistics — Hospital Safety Index (HSI)
export const hsi = {
  dashboard: () => api.get("/hsi/dashboard"),
  hospitalCompliance: (id) =>
    api.get(`/hsi/hospitals/${id}/compliance`),
  simulateDisaster: (id, data) =>
    api.post(`/hsi/hospitals/${id}/simulate-disaster`, data),
  recalculateResilience: (id, data) =>
    api.post(`/hsi/hospitals/${id}/recalculate`, data),
  activateDisasterMode: (id, data) =>
    api.post(`/hsi/hospitals/${id}/disaster-mode/activate`, data),
  deactivateDisasterMode: (id, data) =>
    api.post(`/hsi/hospitals/${id}/disaster-mode/deactivate`, data),
  assessments: (id, params) =>
    api.get(`/hsi/hospitals/${id}/assessments`, { params }),
  storeAssessment: (id, data) =>
    api.post(`/hsi/hospitals/${id}/assessments`, data),
  getAssessment: (id) => api.get(`/hsi/assessments/${id}`),
  tanks: (hospitalId, params) =>
    api.get(`/hsi/hospitals/${hospitalId}/tanks`, { params }),
  storeTank: (hospitalId, data) =>
    api.post(`/hsi/hospitals/${hospitalId}/tanks`, data),
  updateTankLevel: (tankId, data) =>
    api.patch(`/hsi/tanks/${tankId}/level`, data),
  refillTank: (tankId, data) =>
    api.post(`/hsi/tanks/${tankId}/refill`, data),
  tankHistory: (tankId, params) =>
    api.get(`/hsi/tanks/${tankId}/history`, { params }),
  vendors: (hospitalId, params) =>
    api.get(`/hsi/hospitals/${hospitalId}/vendors`, { params }),
  storeVendor: (hospitalId, data) =>
    api.post(`/hsi/hospitals/${hospitalId}/vendors`, data),
  updateVendor: (vendorId, data) =>
    api.patch(`/hsi/vendors/${vendorId}`, data),
  triggerVendor: (vendorId, data) =>
    api.post(`/hsi/vendors/${vendorId}/trigger`, data),
  resilienceConfigs: (hospitalId, params) =>
    api.get(`/hsi/hospitals/${hospitalId}/resilience-configs`, { params }),
  storeResilienceConfig: (hospitalId, data) =>
    api.post(`/hsi/hospitals/${hospitalId}/resilience-configs`, data),
};

// § 2.15  Incidents & Responder Dispatch
export const incidents = {
  list: (params) => api.get("/incidents", { params }),
  get: (id) => api.get(`/incidents/${id}`),
  history: (id, params) => api.get(`/incidents/${id}/history`, { params }),
  roadBlockades: (params) => api.get("/road-blockades", { params }),
  conversation: (id, params) =>
    api.get(`/incidents/${id}/conversation`, { params }),
  hospitalRecommendations: (id) =>
    api.get(`/incidents/${id}/hospital-recommendations`),
  assign: (id, data) => api.post(`/incidents/${id}/assign`, data),
  updateStatus: (id, data) => api.post(`/incidents/${id}/status`, data),
  assignNearest: (data) => api.post("/incidents/assign-nearest", data),
  smartResponderRecommendations: (id) =>
    api.get(`/incidents/${id}/smart-responder-recommendations`),
  smartAutoAssign: (id, data) =>
    api.post(`/incidents/${id}/smart-auto-assign`, data),
};

// § 2.16  Road Blockades
export const roadBlockades = {
  list: (params) => api.get("/road-blockades", { params }),
  create: (data) => api.post("/road-blockades", data),
  update: (id, data) => api.put(`/road-blockades/${id}`, data),
  remove: (id) => api.delete(`/road-blockades/${id}`),
  routeBlockades: (data) => api.post("/road-blockades/route", data),
  removeBlockade: (id, data) =>
    api.patch(`/road-blockades/${id}/remove`, data),
};

// § 2.17  Patient-Specific
export const patient = {
  labResults: (params) => api.get("/lab-results", { params }),
  activeRescue: () => api.get("/rescue/active"),
  responderLocation: (incidentId) =>
    api.get(`/incidents/${incidentId}/responder-location`),
};

// § 2.18  Responder Location Tracking
export const responderTracking = {
  updateLocation: (incidentId, data) =>
    api.post(`/incidents/${incidentId}/responder-location`, data),
};

// § 2.19  Debug / Test (Dev Only)
export const debug = {
  reverbCheck: () => api.get("/debug/reverb"),
  broadcastAuthTest: (data) => api.post("/debug/broadcast-auth", data),
  testHospitals: () => api.get("/test/hospitals"),
  testResources: () => api.get("/test/resources"),
};

// ---------------------------------------------------------------------------
// Default export — Laravel/Sanctum client (preserves backward compatibility)
// ---------------------------------------------------------------------------
export default api;