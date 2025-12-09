import { useState } from "react";
import PatientSidebar from "@/components/patients/Sidebar";
import { NavbarB } from "@/components/Navbar_2";
import HospitalNavigatorMap from "@/components/patients/HospitalNavigatorMap";

export const PatientHospitalNavigator = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        <div className="sticky top-0 z-10 bg-background shadow-sm">
          <NavbarB />
        </div>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">
                  Patient Navigation
                </p>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Hospital Navigator
                </h1>
                <p className="text-sm text-slate-600">
                  Find the best nearby hospital and start turn-by-turn
                  navigation.
                </p>
              </div>
            </div>
            <HospitalNavigatorMap />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientHospitalNavigator;
