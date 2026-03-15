import React from "react";
import ResponderTopbar from "../components/responder/Topbar";
import ResponderSidebar from "../components/responder/Sidebar";
import { ResponderDevMenuProvider } from "../context/ResponderDevMenuContext";

const Layout = ({ children, hideTopbar = false }) => {
  return (
    <ResponderDevMenuProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <ResponderSidebar hideTopbar={hideTopbar} />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Topbar — hidden on mobile when active routing is engaged */}
          <div className={hideTopbar ? "hidden md:block" : ""}>
            <ResponderTopbar />
          </div>

          {/* Page Content - scrollable area for pages */}
          <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
        </div>
      </div>
    </ResponderDevMenuProvider>
  );
};

export default Layout;
