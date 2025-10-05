import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages-home/1_Home";
import { LogIn } from "./pages-account/1_LogIn";
import { CreateAccount } from "./pages-account/3_CreateAcc";
import { Toaster } from "./components/ui/toaster";
import { VerifyIDs } from "./pages-account/4_VerifyID";
import { UploadIDs } from "./pages-account/5_UploadID";
import { FillInformation } from "./pages-account/6_FillInformation";
import { ReportEmergencies } from "./pages-resident/2_Report";
import { VehicleSelection } from "./pages-resident/2a_Vehicle";
import { OtherVehicles } from "./pages-resident/2b_OtherVehicle";
import { EmergencyChat } from "./pages-resident/3_Chat";
import { ForgotPassword } from "./pages-account/2_ForgotPassword";
import { Dashboard } from "./pages-resident/1_Dashboard";
import { Weather } from "./pages-resident/5_Weather";
import { EvacuationCenter } from "./pages-resident/4_EvacuationCenter";
import { Notifications } from "./pages-resident/6_Notification";
import { ResidentSettings } from "./pages-resident/7_Settings";
import { Profile } from "./pages-resident/8_Profile";
import { MedicalFacilities } from "./pages-resident/3_Hospital";
import { SupplyTracking } from "./pages-logistics/4_Supply";
import { RequestAllocation } from "./pages-logistics/5_Request";
import { AssetRegistry } from "./pages-logistics/3_Registry";
import { ResourceManagement } from "./pages-logistics/2_ResourceMngmt";
import { DashboardLogistics } from "./pages-logistics/1_LogisDash";
import { AdminPortal } from "./pages-admin/1_Admin";
import { ResponderPortal } from "./pages-responders/1_Responder";

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
          <Route path="/responder" element={<ResponderPortal />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
