import Hospital from "../components/dashboard/Hospitals";
import PatientSidebar from "../components/patients/Sidebar";
import { NavbarB } from "../components/Navbar_2";
import { useState } from "react";
import EmergencyFab from "../components/patients/EmergencyFab";

export const MedicalFacilities = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        {/* Navbar */}
        <div className="sticky top-0 z-10 bg-background">
          <NavbarB />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 mb-5">
          <Hospital />
        </main>
      </div>
      <EmergencyFab />
    </div>
  );
};
