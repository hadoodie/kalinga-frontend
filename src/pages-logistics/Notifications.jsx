import LogisticSidebar from "../components/logistics/LogiSide";
import { NavbarB } from "../components/Navbar_2";
import { useState } from "react";
import Notifs from "../components/Notifications";

export const NotificationsLogistics = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <LogisticSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

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
        <main className="flex-1 overflow-y-auto">
          <Notifs />
        </main>
      </div>
    </div>
  );
};
