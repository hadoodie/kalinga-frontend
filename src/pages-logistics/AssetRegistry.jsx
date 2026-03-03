import { Footer } from "../components/Footer";
import Registry from "../components/logistics/AssetRegis";
import LogisticSidebar from "../components/logistics/LogiSide";
import { NavbarB } from "../components/Navbar_2";
import { useState } from "react";

export const AssetRegistry = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <LogisticSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content wrapper */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        {/* Navbar*/}
        <div className="sticky z-10 bg-background">
          <NavbarB />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto ">
          <Registry />
          <Footer />
        </main>
      </div>
    </div>
  );
};
