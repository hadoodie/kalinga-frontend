import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages-home/Home";
import { LogIn } from "./pages-account/LogIn";
import { CreateAccount } from "./pages-account/CreateAccount";
import { Toaster } from "./components/ui/toaster";
import { VerifyIDs } from "./pages-account/VerifyID";
import { UploadIDs } from "./pages-account/UploadID";
import { FillInformation } from "./pages-account/FillInformation";
import { ReportEmergencies } from "./pages-resident/2_Report";
import { VehicleSelection } from "./pages-resident/2a_Vehicle";
import { OtherVehicles } from "./pages-resident/2b_OtherVehicle";
import { EmergencyChat } from "./pages-resident/3_Chat";
import { ForgotPassword } from "./pages-account/ForgotPassword";
import { Dashboard } from "./pages-resident/1_Dashboard";
import { Weather } from "./pages-resident/5_Weather";
import { EvacuationCenter } from "./pages-resident/4_EvacuationCenter";
import { Notifications } from "./pages-resident/6_Notification";
import { ResidentSettings } from "./pages-resident/7_Settings";
import { Profile } from "./pages-resident/8_Profile";
import { MedicalFacilities } from "./pages-resident/3_Hospital";
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
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <VerificationPending />
                </ProtectedRoute>
              }
            />

            {/* Resident/Patient Routes */}
            <Route
              path="/report-emergency"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <ReportEmergencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicle"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <VehicleSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/specify-vehicle"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <OtherVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-chat"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <EmergencyChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weather"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <Weather />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evacuation-center"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <EvacuationCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <ResidentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-facilities"
              element={
                <ProtectedRoute allowedRoles={["patient", "resident"]}>
                  <MedicalFacilities />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-appointments"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-health-records"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientHealthRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-messages"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-settings"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientSettings />
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

            {/* Logistics Routes */}
            <Route
              path="/logistics-dashboard"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <DashboardLogistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resource-management"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <ResourceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/asset-registry"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <AssetRegistry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supply-tracking"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <SupplyTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requested-allocation"
              element={
                <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                  <RequestAllocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistics-settings"
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
