import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// Lazy load patient pages
const PatientDashboard = lazy(() => import("../pages-patients/Dashboard"));
const PatientAppointment = lazy(() => import("../pages-patients/Appointment"));
const PatientHealthRecords = lazy(() =>
  import("../pages-patients/HealthRecords")
);
const PatientMessages = lazy(() => import("../pages-patients/Messages"));
const PatientSettings = lazy(() => import("../pages-patients/Settings"));
const ReportEmergencies = lazy(() =>
  import("../pages-patients/ReportEmergency")
);
const VehicleSelection = lazy(() =>
  import("../pages-patients/VehicleSelection")
);
const OtherVehicles = lazy(() => import("../pages-patients/SpecifyVehicle"));
const Weather = lazy(() => import("../pages-patients/Weather"));
const Notifications = lazy(() => import("../pages-patients/Notifications"));
const Profile = lazy(() => import("../pages-patients/Profile"));

const patientRoles = [ROLES.PATIENT];

export const PatientRoutes = () => (
  <>
    {/* Redirect root to dashboard */}
    <Route
      path={ROUTES.PATIENT.ROOT}
      element={<Navigate to={ROUTES.PATIENT.DASHBOARD} replace />}
    />

    {/* Medical & Health */}
    <Route
      path={ROUTES.PATIENT.DASHBOARD}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <PatientDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.APPOINTMENTS}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <PatientAppointment />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.HEALTH_RECORDS}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <PatientHealthRecords />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.MESSAGES}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <PatientMessages />
        </ProtectedRoute>
      }
    />

    {/* Emergency & Safety */}
    <Route
      path={ROUTES.PATIENT.REPORT_EMERGENCY}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <ReportEmergencies />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.VEHICLE}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <VehicleSelection />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.SPECIFY_VEHICLE}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <OtherVehicles />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.WEATHER}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <Weather />
        </ProtectedRoute>
      }
    />

    {/* User Settings */}
    <Route
      path={ROUTES.PATIENT.NOTIFICATIONS}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <Notifications />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.SETTINGS}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <PatientSettings />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.PATIENT.PROFILE}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <Profile />
        </ProtectedRoute>
      }
    />
  </>
);
