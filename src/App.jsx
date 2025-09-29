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
import { AdminPortal } from "./pages/Admin";

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/create-acc" element={<CreateAccount />} />
          <Route path="/verify-id" element={<VerifyIDs />} />
          <Route path="/upload-id" element={<UploadIDs />} />
          <Route path="/fill-info" element={<FillInformation />} />
          <Route path="/report-emergency" element={<ReportEmergencies />} />
          <Route path="/vehicle" element={<VehicleSelection />} />
          <Route path="/specify-vehicle" element={<OtherVehicles />} />
          <Route path="/emergency-chat" element={<EmergencyChat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/evacuation-center" element={<EvacuationCenter />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<ResidentSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/medical-facilities" element={<MedicalFacilities />} />
          <Route path="/logistic-dashboard" element={<DashboardLogistics />} />
          <Route path="/resource-management" element={<ResourceManagement />} />
          <Route path="/asset-registry" element={<AssetRegistry />} />
          <Route path="/supply-tracking" element={<SupplyTracking />} />
          <Route path="/requested-allocation" element={<RequestAllocation />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
