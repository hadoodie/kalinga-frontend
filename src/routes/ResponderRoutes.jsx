import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// TODO: Import actual components when migrated from other project
// const ResponderDashboard = lazy(() => import("../pages-responders/Dashboard"));
// const ResponderIncidentLogs = lazy(() => import("../pages-responders/IncidentLogs"));
// const ResponderEmergencySOS = lazy(() => import("../pages-responders/EmergencySOS"));
// const ResponderTriageSystem = lazy(() => import("../pages-responders/TriageSystem"));
// const ResponderOnlineTraining = lazy(() => import("../pages-responders/OnlineTraining"));
// const ResponderModules = lazy(() => import("../pages-responders/Modules"));
// const ResponderCertifications = lazy(() => import("../pages-responders/Certifications"));
// const ResponderSettings = lazy(() => import("../pages-responders/Settings"));
// const ResponderGrades = lazy(() => import("../pages-responders/Grades"));
// const ResponderProfile = lazy(() => import("../pages-responders/Profile"));
// const ModuleDetails = lazy(() => import("../pages-responders/Online/ModuleDetails"));
// const InfoPage = lazy(() => import("../pages-responders/Online/InfoPage"));
// const LessonDetails = lazy(() => import("../pages-responders/Online/LessonDetails"));
// const AssessmentPage = lazy(() => import("../pages-responders/Online/AssessmentPage"));

// Temporary placeholder until components are migrated
const ResponderPortal = lazy(() => import("../pages-responders/Responder"));

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
          {/* <ResponderDashboard /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.INCIDENT_LOGS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderIncidentLogs /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.EMERGENCY_SOS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderEmergencySOS /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.TRIAGE_SYSTEM}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderTriageSystem /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />

    {/* Training & Education */}
    <Route
      path={ROUTES.RESPONDER.ONLINE_TRAINING}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderOnlineTraining /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULES}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderModules /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_DETAILS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ModuleDetails /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_INFO}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <InfoPage /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_LESSON}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <LessonDetails /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.MODULE_ASSESSMENT}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <AssessmentPage /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.CERTIFICATIONS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderCertifications /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.GRADES}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderGrades /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />

    {/* User Settings */}
    <Route
      path={ROUTES.RESPONDER.SETTINGS}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderSettings /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.RESPONDER.PROFILE}
      element={
        <ProtectedRoute allowedRoles={responderRoles}>
          {/* <ResponderProfile /> */}
          <ResponderPortal />
        </ProtectedRoute>
      }
    />
  </>
);
