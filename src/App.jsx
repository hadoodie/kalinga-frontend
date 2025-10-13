import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/1_Home";
import { LogIn } from "./pages/2_LogIn";
import { CreateAccount } from "./pages/3_CreateAcc";
import { Toaster } from "./components/ui/toaster";
import { VerifyIDs } from "./pages/4_VerifyID";
import { UploadIDs } from "./pages/5_UploadID";
import { FillInformation } from "./pages/6_FillInformation";
import { ReportEmergencies } from "./pages/7_Report";
import { VehicleSelection } from "./pages/8_Vehicle";
import { OtherVehicles } from "./pages/9_OtherVehicle";
import { EmergencyChat } from "./pages/10_Chat";
import { ForgotPassword } from "./pages/2_ForgotPassword";
import { Dashboard } from "./pages/11_Dashboard";
import { Weather } from "./pages/12_Weather";
import { EvacuationCenter } from "./pages/13_EvacuationCenter";
import { Notifications } from "./pages/14_Notification";
import { ResidentSettings } from "./pages/15_Settings";
import { Profile } from "./pages/16_Profile";
import { MedicalFacilities } from "./pages/17_Hospital";
import { SupplyTracking } from "./pages-logis/4_Supply";
import { RequestAllocation } from "./pages-logis/5_Request";
import { AssetRegistry } from "./pages-logis/3_Registry";
import { ResourceManagement } from "./pages-logis/2_ResourceMngmt";
import { DashboardLogistics } from "./pages-logis/1_LogisDash";
import AdminDashboard from "./pages/18_Admin";
import ResponderDashboard from "./pages/19_Responder";
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
            <Route index element={<Home />}/>
            <Route path="/login" element={<LogIn />}/>
            <Route path="/forgot-password" element={<ForgotPassword />}/>
            <Route path="/create-acc" element={<CreateAccount />}/>
            
            {/* Account Creation Flow - Protected */}
            <Route path="/verify-id" element={
              <ProtectedRoute>
                <VerifyIDs />
              </ProtectedRoute>
            }/>
            <Route path="/upload-id" element={
              <ProtectedRoute>
                <UploadIDs />
              </ProtectedRoute>
            }/>
            <Route path="/fill-info" element={
              <ProtectedRoute>
                <FillInformation />
              </ProtectedRoute>
            }/>
            
            {/* Resident/Patient Routes */}
            <Route path="/report-emergency" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <ReportEmergencies />
              </ProtectedRoute>
            }/>
            <Route path="/vehicle" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <VehicleSelection />
              </ProtectedRoute>
            }/>
            <Route path="/specify-vehicle" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <OtherVehicles />
              </ProtectedRoute>
            }/>
            <Route path="/emergency-chat" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <EmergencyChat />
              </ProtectedRoute>
            }/>
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <Dashboard />
              </ProtectedRoute>
            }/>
            <Route path="/weather" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <Weather />
              </ProtectedRoute>
            }/>
            <Route path="/evacuation-center" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <EvacuationCenter />
              </ProtectedRoute>
            }/>
            <Route path="/notifications" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <Notifications />
              </ProtectedRoute>
            }/>
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <ResidentSettings />
              </ProtectedRoute>
            }/>
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <Profile />
              </ProtectedRoute>
            }/>
            <Route path="/medical-facilities" element={
              <ProtectedRoute allowedRoles={["patient", "resident"]}>
                <MedicalFacilities />
              </ProtectedRoute>
            }/>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }/>
            
            {/* Responder Routes */}
            <Route path="/responder" element={
              <ProtectedRoute allowedRoles={["responder"]}>
                <ResponderDashboard />
              </ProtectedRoute>
            }/>
            
            {/* Logistics Routes */}
            <Route path="/logistic-dashboard" element={
              <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                <DashboardLogistics />
              </ProtectedRoute>
            }/>
            <Route path="/resource-management" element={
              <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                <ResourceManagement />
              </ProtectedRoute>
            }/>
            <Route path="/asset-registry" element={
              <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                <AssetRegistry />
              </ProtectedRoute>
            }/>
            <Route path="/supply-tracking" element={
              <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                <SupplyTracking />
              </ProtectedRoute>
            }/>
            <Route path="/requested-allocation" element={
              <ProtectedRoute allowedRoles={["logistics", "admin"]}>
                <RequestAllocation />
              </ProtectedRoute>
            }/>
            
            {/* 404 */}
            <Route path="*" element={<h1>404 Not Found</h1>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App; 