export const INCIDENT_STATUS_OPTIONS = [
  { value: "reported", label: "Waiting Dispatch" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "en_route", label: "En Route to Incident" },
  { value: "on_scene", label: "On Scene" },
  { value: "transporting", label: "En Route to Hospital" },
  { value: "needs_support", label: "Needs Support" },
  { value: "resolved", label: "Resolved" },
  { value: "cancelled", label: "Cancelled" },
];

export const INCIDENT_STATUS_LABELS = INCIDENT_STATUS_OPTIONS.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {}
);

export const INCIDENT_STATUS_COLORS = {
  reported: "bg-red-100 text-red-700 border border-red-200",
  acknowledged: "bg-orange-100 text-orange-700 border border-orange-200",
  en_route: "bg-blue-100 text-blue-700 border border-blue-200",
  on_scene: "bg-purple-100 text-purple-700 border border-purple-200",
  transporting: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  needs_support: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
};

export const INCIDENT_STATUS_PRIORITIES = {
  reported: 1,
  acknowledged: 2,
  en_route: 3,
  on_scene: 4,
  transporting: 5,
  needs_support: 6,
  resolved: 7,
  cancelled: 8,
};

export const ACTIVE_INCIDENT_STATUSES = [
  "reported",
  "acknowledged",
  "en_route",
  "on_scene",
  "transporting",
  "needs_support",
];
