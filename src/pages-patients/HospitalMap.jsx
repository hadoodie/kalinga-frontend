import { useState } from "react";
import PatientSidebar from "../components/patients/Sidebar";
import { NavbarB } from "../components/Navbar_2";
import HospitalMap from "../pages-responders/pathfinding/HospitalMap";

export const PatientHospitalMap = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        <div className="sticky top-0 z-10 bg-background">
          <NavbarB />
        </div>
        <main className="flex-1 overflow-hidden p-0">
          <div className="h-full min-h-[calc(100vh-4rem)]">
            <HospitalMap embedded className="h-full" />
          </div>
        </main>
      </div>
    </div>
  );
};
