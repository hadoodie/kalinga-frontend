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

        {/* Page Content - scrollable area for pages */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
