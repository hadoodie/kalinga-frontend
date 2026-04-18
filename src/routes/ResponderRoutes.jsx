import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import ErrorBoundary from "../components/ErrorBoundary";
import ResponderLayout from "../layouts/ResponderLayout";
import Layout from "../layouts/Layout";
import { ROUTES, ROLES } from "../config/routes";

// Responder Pages
const Dashboard = lazy(() => import("../pages-responders/Dashboard"));
const EmergencyConsole = lazy(() => import("../pages-responders/DashboardV2"));
const IncidentLogs = lazy(() => import("../pages-responders/IncidentLogs"));
const EmergencySOS = lazy(() => import("../pages-responders/EmergencySOS"));
const TriageSystem = lazy(() => import("../pages-responders/TriageSystem"));
const OnlineTraining = lazy(() => import("../pages-responders/OnlineTraining"));
const PatientCareReport = lazy(() => import("../pages-responders/PatientCareReport"));
const PatientCareReportPrint = lazy(() => import("../pages-responders/PatientCareReportPrint"));
const PCRHistoryView = lazy(() => import("../components/responder/pcr/PCRHistoryView"));
const ResponseMode = lazy(() => import("../pages-responders/ResponseMode"));
const Settings = lazy(() => import("../pages-responders/Settings"));
const Profile = lazy(() => import("../pages-responders/Profile"));
const Grades = lazy(() => import("../pages-responders/Grades"));
const Messages = lazy(() => import("../pages-responders/Messages"));

// Pathfinding Pages
const ResponseMap = lazy(() =>
  import("../pages-responders/pathfinding/ResponseMap")
);
const HospitalMap = lazy(() =>
  import("../pages-responders/pathfinding/HospitalMap")
);

// Online Training Pages
const Modules = lazy(() => import("../pages-responders/Online/Modules"));
const CourseDetails = lazy(() =>
  import("../pages-responders/Online/CourseDetails")
);
const ContentViewer = lazy(() =>
  import("../pages-responders/Online/ContentViewer")
);
const InfoPage = lazy(() => import("../pages-responders/Online/InfoPage"));
const SectionPage = lazy(() =>
  import("../pages-responders/Online/SectionPage")
);
const AssessmentPage = lazy(() =>
  import("../pages-responders/Online/AssessmentPage")
);
const Certifications = lazy(() =>
  import("../pages-responders/Online/Certifications")
);

const Module1 = lazy(() =>
  import("../pages-responders/Online/Modules/Module1")
);

const Lesson1 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson1")
);

const Lesson2 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson2")
);

const Lesson3 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson3")
);

const Module2 = lazy(() =>
  import("../pages-responders/Online/Modules/Module2")
);

const Lesson4 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson4")
);

const Lesson5 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson5")
);

const Lesson6 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson6")
);

const Lesson7 = lazy(() =>
  import("../pages-responders/Online/Lessons/Lesson7")
);

const responderRoles = [ROLES.RESPONDER];
const responderChildPath = (path) => {
  if (typeof path !== "string") {
    console.error("Invalid responder route path", path);
    return "";
  }
  return path.replace("/responder/", "");
};

export const ResponderRoutes = () => (
  <>
    <Route
      path={ROUTES.RESPONDER.ROOT}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <ResponderLayout />
        </ProtectedRoute>
      }
    >
      <Route
        index
        element={<Navigate to={responderChildPath(ROUTES.RESPONDER.DASHBOARD)} replace />}
      />

      <Route path={responderChildPath(ROUTES.RESPONDER.DASHBOARD)} element={<Dashboard />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.EMERGENCY_CONSOLE)} element={<EmergencyConsole />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.RESPONSE_MODE)} element={<ResponseMode />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.INCIDENT_LOGS)} element={<IncidentLogs />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.EMERGENCY_SOS)} element={<EmergencySOS />} />
      <Route path="response-map" element={<ResponseMap />} />
      <Route path="hospital-map" element={<HospitalMap />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.TRIAGE_SYSTEM)} element={<TriageSystem />} />
      <Route path="messages" element={<Messages />} />

      <Route path={responderChildPath(ROUTES.RESPONDER.ONLINE_TRAINING)} element={<OnlineTraining />} />
      <Route
        path={responderChildPath(ROUTES.RESPONDER.PATIENT_CARE_REPORT)}
        element={
          <ErrorBoundary>
            <PatientCareReport />
          </ErrorBoundary>
        }
      />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULES)} element={<Modules />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_INFO)} element={<InfoPage />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_LESSON)} element={<CourseDetails />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_SECTION)} element={<SectionPage />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_1)} element={<Module1 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_1)} element={<Lesson1 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_2)} element={<Lesson2 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_3)} element={<Lesson3 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_2)} element={<Module2 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_4)} element={<Lesson4 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_5)} element={<Lesson5 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_6)} element={<Lesson6 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.LESSON_7)} element={<Lesson7 />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_ASSESSMENT)} element={<AssessmentPage />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_ACTIVITY)} element={<CourseDetails />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_DETAILS)} element={<CourseDetails />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.MODULE_CONTENT)} element={<ContentViewer />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.CERTIFICATIONS)} element={<Certifications />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.GRADES)} element={<Grades />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.SETTINGS)} element={<Settings />} />
      <Route path={responderChildPath(ROUTES.RESPONDER.PROFILE)} element={<Profile />} />
    </Route>

    <Route
      path={ROUTES.RESPONDER.PATIENT_CARE_REPORT_PRINT}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <PatientCareReportPrint />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.PATIENT_CARE_REPORT_HISTORY}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Layout>
            <PCRHistoryView />
          </Layout>
        </ProtectedRoute>
      }
    />
  </>
);
