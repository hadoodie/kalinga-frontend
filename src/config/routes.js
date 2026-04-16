// Route path constants - Single source of truth for all application routes
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  CREATE_ACCOUNT: "/create-acc",
  PRIVACY_POLICY: "/privacy-policy",
  TERMS_AND_CONDITIONS: "/terms-and-conditions",
  FAQS: "/faqs",

  // Account creation flow
  VERIFY_ID: "/verify-id",
  UPLOAD_ID: "/upload-id",
  FILL_INFO: "/fill-info",
  VERIFICATION_PENDING: "/verification-pending",

  // Patient routes
  PATIENT: {
    ROOT: "/patient",
    DASHBOARD: "/patient/dashboard",
    APPOINTMENTS: "/patient/appointments",
    HEALTH_RECORDS: "/patient/health-records",
    MESSAGES: "/patient/messages",
    REPORT_EMERGENCY: "/patient/report-emergency",
    VEHICLE: "/patient/vehicle",
    SPECIFY_VEHICLE: "/patient/specify-vehicle",
    WEATHER: "/patient/weather",
    HOSPITAL_MAP: "/patient/hospital-map",
    NOTIFICATIONS: "/patient/notifications",
    SETTINGS: "/patient/settings",
    PROFILE: "/patient/profile",
    RESCUE_TRACKER: "/patient/rescue-tracker",
  },

  // Admin routes
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
  },

  // Responder routes
  RESPONDER: {
    ROOT: "/responder",
    DASHBOARD: "/responder/dashboard",
    EMERGENCY_CONSOLE: "/responder/emergency-console",
    RESPONSE_MODE: "/responder/response-mode/:incidentId",
    INCIDENT_LOGS: "/responder/incident-logs",
    EMERGENCY_SOS: "/responder/emergency-sos",
    TRIAGE_SYSTEM: "/responder/triage-system",
    ONLINE_TRAINING: "/responder/online-training",
    PATIENT_CARE_REPORT: "/responder/patient-care-report",
    PATIENT_CARE_REPORT_HISTORY: "/responder/pcr-history",
    PATIENT_CARE_REPORT_PRINT: "/responder/patient-care-report/print",
    MODULES: "/responder/modules",
    MODULE_DETAILS: "/responder/modules/:id",
    MODULE_CONTENT: "/responder/modules/:id/content/:contentSlug",
    MODULE_INFO: "/responder/modules/:id/info/:topicSlug",
    MODULE_LESSON: "/responder/modules/:id/lesson/:lessonSlug",
    MODULE_SECTION: "/responder/modules/:id/section/:sectionSlug",
    MODULE_ASSESSMENT: "/responder/modules/:id/assessment/:type",
    MODULE_ACTIVITY: "/responder/modules/:id/activity/:slug",
    MODULE_1: "/responder/modules/:id/module-1",
    LESSON_1: "/responder/modules/:id/lesson-1",
    LESSON_2: "/responder/modules/:id/lesson-2",
    LESSON_3: "/responder/modules/:id/lesson-3",
    MODULE_2: "/responder/modules/:id/module-2",
    LESSON_4: "/responder/modules/:id/lesson-4",
    LESSON_5: "/responder/modules/:id/lesson-5",
    LESSON_6: "/responder/modules/:id/lesson-6",
    LESSON_7: "/responder/modules/:id/lesson-7",
    CERTIFICATIONS: "/responder/certifications",
    GRADES: "/responder/grades",
    SETTINGS: "/responder/settings",
    PROFILE: "/responder/profile",
  },

  // Logistics routes
  LOGISTICS: {
    ROOT: "/logistics",
    DASHBOARD: "/logistics/dashboard",
    RESOURCE_MANAGEMENT: "/logistics/resource-management",
    ASSET_REGISTRY: "/logistics/asset-registry",
    SUPPLY_TRACKING: "/logistics/supply-tracking",
    REQUESTED_ALLOCATION: "/logistics/requested-allocation",
    HOSPITAL_SAFETY_INDEX: "/logistics/hospital-safety-index",
    SETTINGS: "/logistics/settings",
    NOTIFICATIONS: "/logistics/notifications",
    LIVE_MAP: "/logistics/live-map",
    PROFILE: "/logistics/profile",
  },
};

// User role constants
export const ROLES = {
  PATIENT: "patient",
  ADMIN: "admin",
  RESPONDER: "responder",
  LOGISTICS: "logistics",
};
