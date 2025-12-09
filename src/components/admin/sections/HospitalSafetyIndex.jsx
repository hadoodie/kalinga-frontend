import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle,
  Droplets,
  Fuel,
  RefreshCw,
  TrendingUp,
  Wind,
  XCircle,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import {
  HSI_CONSTANTS,
  createAssessment,
  formatSurvivalHours,
  getHsiDashboard,
  getHospitalCompliance,
  getSafetyCategoryInfo,
  triggerVendor,
} from "@/services/hsiApi";
import hospitalService from "@/services/hospitalService";

const RESILIENCE_THRESHOLDS = {
  water: HSI_CONSTANTS.WATER_MINIMUM_HOURS,
  fuel: HSI_CONSTANTS.FUEL_MINIMUM_HOURS,
  oxygen: HSI_CONSTANTS.OXYGEN_MINIMUM_HOURS,
};

const resourceLabels = {
  water: "Water",
  fuel: "Fuel",
  oxygen: "Oxygen",
};

const hazardCategoryLabels = {
  geological: "Geological hazards",
  hydro_meteorological: "Hydro-meteorological",
  biological: "Biological / societal",
};

const severityColors = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-100",
  B: "bg-amber-50 text-amber-700 border-amber-100",
  C: "bg-rose-50 text-rose-700 border-rose-100",
};

const CHECKLIST_SCORE_MAP = {
  compliant: 1,
  partial: 0.5,
  non_compliant: 0,
};

const CHECKLIST_RESPONSES = [
  { value: "compliant", label: "Compliant", color: "emerald" },
  { value: "partial", label: "Partial", color: "amber" },
  { value: "non_compliant", label: "Non-compliant", color: "rose" },
];

const MODULE_WEIGHTINGS = {
  structural: 0.5,
  non_structural: 0.3,
  emergency: 0.2,
};

const HSI_CHECKLIST = [
  {
    id: "structural",
    label: "Structural safety",
    description: "Load-bearing systems, envelope, and seismic readiness",
    weight: MODULE_WEIGHTINGS.structural,
    questions: [
      {
        id: "structural-system",
        label: "Primary structural system rated for the current seismic zone",
        helper: "As-built drawings stamped by a licensed engineer and hazard maps on file",
      },
      {
        id: "soil-investigation",
        label: "Geotechnical study updated within 10 years",
        helper: "Includes liquefaction, flooding, and landslide screening",
      },
      {
        id: "critical-cracks",
        label: "No critical cracks, tilting, or settlement observed",
        helper: "Last visual inspection completed within 6 months",
      },
      {
        id: "retrofit-log",
        label: "Structural retrofits documented and closed out",
        helper: "Action plans exist for every deficiency found by DOH/WHO tools",
      },
      {
        id: "roof-anchorage",
        label: "Roof, ceilings, and heavy components are anchored/braced",
        helper: "Includes water tanks, solar racks, and parapets",
      },
      {
        id: "lifelines-protected",
        label: "Stairwells, ramps, and egress paths structurally protected",
        helper: "No spalling or obstructions that would block evacuations",
      },
      {
        id: "structural-damage-log",
        label: "Damage log maintained after each event",
        helper: "Rapid assessment SOP and responsible engineer identified",
      },
    ],
  },
  {
    id: "non_structural",
    label: "Non-structural systems",
    description: "Utilities, critical equipment, and architectural elements",
    weight: MODULE_WEIGHTINGS.non_structural,
    questions: [
      {
        id: "equipment-anchorage",
        label: "Critical equipment and shelves anchored or restrained",
        helper: "Covers imaging suites, ICU devices, and storage racks",
      },
      {
        id: "utilities-redundancy",
        label: "Power, water, medical gas, and ICT utilities have redundancy",
        helper: "Automatic transfer switches tested within 30 days",
      },
      {
        id: "medical-gas-monitoring",
        label: "Medical gas manifolds monitored and alarmed",
        helper: "Pressure and purity sensors calibrated and logged",
      },
      {
        id: "flood-proofing",
        label: "Critical supplies elevated or flood-proofed",
        helper: "High-value stores lifted above design flood elevation",
      },
      {
        id: "fire-protection",
        label: "Fire detection and suppression systems inspected",
        helper: "BFP or accredited vendor inspection within 6 months",
      },
      {
        id: "it-backups",
        label: "EHR/ICS systems have offline backups and generators",
        helper: "Daily backups replicated off-site",
      },
      {
        id: "supply-chain-buffers",
        label: "At least 7-day buffer for critical consumables",
        helper: "Medicines, PPE, and reagents tracked with min/max levels",
      },
      {
        id: "ceiling-partitions",
        label: "Ceilings, partitions, and signage braced",
        helper: "Non-structural elements won't block egress routes",
      },
    ],
  },
  {
    id: "emergency",
    label: "Emergency management",
    description: "Command, communications, and surge protocols",
    weight: MODULE_WEIGHTINGS.emergency,
    questions: [
      {
        id: "ics-structure",
        label: "Incident Command System is designated with deputies",
        helper: "Role cards posted and succession documented",
      },
      {
        id: "hazard-specific-playbooks",
        label: "Hazard-specific playbooks (earthquake, flood, fire) are current",
        helper: "Reviewed with LGU/DRRMO counterparts",
      },
      {
        id: "evacuation-plan",
        label: "Evacuation and shelter plans tested in the last 12 months",
        helper: "Covers bedridden, NICU, and psychiatric patients",
      },
      {
        id: "surge-triage",
        label: "Triage and surge areas pre-designated with equipment",
        helper: "Color-coded routes and signage ready",
      },
      {
        id: "communications",
        label: "Redundant communication channels (radio/SMS/sat) ready",
        helper: "Weekly radio checks logged",
      },
      {
        id: "mutual-aid",
        label: "Mutual aid MOUs executed with nearby facilities",
        helper: "Patient transfer triggers and contact lists validated",
      },
      {
        id: "training-drills",
        label: "Staff drills completed with documented after-action review",
        helper: "Corrective actions tracked to closure",
      },
      {
        id: "after-action-tracking",
        label: "After-action items tracked in a governance meeting",
        helper: "HSI committee meets at least quarterly",
      },
    ],
  },
];

const deriveCategoryFromScore = (score) => {
  if (score >= HSI_CONSTANTS.SAFETY_CATEGORIES.A.min) return "A";
  if (score >= HSI_CONSTANTS.SAFETY_CATEGORIES.B.min) return "B";
  return "C";
};

const computeChecklistScores = (answers) => {
  const moduleScores = {};
  let weightedSum = 0;

  HSI_CHECKLIST.forEach((module) => {
    const moduleAnswers = answers[module.id] || {};
    const total = module.questions.length;
    if (!total) {
      moduleScores[module.id] = 0;
      return;
    }
    const answered = module.questions.reduce((sum, question) => {
      const value = moduleAnswers[question.id];
      const score = CHECKLIST_SCORE_MAP[value] ?? null;
      if (score === null) return sum;
      return sum + score;
    }, 0);
    const percent = Math.round((answered / total) * 100);
    moduleScores[module.id] = percent;
    weightedSum += percent * (module.weight ?? 0);
  });

  const overallIndex = Math.round(weightedSum);
  return {
    moduleScores,
    overallIndex,
    category: deriveCategoryFromScore(overallIndex),
  };
};

const isChecklistComplete = (answers) =>
  HSI_CHECKLIST.every((module) =>
    module.questions.every((question) =>
      Boolean(answers?.[module.id]?.[question.id])
    )
  );

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    destructive: "bg-red-100 text-red-700 border-red-200",
    secondary: "bg-slate-50 text-slate-500 border-slate-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

const ProgressBar = ({ value, color = "bg-emerald-500" }) => (
  <div className="h-2 w-full rounded-full bg-slate-200">
    <div
      className={`h-2 rounded-full transition-all duration-300 ${color}`}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

const HazardPill = ({ label }) => (
  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
    {label}
  </span>
);

const ModuleCard = ({ module }) => (
  <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {module.title || "Module"}
        </p>
        {module.weight && (
          <p className="text-xs text-slate-400">Weight {module.weight}</p>
        )}
      </div>
      <div className="text-right">
        {typeof module.score === "number" && (
          <p className="text-3xl font-bold text-slate-900">
            {module.score}%
          </p>
        )}
        {module.status && (
          <Badge variant={getStatusVariant(module.status)}>
            {module.status}
          </Badge>
        )}
      </div>
    </div>
    {module.description && (
      <p className="mt-3 text-sm text-slate-600">{module.description}</p>
    )}
    {module.recommendations?.length ? (
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {module.recommendations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : null}
  </div>
);

const ModulePlaceholder = () => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
    No assessment modules available for this facility yet.
  </div>
);

const getStatusVariant = (status = "") => {
  const normalized = status.toLowerCase();
  if (normalized.includes("critical")) return "destructive";
  if (
    normalized.includes("watch") ||
    normalized.includes("attention") ||
    normalized.includes("needs") ||
    normalized.includes("develop")
  ) {
    return "warning";
  }
  return "success";
};

const normalizeHospitals = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.hospitals)) return payload.hospitals;
  if (Array.isArray(payload)) return payload;
  return [];
};

const computePercent = (value, required) => {
  if (!value || !required) return 0;
  return Math.round(Math.min((value / required) * 100, 160));
};

const ResourceStatusCard = ({
  title,
  icon: Icon,
  current,
  required,
}) => {
  const percent = required > 0 ? Math.min((current / required) * 100, 160) : 0;
  const isCompliant = current >= required;
  const accent = isCompliant ? "success" : "destructive";
  const gradient = isCompliant
    ? "from-emerald-50 via-white"
    : "from-red-50 via-white";

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${gradient} p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={`h-5 w-5 ${
              isCompliant ? "text-emerald-600" : "text-red-500"
            }`}
          />
          <p className="text-sm font-medium text-slate-600">{title}</p>
        </div>
        <Badge variant={accent}>
          {isCompliant ? "Meets HSI" : "Needs action"}
        </Badge>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Current autonomy</span>
          <span className="font-semibold text-slate-900">
            {formatSurvivalHours(current)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">HSI requirement</span>
          <span className="font-semibold text-slate-900">
            {formatSurvivalHours(required)}
          </span>
        </div>
        <ProgressBar
          color={isCompliant ? "bg-emerald-500" : "bg-red-500"}
          value={percent}
        />
        <p className="text-xs text-slate-500">
          {Math.round(percent)}% of minimum requirement
        </p>
      </div>
    </div>
  );
};

const AssessmentDetailsPanel = ({ details, onClose }) => {
  if (!details) return null;
  const catchment = details.general_info?.catchment_facilities || [];
  const hazards = Object.entries(details.hazards || {});
  const modules = details.modules || [];
  const resilienceAlerts = details.resilience_alerts || [];
  const vendorPlaybooks = details.vendor_playbooks || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 text-left shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">
            DOH / WHO assessment breakdown
          </p>
          <p className="text-sm text-slate-500">
            Covers General Information plus Modules 1-4 of the Hospital Safety
            Index.
          </p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <XCircle className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Routine capacity
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {details.general_info?.routine_capacity?.beds ?? "-"} beds
          </p>
          <p className="text-xs text-slate-500">
            {details.general_info?.routine_capacity?.staff ?? "-"} staff
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Maximum (surge) capacity
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {details.general_info?.maximum_capacity?.beds ?? "-"} beds
          </p>
          <p className="text-xs text-slate-500">
            {details.general_info?.maximum_capacity?.staff ?? "-"} staff
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Surge multiplier
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {details.general_info?.surge_multiplier ?? "-"}x
          </p>
          <p className="text-xs text-slate-500">
            Consumption factor when in disaster mode
          </p>
        </div>
      </div>

      {catchment.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">
            Catchment facilities
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catchment.map((facility) => (
              <div
                key={`${facility.name}-${facility.distance_km}`}
                className="rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600"
              >
                <p className="font-medium text-slate-800">{facility.name}</p>
                <p className="text-xs text-slate-500">
                  {facility.distance_km
                    ? `${Number(facility.distance_km).toFixed(1)} km`
                    : "Distance n/a"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hazards.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {hazards.map(([category, items]) => (
            <div
              key={category}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {hazardCategoryLabels[category] || category}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(items || []).map((hazard) => (
                  <HazardPill key={hazard} label={hazard} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modules.length > 0 ? (
        <div className="mt-6 space-y-4">
          {modules.map((module) => (
            <ModuleCard key={module.id || module.title} module={module} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <ModulePlaceholder />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Resilience alerts
          </p>
          <div className="mt-3 space-y-3">
            {resilienceAlerts.length ? (
              resilienceAlerts.map((alert) => (
                <div
                  key={`${alert.resource}-${alert.note}`}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      {alert.resource}
                    </span>
                    <Badge variant={getStatusVariant(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{alert.note}</p>
                  <p className="text-xs text-slate-500">
                    {alert.recommendation}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No alerts logged.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Vendor MOUs & auto-trigger status
          </p>
          <div className="mt-3 space-y-3">
            {vendorPlaybooks.length ? (
              vendorPlaybooks.map((vendor) => (
                <div
                  key={vendor.id || vendor.mou || vendor.name}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {vendor.name}
                    </span>
                    <Badge variant={vendor.auto ? "success" : "secondary"}>
                      {vendor.auto ? "Auto-trigger" : "Manual"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Resource: {vendor.resource || "N/A"}
                  </p>
                  {vendor.mou && (
                    <p className="text-xs text-slate-500">MOU {vendor.mou}</p>
                  )}
                  {vendor.contact && (
                    <p className="text-xs text-slate-500">{vendor.contact}</p>
                  )}
                  {vendor.status && (
                    <p className="text-xs text-slate-500">
                      Status: {vendor.status}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                No vendor playbooks configured.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HospitalSafetyIndexSection = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalCompliance, setHospitalCompliance] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [assessmentFeedback, setAssessmentFeedback] = useState(null);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.5);
  const [lastAutoTrigger, setLastAutoTrigger] = useState(null);
  const [error, setError] = useState(null);
  const [complianceError, setComplianceError] = useState(null);

  const assessmentDetails = hospitalCompliance?.assessment_details ?? null;

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await getHsiDashboard();
      const payload = response?.data?.data || response?.data || null;
      setDashboardData(payload);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch HSI dashboard", err);
      setDashboardData(null);
      setError("Unable to load dashboard metrics. Please retry.");
    }
  }, []);

  const fetchHospitals = useCallback(async () => {
    try {
      const response = await hospitalService.getAll();
      const normalized = normalizeHospitals(response);
      setHospitals(normalized);
      if (normalized.length) {
        setSelectedHospital((prev) => prev ?? normalized[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch hospitals", err);
      setHospitals([]);
      setError((prev) => prev ?? "Unable to load hospital directory.");
    }
  }, []);

  const fetchHospitalCompliance = useCallback(
    async (hospitalId) => {
      if (!hospitalId) {
        setHospitalCompliance(null);
        return;
      }
      try {
        const response = await getHospitalCompliance(hospitalId);
        const payload = response?.data?.data || response?.data || null;
        setHospitalCompliance(payload);
        setComplianceError(null);
        if (payload?.assessment_details?.general_info?.surge_multiplier) {
          setSurgeMultiplier(
            payload.assessment_details.general_info.surge_multiplier
          );
        }
      } catch (err) {
        console.error("Failed to fetch hospital compliance", err);
        setHospitalCompliance(null);
        setComplianceError(
          "Compliance data unavailable for the selected hospital."
        );
      }
    },
    []
  );

  useEffect(() => {
    let ignore = false;
    const bootstrap = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchDashboardData(), fetchHospitals()]);
      } catch (err) {
        console.error("HSI bootstrap failed", err);
        setError((prev) => prev ?? "Unable to load hospital safety data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      ignore = true;
    };
  }, [fetchDashboardData, fetchHospitals]);

  useEffect(() => {
    if (!selectedHospital) return;
    fetchHospitalCompliance(selectedHospital);
    setShowAssessmentDetails(false);
    setLastAutoTrigger(null);
    setShowAssessmentForm(false);
    setAssessmentAnswers({});
    setAssessmentNotes("");
    setAssessmentFeedback(null);
  }, [fetchHospitalCompliance, selectedHospital]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchHospitals(),
      selectedHospital ? fetchHospitalCompliance(selectedHospital) : null,
    ]);
    setRefreshing(false);
  };

  const resourcePercents = useMemo(() => {
    if (!hospitalCompliance) return null;
    return {
      water: computePercent(
        hospitalCompliance?.water?.survival_hours,
        HSI_CONSTANTS.WATER_MINIMUM_HOURS
      ),
      fuel: computePercent(
        hospitalCompliance?.fuel?.survival_hours,
        HSI_CONSTANTS.FUEL_MINIMUM_HOURS
      ),
      oxygen: computePercent(
        hospitalCompliance?.oxygen?.survival_hours,
        HSI_CONSTANTS.OXYGEN_MINIMUM_HOURS
      ),
    };
  }, [hospitalCompliance]);

  const checklistScores = useMemo(
    () => computeChecklistScores(assessmentAnswers),
    [assessmentAnswers]
  );

  const checklistComplete = useMemo(
    () => isChecklistComplete(assessmentAnswers),
    [assessmentAnswers]
  );

  const simulateSurvivalHours = (resourceKey) => {
    const baseHours = hospitalCompliance?.[resourceKey]?.survival_hours;
    if (!baseHours || !surgeMultiplier) return 0;
    return Math.max(Math.round(baseHours / surgeMultiplier), 0);
  };

  const getVendorForResource = (resourceKey) =>
    assessmentDetails?.vendor_playbooks?.find((vendor) =>
      vendor.resource
        ? vendor.resource.toLowerCase() === resourceKey
        : false
    );

  const handleAutoTrigger = async (resourceKey) => {
    const vendor = getVendorForResource(resourceKey);
    const resourceLabel = resourceLabels[resourceKey] || resourceKey;
    if (!vendor) {
      setLastAutoTrigger(`No vendor playbook configured for ${resourceLabel}.`);
      return;
    }

    try {
      if (vendor.id) {
        await triggerVendor(vendor.id);
      }
      setLastAutoTrigger(
        `Auto-triggered ${vendor.name} for ${resourceLabel}. Dispatch notified.`
      );
    } catch (err) {
      console.error("Failed to trigger vendor", err);
      setLastAutoTrigger(
        `Unable to trigger ${vendor.name || resourceLabel}. Please try again.`
      );
    }
  };

  const getResilienceStatus = (resourceKey) => {
    const hours = simulateSurvivalHours(resourceKey);
    const threshold = RESILIENCE_THRESHOLDS[resourceKey];
    if (!threshold) {
      return { variant: "secondary", label: "N/A", hours, threshold: 0 };
    }
    if (hours >= threshold) {
      return { variant: "success", label: "Meets HSI", hours, threshold };
    }
    if (hours >= threshold * 0.8) {
      return { variant: "warning", label: "Watch", hours, threshold };
    }
    return { variant: "destructive", label: "Critical", hours, threshold };
  };

  const handleChecklistAnswer = (moduleId, questionId, value) => {
    setAssessmentAnswers((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [questionId]: value,
      },
    }));
    setAssessmentFeedback(null);
  };

  const resetAssessmentForm = () => {
    setAssessmentAnswers({});
    setAssessmentNotes("");
  };

  const handleAssessmentSubmit = async () => {
    if (!selectedHospital) return;
    if (!checklistComplete) {
      setAssessmentFeedback({
        type: "error",
        message: "Complete all checklist items before saving.",
      });
      return;
    }

    const { moduleScores, overallIndex, category } = checklistScores;
    const checklistPayload = HSI_CHECKLIST.map((module) => ({
      id: module.id,
      label: module.label,
      score: moduleScores[module.id] || 0,
      answers: module.questions.map((question) => ({
        id: question.id,
        label: question.label,
        value: assessmentAnswers?.[module.id]?.[question.id] || "not_recorded",
      })),
    }));

    setAssessmentSubmitting(true);
    try {
      await createAssessment(selectedHospital, {
        overall_index: overallIndex,
        structural_score: moduleScores.structural || 0,
        non_structural_score: moduleScores.non_structural || 0,
        emergency_mgmt_score: moduleScores.emergency || 0,
        category,
        notes: assessmentNotes,
        checklist: checklistPayload,
        conducted_at: new Date().toISOString(),
        conducted_via: "Admin console checklist",
      });

      await fetchHospitalCompliance(selectedHospital);
      setAssessmentFeedback({
        type: "success",
        message: "Assessment saved and compliance metrics refreshed.",
      });
      setShowAssessmentForm(false);
      resetAssessmentForm();
    } catch (err) {
      console.error("Failed to save assessment", err);
      setAssessmentFeedback({
        type: "error",
        message: "Unable to save assessment. Please retry.",
      });
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card/80 p-10 text-center shadow-sm">
        <div className="flex items-center justify-center gap-3 text-foreground/70">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading hospital safety data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Hospital Safety Index"
        description="WHO / DOH compliance view with real-time resource survivability metrics."
        actions={
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {dashboardData ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Total hospitals</span>
              <Building2 className="h-4 w-4" />
            </div>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {dashboardData.total_hospitals ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {dashboardData.hospitals_in_disaster_mode ?? 0} in disaster mode
            </p>
          </div>

          {["A", "B", "C"].map((category) => (
            <div
              key={category}
              className={`rounded-2xl border bg-white/90 p-5 shadow-sm ${
                severityColors[category]
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span>
                  Category {category} ({
                    getSafetyCategoryInfo(category)?.label || ""
                  })
                </span>
                {category === "A" && <CheckCircle className="h-4 w-4" />}
                {category === "B" && <AlertTriangle className="h-4 w-4" />}
                {category === "C" && <AlertOctagon className="h-4 w-4" />}
              </div>
              <p className="mt-2 text-4xl font-bold">
                {dashboardData.safety_categories?.[category] ?? 0}
              </p>
              <p className="mt-1 text-xs">
                {category === "A" && "Likely to remain functional"}
                {category === "B" && "Intervention recommended"}
                {category === "C" && "Urgent action required"}
              </p>
            </div>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-sm text-slate-500">
          No dashboard metrics available.
        </div>
      )}

      {dashboardData?.total_critical_alerts > 0 && (
        <section className="rounded-3xl border border-red-100 bg-gradient-to-r from-red-50 via-white to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-red-700">
            <AlertOctagon className="h-5 w-5" />
            Critical alerts ({dashboardData.total_critical_alerts})
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(dashboardData.critical_resources || {}).map(
              ([category, data]) => (
                <div
                  key={category}
                  className="rounded-2xl border border-red-100 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-800">
                        {category.replace("_", " ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Array.isArray(data?.hospitals)
                          ? data.hospitals.join(", ")
                          : ""}
                      </p>
                    </div>
                    <Badge variant="destructive">{data?.count ?? 0} flagged</Badge>
                  </div>
                </div>
              )
            )}
            {Object.entries(dashboardData.critical_tanks || {}).map(
              ([category, data]) => (
                <div
                  key={category}
                  className="rounded-2xl border border-red-100 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-800">
                        {category.replace("_", " ")} tanks
                      </p>
                      <p className="text-xs text-slate-500">
                        {Array.isArray(data?.hospitals)
                          ? data.hospitals.join(", ")
                          : ""}
                      </p>
                    </div>
                    <Badge variant="destructive">{data?.count ?? 0} flagged</Badge>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Hospital compliance details
            </p>
            <p className="text-sm text-slate-500">
              Track survivability, vendors, and WHO module performance per site.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hospitals.length > 0 ? (
              <select
                value={(selectedHospital ?? "").toString()}
                onChange={(e) => setSelectedHospital(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-slate-500">
                No hospitals available
              </span>
            )}
            {hospitalCompliance?.assessment?.category && (
              <Badge variant="success">
                Category {hospitalCompliance.assessment.category}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-2 border-b border-slate-200 text-sm font-medium text-slate-500">
            {["overview", "resources", "assessment"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-t-xl px-4 py-2 capitalize transition-all ${
                  activeTab === tab
                    ? "border border-b-white border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {complianceError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
                {complianceError}
              </div>
            )}

            {hospitalCompliance ? (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Safety index</p>
                        <div className="mt-2 flex items-end gap-3">
                          <span className="text-4xl font-bold text-slate-900">
                            {hospitalCompliance.assessment?.overall_index?.toFixed(
                              1
                            ) || "N/A"}
                          </span>
                          {hospitalCompliance.assessment?.category && (
                            <Badge variant="secondary">
                              Category {hospitalCompliance.assessment.category}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Updated {" "}
                          {hospitalCompliance.assessment?.date
                            ? new Date(
                                hospitalCompliance.assessment.date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Bed capacity</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {hospitalCompliance.capacity?.routine_beds || 0} / {" "}
                          {hospitalCompliance.capacity?.maximum_beds || 0}
                        </p>
                        <div className="mt-2">
                          {hospitalCompliance.capacity?.disaster_mode_active ? (
                            <Badge variant="warning">Disaster mode active</Badge>
                          ) : (
                            <Badge variant="success">Normal operations</Badge>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                          Vendor agreements
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {hospitalCompliance.vendor_agreements?.active || 0}
                        </p>
                        <p className="text-xs text-slate-500">
                          {hospitalCompliance.vendor_agreements?.auto_trigger_enabled ||
                            0} {" "}
                          with auto-trigger
                        </p>
                      </div>
                    </div>

                    {hospitalCompliance.assessment && (
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Activity className="h-4 w-4 text-emerald-600" />
                          WHO module performance
                        </div>
                        <p className="text-xs text-slate-500">
                          Structural (50%) · Non-Structural (30%) · Emergency
                          Management (20%)
                        </p>
                        <div className="mt-4 space-y-4">
                          {[
                            {
                              label: "Structural safety",
                              value:
                                hospitalCompliance.assessment.structural_score,
                            },
                            {
                              label: "Non-structural safety",
                              value:
                                hospitalCompliance.assessment
                                  .non_structural_score,
                            },
                            {
                              label: "Emergency management",
                              value:
                                hospitalCompliance.assessment
                                  .emergency_mgmt_score,
                            },
                          ].map((metric) => (
                            <div key={metric.label}>
                              <div className="flex items-center justify-between text-sm">
                                <span>{metric.label}</span>
                                <span className="font-semibold text-slate-800">
                                  {metric.value?.toFixed?.(1) ?? "0.0"}%
                                </span>
                              </div>
                              <ProgressBar value={metric.value || 0} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resourcePercents && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                          <p className="text-sm text-slate-500">
                            Water autonomy
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {resourcePercents.water}%
                          </p>
                          <p className="text-xs text-slate-500">vs 72h standard</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                          <p className="text-sm text-slate-500">
                            Fuel autonomy
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {resourcePercents.fuel}%
                          </p>
                          <p className="text-xs text-slate-500">vs 72h standard</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                          <p className="text-sm text-slate-500">
                            Oxygen autonomy
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {resourcePercents.oxygen || 0}%
                          </p>
                          <p className="text-xs text-slate-500">
                            vs 15-day standard
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <ResourceStatusCard
                        title="Water reserve"
                        icon={Droplets}
                        current={hospitalCompliance.water?.survival_hours || 0}
                        required={HSI_CONSTANTS.WATER_MINIMUM_HOURS}
                      />
                      <ResourceStatusCard
                        title="Fuel reserve"
                        icon={Fuel}
                        current={hospitalCompliance.fuel?.survival_hours || 0}
                        required={HSI_CONSTANTS.FUEL_MINIMUM_HOURS}
                      />
                      {hospitalCompliance.oxygen && (
                        <ResourceStatusCard
                          title="Oxygen reserve"
                          icon={Wind}
                          current={hospitalCompliance.oxygen.survival_hours || 0}
                          required={HSI_CONSTANTS.OXYGEN_MINIMUM_HOURS}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          Water tanks
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <div className="flex justify-between">
                            <span>Count</span>
                            <span>{hospitalCompliance.water?.tank_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total volume</span>
                            <span>
                              {(hospitalCompliance.water?.total_liters || 0).toLocaleString()} L
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Required for 72h</span>
                            <span>
                              {(hospitalCompliance.water?.required_72h_liters || 0).toLocaleString()} L
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Fuel className="h-4 w-4 text-amber-500" />
                          Fuel tanks
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <div className="flex justify-between">
                            <span>Count</span>
                            <span>{hospitalCompliance.fuel?.tank_count || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total volume</span>
                            <span>
                              {(hospitalCompliance.fuel?.total_liters || 0).toLocaleString()} L
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily usage</span>
                            <span>
                              {(hospitalCompliance.fuel?.daily_usage_liters || 0).toLocaleString()} L/day
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {hospitalCompliance.generator && (
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-700">
                          Generator readiness
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">
                              {hospitalCompliance.generator.starts_within_10s ? "✓" : "✗"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Starts within 10s
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">
                              {hospitalCompliance.generator.coverage_percent}%
                            </p>
                            <p className="text-xs text-slate-500">Load coverage</p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">
                              {formatSurvivalHours(
                                hospitalCompliance.generator.fuel_reserve_hours
                              )}
                            </p>
                            <p className="text-xs text-slate-500">Fuel reserve</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Resilience-based inventory
                          </p>
                          <p className="text-xs text-slate-500">
                            Survival hours computed per DOH HSI (72-hour fuel/water, 15-day oxygen).
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>Disaster surge multiplier</span>
                          <input
                            type="range"
                            min="1"
                            max="2"
                            step="0.1"
                            value={surgeMultiplier}
                            onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                            className="accent-emerald-600"
                          />
                          <span className="font-semibold text-slate-800">
                            {surgeMultiplier.toFixed(1)}x
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        {["water", "fuel", "oxygen"].map((resourceKey) => {
                          if (!hospitalCompliance?.[resourceKey]) return null;
                          const status = getResilienceStatus(resourceKey);
                          return (
                            <div
                              key={resourceKey}
                              className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800">
                                  {resourceLabels[resourceKey]}
                                </span>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              <p className="mt-2 text-3xl font-bold text-slate-900">
                                {status.hours}h
                              </p>
                              <p className="text-xs text-slate-500">
                                HSI minimum {status.threshold}h
                              </p>
                              {status.variant === "destructive" && (
                                <button
                                  onClick={() => handleAutoTrigger(resourceKey)}
                                  className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                  Auto-trigger vendor
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {lastAutoTrigger && (
                        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600">
                          {lastAutoTrigger}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "assessment" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-sm">
                      {hospitalCompliance.assessment ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-500">
                            Conducted on {" "}
                            {new Date(
                              hospitalCompliance.assessment.date
                            ).toLocaleDateString()}
                          </p>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                            <p className="text-sm uppercase tracking-wide text-slate-500">
                              Overall safety index
                            </p>
                            <p className="mt-2 text-4xl font-bold text-slate-900">
                              {hospitalCompliance.assessment.overall_index?.toFixed(1)}
                            </p>
                            <div className="mt-2">
                              <Badge variant="secondary">
                                Category {hospitalCompliance.assessment.category}
                              </Badge>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAssessmentDetails((prev) => !prev)}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <TrendingUp className="h-4 w-4" />
                            {showAssessmentDetails
                              ? "Hide assessment breakdown"
                              : "View full assessment report"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
                          <p className="mt-3 text-sm text-slate-500">
                            No assessment on record
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            WHO / DOH-aligned checklist
                          </p>
                          <p className="text-sm text-slate-600">
                            Score each module to compute a fresh Hospital Safety Index category.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setShowAssessmentForm((prev) => !prev);
                              setAssessmentFeedback(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            {showAssessmentForm ? "Hide checklist" : "Launch checklist"}
                          </button>
                        </div>
                      </div>

                      {assessmentFeedback && (
                        <div
                          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                            assessmentFeedback.type === "error"
                              ? "border border-rose-200 bg-rose-50 text-rose-700"
                              : "border border-emerald-200 bg-white text-emerald-700"
                          }`}
                        >
                          {assessmentFeedback.message}
                        </div>
                      )}

                      {showAssessmentForm && (
                        <div className="mt-6 space-y-6">
                          <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Response legend
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs">
                              {CHECKLIST_RESPONSES.map((option) => (
                                <div
                                  key={`legend-${option.value}`}
                                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600"
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      option.color === "emerald"
                                        ? "bg-emerald-500"
                                        : option.color === "amber"
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                  />
                                  <span className="font-semibold">
                                    {option.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              Compliant = fully meets WHO/DOH requirement · Partial = controls exist but need follow-up · Non-compliant = absent, outdated, or unverified.
                            </p>
                          </div>

                          {HSI_CHECKLIST.map((module) => {
                            const moduleScore =
                              checklistScores.moduleScores?.[module.id] ?? 0;
                            return (
                              <div
                                key={module.id}
                                className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm"
                              >
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {module.label}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {module.description}
                                    </p>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-600">
                                    Score {moduleScore}%
                                  </div>
                                </div>
                                <div className="mt-4 space-y-4">
                                  {module.questions.map((question) => {
                                    const selected =
                                      assessmentAnswers?.[module.id]?.[question.id];
                                    return (
                                      <div
                                        key={question.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                                      >
                                        <p className="text-sm font-medium text-slate-800">
                                          {question.label}
                                        </p>
                                        {question.helper && (
                                          <p className="mt-1 text-xs text-slate-500">
                                            {question.helper}
                                          </p>
                                        )}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {CHECKLIST_RESPONSES.map((option) => {
                                            const isActive = selected === option.value;
                                            const palette = {
                                              emerald:
                                                "border-emerald-400 bg-emerald-100 text-emerald-700",
                                              amber:
                                                "border-amber-400 bg-amber-100 text-amber-700",
                                              rose:
                                                "border-rose-400 bg-rose-100 text-rose-700",
                                            }[option.color];
                                            return (
                                              <button
                                                key={option.value}
                                                type="button"
                                                onClick={() =>
                                                  handleChecklistAnswer(
                                                    module.id,
                                                    question.id,
                                                    option.value
                                                  )
                                                }
                                                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                                                  isActive
                                                    ? palette
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                                }`}
                                              >
                                                {option.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                            <label className="text-sm font-semibold text-slate-800">
                              Field notes / corrective actions
                            </label>
                            <textarea
                              value={assessmentNotes}
                              onChange={(e) => setAssessmentNotes(e.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              rows={3}
                              placeholder="Document observations, pending retrofits, or coordination notes"
                            />
                          </div>

                          <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  Provisional category
                                </p>
                                <p className="text-xs text-slate-500">
                                  Weighted per WHO guidance (50/30/20).
                                </p>
                              </div>
                              <Badge variant="secondary">
                                Category {checklistScores.category}
                              </Badge>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              {HSI_CHECKLIST.map((module) => (
                                <div key={`${module.id}-summary`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                  <p className="text-xs text-slate-500">{module.label}</p>
                                  <p className="text-2xl font-bold text-slate-900">
                                    {checklistScores.moduleScores?.[module.id] ?? 0}%
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                            <p>
                              {checklistComplete
                                ? "Ready to publish assessment to the backend."
                                : "Answer all checklist rows to enable publishing."}
                            </p>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={resetAssessmentForm}
                                className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:bg-white"
                                disabled={assessmentSubmitting}
                              >
                                Reset form
                              </button>
                              <button
                                type="button"
                                onClick={handleAssessmentSubmit}
                                disabled={assessmentSubmitting || !checklistComplete}
                                className={`rounded-full px-5 py-2 font-semibold text-white transition ${
                                  assessmentSubmitting || !checklistComplete
                                    ? "bg-emerald-300"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                              >
                                {assessmentSubmitting ? "Saving…" : "Save assessment"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {showAssessmentDetails && assessmentDetails && (
                      <AssessmentDetailsPanel
                        details={assessmentDetails}
                        onClose={() => setShowAssessmentDetails(false)}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                Select a hospital to view compliance details.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
