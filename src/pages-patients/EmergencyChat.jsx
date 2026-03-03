import { useState } from "react";
import { ChatReport } from "../components/emergency-sos/Chat";
import { NavbarB } from "../components/Navbar_2";
import PatientSidebar from "../components/patients/Sidebar";
import ChatSidebar from "../components/emergency-sos/ChatSidebar";
import EmergencyFab from "../components/patients/EmergencyFab";

export const EmergencyChat = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeResponder, setActiveResponder] = useState(null);

  return (
    <div className="h-full flex bg-background text-foreground overflow-y-hidden">
      {/* Main App Sidebar */}
      <PatientSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content wrapper */}
      <div
        className={`h-full flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "wl-16" : "wl-64"
        }`}
      >
        {/* Navbar */}
        <div className="sticky top-0 z-10 bg-background">
          <NavbarB />
        </div>

        {/* Content area with responder sidebar + chat */}
        <main className="flex-1 flex overflow-hidden ">
          {/* Chat Responder Sidebar */}
          <div className="h-full">
            <ChatSidebar
              activeResponder={activeResponder}
              setActiveResponder={setActiveResponder}
            />
          </div>

          {/* Chat Window */}
          <div className="flex-1 overflow-y-auto">
            <ChatReport responder={activeResponder} />
          </div>
        </main>
      </div>
      <EmergencyFab />
    </div>
  );
};
