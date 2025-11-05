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

        {/* Page Content with scroll */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
