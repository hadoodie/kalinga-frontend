import React from "react";
import ResponderTopbar from "../components/responder/Topbar";
import ResponderSidebar from "../components/responder/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ResponderSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <ResponderTopbar />

        {/* Page Content - No scrolling, children handle their own layout */}
        <main className="flex-1 flex flex-col min-h-0 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
