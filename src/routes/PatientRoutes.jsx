import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ROUTES, ROLES } from "../config/routes";

// Lazy load patient pages
const PatientDashboard = lazy(() =>
  import("../pages-patients/Dashboard").then((module) => ({
    default: module.PatientDashboard,
  }))
);
const PatientAppointment = lazy(() =>
  import("../pages-patients/Appointment").then((module) => ({
    default: module.PatientAppointment,
  }))
);
const PatientHealthRecords = lazy(() =>
  import("../pages-patients/HealthRecords").then((module) => ({
    default: module.PatientHealthRecords,
  }))
);
const PatientMessages = lazy(() =>
  import("../pages-patients/Messages").then((module) => ({
    default: module.PatientMessages,
  }))
);
const PatientSettings = lazy(() =>
  import("../pages-patients/Settings").then((module) => ({
    default: module.PatientSettings,
  }))
);
const ReportEmergencies = lazy(() =>
  import("../pages-patients/ReportEmergency").then((module) => ({
    default: module.ReportEmergencies,
  }))
);
const VehicleSelection = lazy(() =>
  import("../pages-patients/VehicleSelection").then((module) => ({
    default: module.VehicleSelection,
  }))
);
const OtherVehicles = lazy(() =>
  import("../pages-patients/SpecifyVehicle").then((module) => ({
    default: module.OtherVehicles,
  }))
);
const Weather = lazy(() =>
  import("../pages-patients/Weather").then((module) => ({
    default: module.Weather,
  }))
);
const PatientHospitalMap = lazy(() =>
  import("../pages-patients/HospitalMap").then((module) => ({
    default: module.PatientHospitalMap,
  }))
);
const Notifications = lazy(() =>
  import("../pages-patients/Notifications").then((module) => ({
    default: module.Notifications,
  }))
);
const Profile = lazy(() =>
  import("../pages-patients/Profile").then((module) => ({
    default: module.Profile,
  }))
);

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
    <Route
      path={ROUTES.PATIENT.HOSPITAL_MAP}
      element={
        <ProtectedRoute allowedRoles={patientRoles}>
          <PatientHospitalMap />
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
