import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle,
  Droplets,
  Fuel,
  RefreshCw,
  Shield,
  TrendingUp,
  Wind,
  XCircle,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import LogisticSidebar from "@/components/logistics/LogiSide";
import { NavbarB } from "@/components/Navbar_2";
import {
  HSI_CONSTANTS,
  formatSurvivalHours,
  getHsiDashboard,
  getHospitalCompliance,
} from "@/services/hsiApi";
import hospitalService from "@/services/hospitalService";

const HSI_SEED_HOSPITALS = [
  { id: 101, name: "Pasig City Medical Center" },
  { id: 205, name: "Rizal Provincial Hospital" },
  { id: 314, name: "Metro Manila Surge Facility" },
  { id: 412, name: "Quezon City MegaCare Center" },
];

const HSI_SEED_DASHBOARD = {
  total_hospitals: 4,
  hospitals_in_disaster_mode: 1,
  safety_categories: { A: 2, B: 1, C: 1 },
  total_critical_alerts: 3,
  critical_resources: {
    water: {
      count: 2,
      hospitals: ["Metro Manila Surge Facility", "Quezon City MegaCare Center"],
    },
    fuel: { count: 1, hospitals: ["Pasig City Medical Center"] },
  },
  critical_tanks: {
    oxygen: { count: 1, hospitals: ["Rizal Provincial Hospital"] },
    lpg: { count: 1, hospitals: ["Metro Manila Surge Facility"] },
  },
};

const baseAssessmentDetails = {
  general_info: {
    routine_capacity: { beds: 200, staff: 420 },
    maximum_capacity: { beds: 280, staff: 560 },
    surge_multiplier: 1.5,
    catchment_facilities: [
      { name: "Barangay Health Station 1", distance_km: 2.1 },
      { name: "RHU San Mateo", distance_km: 7.4 },
      { name: "Cainta Infirmary", distance_km: 9.2 },
    ],
  },
  hazards: {
    geological: [
      "Valley Fault System earthquake",
      "Liquefaction-prone soil",
      "Minor landslides on hospital access road",
    ],
    hydro_meteorological: [
      "Typhoon wind loads",
      "Marikina river overflow",
      "Urban flash flooding",
    ],
    biological: [
      "Dengue / leptospirosis surge",
      "Armed conflict mass casualty",
      "Food-borne outbreaks",
    ],
  },
  modules: [
    {
      id: "hazards",
      title: "Module 1 · Hazards Context",
      weight: "Context",
      status: "Documented",
      description:
        "Geologic, hydro-meteorologic, and societal threats are cataloged with PAGASA / PHIVOLCS overlays.",
      recommendations: [
        "Refresh hazard map layers with Q4 satellite data.",
        "Validate alternate access routes for flood and ash fall scenarios.",
      ],
    },
    {
      id: "structural",
      title: "Module 2 · Structural Safety",
      weight: "50%",
      score: 75,
      status: "Safe",
      description:
        "Structural audit covers short columns, soft floors, and shear wall integrity per 2015 NSCP.",
      recommendations: [
        "Complete retrofitting punch list for east wing columns.",
        "Install accelerometers to capture drift data during earthquakes.",
      ],
    },
    {
      id: "non_structural",
      title: "Module 3 · Non-Structural Safety",
      weight: "30%",
      score: 70,
      status: "Needs attention",
      description:
        "Power, water, fuel, IT, and anchored equipment readiness for a 72-hour disruption.",
      recommendations: [
        "Anchor remaining server racks and pharmacy shelving.",
        "Expand telemetry coverage to auxiliary water tanks.",
      ],
    },
    {
      id: "emergency",
      title: "Module 4 · Emergency & Disaster Management",
      weight: "20%",
      score: 72,
      status: "On track",
      description:
        "Disaster committee, EOC redundancy, staff recall, and vendor MOUs for food/fuel/medicines.",
      recommendations: [
        "Run quarterly full-scale drill including vendor activation.",
        "Digitize finance waiver templates for rapid release of funds.",
      ],
    },
  ],
  resilience_alerts: [
    {
      resource: "Water",
      status: "watch",
      note: "84h reserve vs 72h requirement",
      recommendation: "Continue telemetry checks every 6h.",
    },
    {
      resource: "Fuel",
      status: "critical",
      note: "66h reserve below 72h minimum",
      recommendation: "Trigger Petron MOU for 20k L diesel.",
    },
    {
      resource: "Oxygen",
      status: "optimal",
      note: "15-day buffer sustained",
      recommendation: "Maintain refill cadence with Linde partner.",
    },
  ],
  vendor_playbooks: [
    {
      resource: "Fuel",
      name: "Petron Disaster Fuel Team",
      mou: "MOU-2024-11",
      contact: "+63 912 123 4567",
      auto: true,
      status: "Standby",
    },
    {
      resource: "Water",
      name: "Maynilad Bulk Delivery",
      mou: "MOU-2023-08",
      contact: "+63 917 222 3344",
      auto: false,
      status: "Monitoring",
    },
    {
      resource: "Oxygen",
      name: "Linde Medical Gases",
      mou: "MOU-2022-15",
      contact: "+63 918 444 7788",
      auto: true,
      status: "Auto-trigger enabled",
    },
  ],
  telemetry: {
    water_tanks: [
      { label: "North Tank", capacity_liters: 40000, level_percent: 68 },
      { label: "South Tank", capacity_liters: 52000, level_percent: 74 },
    ],
    fuel_tanks: [
      { label: "Diesel Tank A", capacity_liters: 25000, level_percent: 62 },
    ],
  },
};

const applyModuleOverrides = (modules, overrides = {}) =>
  modules.map((module) => ({
    ...module,
    ...(overrides[module.id] || {}),
  }));

const createAssessmentDetails = (overrides = {}) => {
  const clone = JSON.parse(JSON.stringify(baseAssessmentDetails));
  if (overrides.general_info) {
    clone.general_info = {
      ...clone.general_info,
      ...overrides.general_info,
    };
  }
  if (overrides.hazards) {
    clone.hazards = {
      ...clone.hazards,
      ...overrides.hazards,
    };
  }
  if (overrides.modules) {
    clone.modules = overrides.modules;
  } else if (overrides.module_overrides) {
    clone.modules = applyModuleOverrides(
      clone.modules,
      overrides.module_overrides
    );
  }
  if (overrides.resilience_alerts) {
    clone.resilience_alerts = overrides.resilience_alerts;
  }
  if (overrides.vendor_playbooks) {
    clone.vendor_playbooks = overrides.vendor_playbooks;
  }
  if (overrides.telemetry) {
    clone.telemetry = overrides.telemetry;
  }
  return clone;
};

const HSI_SEED_ASSESSMENT_DETAILS = {
  101: createAssessmentDetails({
    general_info: {
      routine_capacity: { beds: 240, staff: 630 },
      maximum_capacity: { beds: 320, staff: 720 },
      surge_multiplier: 1.4,
      catchment_facilities: [
        { name: "Pasig Community Clinic", distance_km: 1.8 },
        { name: "Mandaluyong City MC", distance_km: 6.2 },
        { name: "Quirino Memorial MC", distance_km: 11.4 },
      ],
    },
    hazards: {
      hydro_meteorological: [
        "Pasig River overflow",
        "Severe typhoon wind",
        "Urban flash flooding",
      ],
    },
    module_overrides: {
      structural: {
        score: 78,
        status: "Safe",
        recommendations: [
          "Finish carbon fiber wrapping for podium columns.",
          "Schedule non-destructive test for helipad beams.",
        ],
      },
      non_structural: {
        score: 73,
        status: "Improving",
        recommendations: [
          "Anchor remaining ICU pendant booms.",
          "Expand UPS coverage to diagnostics cluster.",
        ],
      },
      emergency: {
        score: 80,
        status: "On track",
        recommendations: [
          "Integrate barangay DRRMO radio net into EOC.",
          "Complete MOU digitization for food vendors.",
        ],
      },
    },
    resilience_alerts: [
      {
        resource: "Water",
        status: "watch",
        note: "84h reserve vs 72h requirement",
        recommendation: "Continue telemetry checks every 6h.",
      },
      {
        resource: "Fuel",
        status: "critical",
        note: "66h reserve below 72h minimum",
        recommendation: "Auto-trigger Petron diesel run.",
      },
      {
        resource: "Oxygen",
        status: "optimal",
        note: "15-day buffer sustained",
        recommendation: "Maintain refill cadence with Linde partner.",
      },
    ],
  }),
  205: createAssessmentDetails({
    general_info: {
      routine_capacity: { beds: 180, staff: 380 },
      maximum_capacity: { beds: 250, staff: 520 },
      surge_multiplier: 1.6,
      catchment_facilities: [
        { name: "Rizal Elcano Infirmary", distance_km: 3.5 },
        { name: "Antipolo District Hospital", distance_km: 10.3 },
      ],
    },
    hazards: {
      geological: ["Foothill landslides", "Secondary faults from Sierra Madre"],
      hydro_meteorological: [
        "Upper Marikina watershed flooding",
        "Orographic rainfall from Sierra Madre",
      ],
    },
    module_overrides: {
      structural: {
        score: 63,
        status: "Intervention needed",
        recommendations: [
          "Retrofit west wing to address captive column risk.",
          "Seal expansion joint leaks causing rebar corrosion.",
        ],
      },
      non_structural: {
        score: 52,
        status: "Needs attention",
        recommendations: [
          "Install quick-connects for tanker-fed generators.",
          "Secure pharmacy shelving units.",
        ],
      },
      emergency: {
        score: 59,
        status: "Developing",
        recommendations: [
          "Formalize food supply MOU with LGU cooperative.",
          "Update staff recall contact tree.",
        ],
      },
    },
    resilience_alerts: [
      {
        resource: "Water",
        status: "watch",
        note: "64h reserve below 72h requirement",
        recommendation: "Request tanker augmentation when heavy rains start.",
      },
      {
        resource: "Fuel",
        status: "critical",
        note: "40h reserve vs 72h minimum",
        recommendation: "Pre-trigger Phoenix fuel partner for 15k L.",
      },
      {
        resource: "Oxygen",
        status: "optimal",
        note: "15-day buffer achieved",
        recommendation: "Maintain 2-weekly refills.",
      },
    ],
    vendor_playbooks: [
      {
        resource: "Fuel",
        name: "Phoenix Petroleum",
        mou: "MOU-2024-03",
        contact: "+63 927 456 7788",
        auto: false,
        status: "Manual trigger",
      },
      {
        resource: "Water",
        name: "Local Water District",
        mou: "MOU-2023-10",
        contact: "+63 925 667 9032",
        auto: false,
        status: "Monitoring",
      },
      {
        resource: "Oxygen",
        name: "OxyLife PH",
        mou: "MOU-2022-07",
        contact: "+63 917 202 1177",
        auto: true,
        status: "Auto-trigger enabled",
      },
    ],
  }),
  314: createAssessmentDetails({
    general_info: {
      routine_capacity: { beds: 120, staff: 260 },
      maximum_capacity: { beds: 200, staff: 360 },
      surge_multiplier: 1.8,
      catchment_facilities: [
        { name: "Field Hospital – Marikina Sports Center", distance_km: 4.7 },
        { name: "QC Evacuation Mega Dome", distance_km: 9.1 },
      ],
    },
    hazards: {
      hydro_meteorological: ["Severe storm surge", "Prolonged power outages"],
      biological: [
        "Mass casualty from civil unrest",
        "Cholera outbreak risk during evacuation",
      ],
    },
    module_overrides: {
      structural: {
        score: 45,
        status: "Critical",
        recommendations: [
          "Reinforce prefab wards before next typhoon season.",
          "Inspect roof bracing every quarter.",
        ],
      },
      non_structural: {
        score: 39,
        status: "Critical",
        recommendations: [
          "Install secondary generator for command center.",
          "Anchor lab analyzers and imaging equipment.",
        ],
      },
      emergency: {
        score: 44,
        status: "Developing",
        recommendations: [
          "Reconstitute disaster committee with logistics lead.",
          "Digitize staff recall rosters.",
        ],
      },
    },
    resilience_alerts: [
      {
        resource: "Water",
        status: "critical",
        note: "48h reserve",
        recommendation: "Deploy tanker staging plan immediately.",
      },
      {
        resource: "Fuel",
        status: "critical",
        note: "32h reserve",
        recommendation: "Auto-trigger fuel for surge tents.",
      },
      {
        resource: "Oxygen",
        status: "watch",
        note: "280h reserve below 15-day standard",
        recommendation: "Advance refill request to partner.",
      },
    ],
    vendor_playbooks: [
      {
        resource: "Fuel",
        name: "DOE Emergency Stockpile",
        mou: "MOU-2024-19",
        contact: "+63 917 888 0091",
        auto: true,
        status: "Auto-trigger enabled",
      },
      {
        resource: "Water",
        name: "MMDA Tanker Pool",
        mou: "MOU-2024-05",
        contact: "+63 917 765 4321",
        auto: true,
        status: "Standby",
      },
      {
        resource: "Oxygen",
        name: "PhilOx Med",
        mou: "MOU-2024-09",
        contact: "+63 915 441 2233",
        auto: false,
        status: "Manual trigger",
      },
    ],
  }),
  412: createAssessmentDetails({
    general_info: {
      routine_capacity: { beds: 300, staff: 720 },
      maximum_capacity: { beds: 420, staff: 880 },
      surge_multiplier: 1.35,
      catchment_facilities: [
        { name: "Quezon City District Hospital", distance_km: 3.1 },
        { name: "PNP General Hospital", distance_km: 5.2 },
        { name: "East Avenue MC", distance_km: 6.0 },
      ],
    },
    hazards: {
      geological: [
        "Deep foundation near fault splays",
        "Liquefaction along EDSA flyover",
      ],
      biological: [
        "High likelihood of epidemic surge",
        "Security-related mass casualty events",
      ],
    },
    module_overrides: {
      structural: {
        score: 72,
        status: "Safe",
        recommendations: [
          "Complete non-linear time history model validation.",
          "Upgrade elevator seismic sensors.",
        ],
      },
      non_structural: {
        score: 66,
        status: "Improving",
        recommendations: [
          "Expand automatic transfer switch testing cadence.",
          "Anchor bulk pharmacy shelves.",
        ],
      },
      emergency: {
        score: 71,
        status: "On track",
        recommendations: [
          "Integrate EOC dashboard with city DRRMO.",
          "Finalize financial quick-release SOP.",
        ],
      },
    },
    resilience_alerts: [
      {
        resource: "Water",
        status: "optimal",
        note: "102h reserve",
        recommendation: "Maintain telemetry feed checks.",
      },
      {
        resource: "Fuel",
        status: "optimal",
        note: "74h reserve",
        recommendation: "Keep ready reserve rotation every 14 days.",
      },
      {
        resource: "Oxygen",
        status: "optimal",
        note: "500h reserve",
        recommendation: "Surplus can support nearby facilities.",
      },
    ],
  }),
  default: createAssessmentDetails(),
};

const HSI_SEED_COMPLIANCE = {
  101: {
    assessment: {
      overall_index: 76.4,
      category: "A",
      structural_score: 78,
      non_structural_score: 73,
      emergency_mgmt_score: 80,
      date: "2025-11-12T00:00:00+08:00",
    },
    capacity: {
      routine_beds: 240,
      maximum_beds: 320,
      disaster_mode_active: true,
    },
    vendor_agreements: { active: 5, auto_trigger_enabled: 3 },
    water: {
      survival_hours: 84,
      tank_count: 4,
      total_liters: 132000,
      required_72h_liters: 96000,
    },
    fuel: {
      survival_hours: 66,
      tank_count: 2,
      total_liters: 42000,
      daily_usage_liters: 15200,
    },
    oxygen: {
      survival_hours: 420,
      tank_count: 3,
      total_liters: 9000,
    },
    generator: {
      starts_within_10s: true,
      coverage_percent: 95,
      fuel_reserve_hours: 60,
    },
    assessment_details: HSI_SEED_ASSESSMENT_DETAILS[101],
  },
  205: {
    assessment: {
      overall_index: 58.2,
      category: "B",
      structural_score: 63,
      non_structural_score: 52,
      emergency_mgmt_score: 59,
      date: "2025-10-30T00:00:00+08:00",
    },
    capacity: {
      routine_beds: 180,
      maximum_beds: 250,
      disaster_mode_active: false,
    },
    vendor_agreements: { active: 3, auto_trigger_enabled: 1 },
    water: {
      survival_hours: 64,
      tank_count: 2,
      total_liters: 78000,
      required_72h_liters: 54000,
    },
    fuel: {
      survival_hours: 40,
      tank_count: 1,
      total_liters: 18000,
      daily_usage_liters: 10500,
    },
    oxygen: {
      survival_hours: 360,
      tank_count: 2,
      total_liters: 6400,
    },
    generator: {
      starts_within_10s: false,
      coverage_percent: 82,
      fuel_reserve_hours: 38,
    },
    assessment_details: HSI_SEED_ASSESSMENT_DETAILS[205],
  },
  314: {
    assessment: {
      overall_index: 41.5,
      category: "B",
      structural_score: 45,
      non_structural_score: 39,
      emergency_mgmt_score: 44,
      date: "2025-11-05T00:00:00+08:00",
    },
    capacity: {
      routine_beds: 120,
      maximum_beds: 200,
      disaster_mode_active: true,
    },
    vendor_agreements: { active: 4, auto_trigger_enabled: 2 },
    water: {
      survival_hours: 48,
      tank_count: 2,
      total_liters: 42000,
      required_72h_liters: 36000,
    },
    fuel: {
      survival_hours: 32,
      tank_count: 1,
      total_liters: 15000,
      daily_usage_liters: 11200,
    },
    oxygen: {
      survival_hours: 280,
      tank_count: 2,
      total_liters: 5200,
    },
    generator: {
      starts_within_10s: true,
      coverage_percent: 78,
      fuel_reserve_hours: 30,
    },
    assessment_details: HSI_SEED_ASSESSMENT_DETAILS[314],
  },
  412: {
    assessment: {
      overall_index: 69.8,
      category: "A",
      structural_score: 72,
      non_structural_score: 66,
      emergency_mgmt_score: 71,
      date: "2025-11-18T00:00:00+08:00",
    },
    capacity: {
      routine_beds: 300,
      maximum_beds: 420,
      disaster_mode_active: false,
    },
    vendor_agreements: { active: 6, auto_trigger_enabled: 4 },
    water: {
      survival_hours: 102,
      tank_count: 5,
      total_liters: 168000,
      required_72h_liters: 126000,
    },
    fuel: {
      survival_hours: 74,
      tank_count: 3,
      total_liters: 56000,
      daily_usage_liters: 18200,
    },
    oxygen: {
      survival_hours: 500,
      tank_count: 3,
      total_liters: 12000,
    },
    generator: {
      starts_within_10s: true,
      coverage_percent: 98,
      fuel_reserve_hours: 70,
    },
    assessment_details: HSI_SEED_ASSESSMENT_DETAILS[412],
  },
  default: {
    assessment: {
      overall_index: 52,
      category: "B",
      structural_score: 55,
      non_structural_score: 48,
      emergency_mgmt_score: 50,
      date: "2025-10-01T00:00:00+08:00",
    },
    capacity: {
      routine_beds: 150,
      maximum_beds: 200,
      disaster_mode_active: false,
    },
    vendor_agreements: { active: 2, auto_trigger_enabled: 1 },
    water: {
      survival_hours: 36,
      tank_count: 1,
      total_liters: 27000,
      required_72h_liters: 36000,
    },
    fuel: {
      survival_hours: 24,
      tank_count: 1,
      total_liters: 9000,
      daily_usage_liters: 9000,
    },
    oxygen: {
      survival_hours: 220,
      tank_count: 1,
      total_liters: 3000,
    },
    generator: {
      starts_within_10s: false,
      coverage_percent: 70,
      fuel_reserve_hours: 18,
    },
    assessment_details: HSI_SEED_ASSESSMENT_DETAILS.default,
  },
};

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
          {module.title}
        </p>
        {module.weight && (
          <p className="text-xs text-slate-400">Weight {module.weight}</p>
        )}
      </div>
      <div className="text-right">
        {typeof module.score === "number" && (
          <p className="text-3xl font-bold text-slate-900">{module.score}%</p>
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
                    ? `${facility.distance_km.toFixed(1)} km`
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

      {modules.length > 0 && (
        <div className="mt-6 space-y-4">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
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
                  key={vendor.mou}
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
                    Resource: {vendor.resource}
                  </p>
                  <p className="text-xs text-slate-500">MOU {vendor.mou}</p>
                  <p className="text-xs text-slate-500">{vendor.contact}</p>
                  <p className="text-xs text-slate-500">
                    Status: {vendor.status}
                  </p>
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

const defaultHospitalId = HSI_SEED_HOSPITALS[0]?.id ?? null;

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

const ResourceStatusCard = ({
  title,
  icon: Icon,
  current,
  required,
  prefix,
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
            {prefix}
            {formatSurvivalHours(current)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">HSI requirement</span>
          <span className="font-semibold text-slate-900">
            {prefix}
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

const getSeedCompliance = (hospitalId) =>
  HSI_SEED_COMPLIANCE[hospitalId] || HSI_SEED_COMPLIANCE.default;

const computePercent = (value, required) => {
  if (!value || !required) return 0;
  return Math.round(Math.min((value / required) * 100, 160));
};

const normalizeHospitals = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const HospitalSafetyIndexContent = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(HSI_SEED_DASHBOARD);
  const [hospitals, setHospitals] = useState(HSI_SEED_HOSPITALS);
  const [selectedHospital, setSelectedHospital] = useState(defaultHospitalId);
  const [hospitalCompliance, setHospitalCompliance] = useState(
    getSeedCompliance(defaultHospitalId)
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.5);
  const [lastAutoTrigger, setLastAutoTrigger] = useState(null);

  const assessmentDetails = useMemo(() => {
    if (!selectedHospital) return hospitalCompliance?.assessment_details;
    return (
      hospitalCompliance?.assessment_details ||
      HSI_SEED_ASSESSMENT_DETAILS[selectedHospital] ||
      HSI_SEED_ASSESSMENT_DETAILS.default
    );
  }, [hospitalCompliance, selectedHospital]);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchDashboardData(), fetchHospitals()]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchHospitalCompliance(selectedHospital);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHospital]);

  useEffect(() => {
    if (assessmentDetails?.general_info?.surge_multiplier) {
      setSurgeMultiplier(assessmentDetails.general_info.surge_multiplier);
    }
  }, [assessmentDetails]);

  useEffect(() => {
    setShowAssessmentDetails(false);
    setLastAutoTrigger(null);
  }, [selectedHospital]);

  const fetchDashboardData = async () => {
    try {
      const response = await getHsiDashboard();
      const payload = response?.data?.data;
      setDashboardData(
        payload && Object.keys(payload).length ? payload : HSI_SEED_DASHBOARD
      );
    } catch (error) {
      console.error("Failed to fetch HSI dashboard:", error);
      setDashboardData(HSI_SEED_DASHBOARD);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll();
      const normalized = normalizeHospitals(response);
      if (normalized.length) {
        setHospitals(normalized);
        setSelectedHospital((prev) => prev ?? normalized[0].id);
      } else {
        setHospitals(HSI_SEED_HOSPITALS);
        setSelectedHospital((prev) => prev ?? defaultHospitalId);
      }
    } catch (error) {
      console.error("Failed to fetch hospitals:", error);
      setHospitals(HSI_SEED_HOSPITALS);
      setSelectedHospital((prev) => prev ?? defaultHospitalId);
    }
  };

  const fetchHospitalCompliance = async (hospitalId) => {
    try {
      const response = await getHospitalCompliance(hospitalId);
      const payload = response?.data?.data;
      setHospitalCompliance(
        payload && Object.keys(payload).length
          ? payload
          : getSeedCompliance(hospitalId)
      );
    } catch (error) {
      console.error("Failed to fetch hospital compliance:", error);
      setHospitalCompliance(getSeedCompliance(hospitalId));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
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

  const vendorPlaybooks = assessmentDetails?.vendor_playbooks || [];

  const simulateSurvivalHours = (resourceKey) => {
    const baseHours = hospitalCompliance?.[resourceKey]?.survival_hours;
    if (!baseHours || !surgeMultiplier) return 0;
    return Math.max(Math.round(baseHours / surgeMultiplier), 0);
  };

  const getVendorForResource = (resourceKey) =>
    vendorPlaybooks.find(
      (vendor) => vendor.resource?.toLowerCase() === resourceKey
    );

  const handleAutoTrigger = (resourceKey) => {
    const vendor = getVendorForResource(resourceKey);
    const resourceLabel = resourceLabels[resourceKey] || resourceKey;
    if (vendor) {
      setLastAutoTrigger(
        `Auto-triggered ${vendor.name} (${vendor.mou}) for ${resourceLabel} · Contact ${vendor.contact}`
      );
    } else {
      setLastAutoTrigger(`No vendor playbook configured for ${resourceLabel}.`);
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-slate-200 bg-white/70 shadow-sm">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          <span>Loading hospital safety data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">
              Logistics Command Center
            </p>
            <div className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Shield className="h-7 w-7 text-emerald-600" />
              <span>Hospital Safety Index</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              WHO / DOH compliance view with real-time resource survivability.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success">
              {dashboardData.total_hospitals} facilities monitored
            </Badge>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {dashboardData && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Total hospitals</span>
              <Building2 className="h-4 w-4" />
            </div>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              {dashboardData.total_hospitals}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {dashboardData.hospitals_in_disaster_mode} in disaster mode
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-emerald-700">
              <span>Category A (Safe)</span>
              <CheckCircle className="h-4 w-4" />
            </div>
            <p className="mt-2 text-4xl font-bold text-emerald-900">
              {dashboardData.safety_categories?.A || 0}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Likely to remain functional
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-amber-700">
              <span>Category B (Intervention)</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="mt-2 text-4xl font-bold text-amber-900">
              {dashboardData.safety_categories?.B || 0}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Intervention recommended
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>Category C (Urgent)</span>
              <AlertOctagon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-4xl font-bold text-red-900">
              {dashboardData.safety_categories?.C || 0}
            </p>
            <p className="mt-1 text-xs text-red-600">Urgent action required</p>
          </div>
        </section>
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
                        {data.hospitals?.join(", ")}
                      </p>
                    </div>
                    <Badge variant="destructive">{data.count} flagged</Badge>
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
                  <div className="flex items-center justify_between">
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-800">
                        {category.replace("_", " ")} tanks
                      </p>
                      <p className="text-xs text-slate-500">
                        {data.hospitals?.join(", ")}
                      </p>
                    </div>
                    <Badge variant="destructive">{data.count} flagged</Badge>
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
                          Updated{" "}
                          {new Date(
                            hospitalCompliance.assessment?.date
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Bed capacity</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {hospitalCompliance.capacity?.routine_beds || 0} /{" "}
                          {hospitalCompliance.capacity?.maximum_beds || 0}
                        </p>
                        <div className="mt-2">
                          {hospitalCompliance.capacity?.disaster_mode_active ? (
                            <Badge variant="warning">
                              Disaster mode active
                            </Badge>
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
                          {hospitalCompliance.vendor_agreements
                            ?.auto_trigger_enabled || 0}{" "}
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
                          <p className="text-xs text-slate-500">
                            vs 72h standard
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                          <p className="text-sm text-slate-500">
                            Fuel autonomy
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {resourcePercents.fuel}%
                          </p>
                          <p className="text-xs text-slate-500">
                            vs 72h standard
                          </p>
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
                        prefix=""
                      />
                      <ResourceStatusCard
                        title="Fuel reserve"
                        icon={Fuel}
                        current={hospitalCompliance.fuel?.survival_hours || 0}
                        required={HSI_CONSTANTS.FUEL_MINIMUM_HOURS}
                        prefix=""
                      />
                      {hospitalCompliance.oxygen && (
                        <ResourceStatusCard
                          title="Oxygen reserve"
                          icon={Wind}
                          current={
                            hospitalCompliance.oxygen.survival_hours || 0
                          }
                          required={HSI_CONSTANTS.OXYGEN_MINIMUM_HOURS}
                          prefix=""
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
                            <span>
                              {hospitalCompliance.water?.tank_count || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total volume</span>
                            <span>
                              {(
                                hospitalCompliance.water?.total_liters || 0
                              ).toLocaleString()}{" "}
                              L
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Required for 72h</span>
                            <span>
                              {(
                                hospitalCompliance.water?.required_72h_liters ||
                                0
                              ).toLocaleString()}{" "}
                              L
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
                            <span>
                              {hospitalCompliance.fuel?.tank_count || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total volume</span>
                            <span>
                              {(
                                hospitalCompliance.fuel?.total_liters || 0
                              ).toLocaleString()}{" "}
                              L
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily usage</span>
                            <span>
                              {(
                                hospitalCompliance.fuel?.daily_usage_liters || 0
                              ).toLocaleString()}{" "}
                              L/day
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
                              {hospitalCompliance.generator.starts_within_10s
                                ? "✓"
                                : "✗"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Starts within 10s
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">
                              {hospitalCompliance.generator.coverage_percent}%
                            </p>
                            <p className="text-xs text-slate-500">
                              Load coverage
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">
                              {formatSurvivalHours(
                                hospitalCompliance.generator.fuel_reserve_hours
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              Fuel reserve
                            </p>
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
                            Survival hours computed per DOH HSI (72-hour
                            fuel/water, 15-day oxygen).
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
                            onChange={(e) =>
                              setSurgeMultiplier(Number(e.target.value))
                            }
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
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
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
                            Conducted on{" "}
                            {new Date(
                              hospitalCompliance.assessment.date
                            ).toLocaleDateString()}
                          </p>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                            <p className="text-sm uppercase tracking-wide text-slate-500">
                              Overall safety index
                            </p>
                            <p className="mt-2 text-4xl font-bold text-slate-900">
                              {hospitalCompliance.assessment.overall_index?.toFixed(
                                1
                              )}
                            </p>
                            <div className="mt-2">
                              <Badge variant="secondary">
                                Category{" "}
                                {hospitalCompliance.assessment.category}
                              </Badge>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setShowAssessmentDetails((prev) => !prev)
                            }
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
                          <button className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700">
                            Start new assessment
                          </button>
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

const HospitalSafetyIndexPage = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      <LogisticSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <NavbarB />
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-50/80">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
            <HospitalSafetyIndexContent />
            <div className="mt-10">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HospitalSafetyIndexPage;
