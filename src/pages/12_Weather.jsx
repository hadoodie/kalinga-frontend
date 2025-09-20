import Sidebar from "../components/dashboard/Sidebar";
import WeatherSection from "../components/dashboard/Weather";
import { NavbarB } from "../components/Navbar_2";
import { useState } from "react";

export const Weather = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

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
        <main className="flex-1 overflow-y-auto p-4 mt-15 mb-5">
          <WeatherSection />
        </main>
      </div>
    </div>
  );
};
