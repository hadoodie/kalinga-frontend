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
import { AdminPortal } from "./pages-admin/Admin";
import { ResponderPortal } from "./pages-responders/Responder";
import { SettingsLogistics } from "./pages-logistics/Settings";
import { PatientDashboard } from "./pages-patients/Dashboard";
import { PatientAppointment } from "./pages-patients/Appointment";
import { PatientHealthRecords } from "./pages-patients/HealthRecords";
import { PatientMessages } from "./pages-patients/Messages";
import { PatientSettings } from "./pages-patients/Settings";

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          ///Account
          <Route path="/login" element={<LogIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/create-acc" element={<CreateAccount />} />
          <Route path="/verify-id" element={<VerifyIDs />} />
          <Route path="/upload-id" element={<UploadIDs />} />
          <Route path="/fill-info" element={<FillInformation />} />
          ///Emergency
          <Route path="/report-emergency" element={<ReportEmergencies />} />
          <Route path="/vehicle" element={<VehicleSelection />} />
          <Route path="/specify-vehicle" element={<OtherVehicles />} />
          <Route path="/emergency-chat" element={<EmergencyChat />} />
          ///Resident
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/evacuation-center" element={<EvacuationCenter />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<ResidentSettings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/medical-facilities" element={<MedicalFacilities />} />
          ///Patient
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-appointments" element={<PatientAppointment />} />
          <Route path="/patient-health-records" element={<PatientHealthRecords />} />
          <Route path="/patient-messages" element={<PatientMessages />} />
          <Route path="/patient-settings" element={<PatientSettings />} />
          ///Logistics
          <Route path="/logistics-dashboard" element={<DashboardLogistics />} />
          <Route path="/resource-management" element={<ResourceManagement />} />
          <Route path="/asset-registry" element={<AssetRegistry />} />
          <Route path="/supply-tracking" element={<SupplyTracking />} />
          <Route path="/requested-allocation" element={<RequestAllocation />} />
          <Route path="/logistics-settings" element={<SettingsLogistics />} />
          ///Admin 
          <Route path="/admin" element={<AdminPortal />} />
          ///Responder
          <Route path="/responder" element={<ResponderPortal />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
