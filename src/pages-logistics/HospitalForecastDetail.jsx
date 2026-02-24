import { Footer } from "../components/Footer";
import HospitalForecastDetail from "../components/logistics/forecast-v2/HospitalForecastDetail";
import LogisticSidebar from "../components/logistics/LogiSide";
import { NavbarB } from "../components/Navbar_2";
import { useState } from "react";

export const HospitalForecastDetailPage = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <LogisticSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <HospitalForecastDetail />
          <Footer />
        </main>
      </div>
    </div>
  );
};
