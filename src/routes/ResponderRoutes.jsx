import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// Responder Pages
const Dashboard = lazy(() => import("../pages-responders/Dashboard"));
const EmergencyConsole = lazy(() => import("../pages-responders/DashboardV2"));
const IncidentLogs = lazy(() => import("../pages-responders/IncidentLogs"));
const EmergencySOS = lazy(() => import("../pages-responders/EmergencySOS"));
const TriageSystem = lazy(() => import("../pages-responders/TriageSystem"));
const OnlineTraining = lazy(() => import("../pages-responders/OnlineTraining"));
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
const InfoPage = lazy(() => import("../pages-responders/Online/InfoPage"));
const LessonDetails = lazy(() =>
  import("../pages-responders/Online/LessonDetails")
);
const SectionPage = lazy(() =>
  import("../pages-responders/Online/SectionPage")
);
const AssessmentPage = lazy(() =>
  import("../pages-responders/Online/AssessmentPage")
);
const Certifications = lazy(() =>
  import("../pages-responders/Online/Certifications")
);

const responderRoles = [ROLES.RESPONDER];

export const ResponderRoutes = () => (
  <>
    {/* Redirect root to dashboard */}
    <Route
      path={ROUTES.RESPONDER.ROOT}
      element={<Navigate to={ROUTES.RESPONDER.DASHBOARD} replace />}
    />

    {/* Dashboard & Operations */}
    <Route
      path={ROUTES.RESPONDER.DASHBOARD}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.EMERGENCY_CONSOLE}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <EmergencyConsole />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.RESPONSE_MODE}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <ResponseMode />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.INCIDENT_LOGS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <IncidentLogs />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.EMERGENCY_SOS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <EmergencySOS />
        </ProtectedRoute>
      }
    />
    <Route
      path="/responder/response-map"
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <ResponseMap />
        </ProtectedRoute>
      }
    />
    <Route
      path="/responder/hospital-map"
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <HospitalMap />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.TRIAGE_SYSTEM}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <TriageSystem />
        </ProtectedRoute>
      }
    />
    <Route
      path="/responder/messages"
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Messages />
        </ProtectedRoute>
      }
    />

    {/* Training & Education */}
    <Route
      path={ROUTES.RESPONDER.ONLINE_TRAINING}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <OnlineTraining />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULES}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Modules />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_DETAILS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <CourseDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_INFO}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <InfoPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_LESSON}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <LessonDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_SECTION}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <SectionPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_ASSESSMENT}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <AssessmentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.CERTIFICATIONS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Certifications />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.GRADES}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Grades />
        </ProtectedRoute>
      }
    />

    {/* User Settings */}
    <Route
      path={ROUTES.RESPONDER.SETTINGS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Settings />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.PROFILE}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          <Profile />
        </ProtectedRoute>
      }
    />
  </>
);
