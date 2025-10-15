import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Home } from "./pages-home/Home";
import { LogIn } from "./pages-account/LogIn";
import { CreateAccount } from "./pages-account/CreateAccount";
import { Toaster } from "./components/ui/toaster";
import { VerifyIDs } from "./pages-account/VerifyID";
import { UploadIDs } from "./pages-account/UploadID";
import { FillInformation } from "./pages-account/FillInformation";
import { ReportEmergencies } from "./pages-patients/ReportEmergency";
import { VehicleSelection } from "./pages-patients/VehicleSelection";
import { OtherVehicles } from "./pages-patients/SpecifyVehicle";
import { ForgotPassword } from "./pages-account/ForgotPassword";
import { CommunityDashboard } from "./pages-patients/CommunityDashboard";
import { Weather } from "./pages-patients/Weather";
import { Notifications } from "./pages-patients/Notifications";
import { Profile } from "./pages-patients/Profile";
import { SupplyTracking } from "./pages-logistics/Supply";
import { RequestAllocation } from "./pages-logistics/Request";
import { AssetRegistry } from "./pages-logistics/AssetRegistry";
import { ResourceManagement } from "./pages-logistics/ResourceManagement";
import { DashboardLogistics } from "./pages-logistics/Dashboard";
import { SettingsLogistics } from "./pages-logistics/Settings";
import { AdminPortal } from "./pages-admin/Admin";
import { ResponderPortal } from "./pages-responders/Responder";
import { PatientDashboard } from "./pages-patients/Dashboard";
import { PatientAppointment } from "./pages-patients/Appointment";
import { PatientHealthRecords } from "./pages-patients/HealthRecords";
import { PatientMessages } from "./pages-patients/Messages";
import { PatientSettings } from "./pages-patients/Settings";
import VerificationPending from "./pages-resident/99_VerificationPending";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-acc" element={<CreateAccount />} />

            {/* Account Creation Flow - Protected */}
            <Route
              path="/verify-id"
              element={
                <ProtectedRoute>
                  <VerifyIDs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-id"
              element={
                <ProtectedRoute>
                  <UploadIDs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fill-info"
              element={
                <ProtectedRoute>
                  <FillInformation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verification-pending"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <VerificationPending />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes - All nested under /patient */}
            {/* Redirect /patient to /patient/dashboard */}
            <Route
              path="/patient"
              element={<Navigate to="/patient/dashboard" replace />}
            />

            {/* Medical Features */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/health-records"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientHealthRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/messages"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientMessages />
                </ProtectedRoute>
              }
            />

            {/* Emergency & Community Features */}
            <Route
              path="/patient/report-emergency"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <ReportEmergencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/vehicle"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <VehicleSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/specify-vehicle"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <OtherVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/weather"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <Weather />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/notifications"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/settings"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPortal />
                </ProtectedRoute>
              }
            />

            {/* Responder Routes */}
            <Route
              path="/responder"
              element={
                <ProtectedRoute allowedRoles={["responder"]}>
                  <ResponderPortal />
                </ProtectedRoute>
              }
            />

            {/* Logistics Routes - Nested under /logistics */}
            {/* Redirect /logistics to /logistics/dashboard */}
            <Route
              path="/logistics"
              element={<Navigate to="/logistics/dashboard" replace />}
            />
            <Route
              path="/logistics/dashboard"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <DashboardLogistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/resource-management"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <ResourceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/asset-registry"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <AssetRegistry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/supply-tracking"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <SupplyTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/requested-allocation"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <RequestAllocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics/settings"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <SettingsLogistics />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<h1>404 Not Found</h1>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
