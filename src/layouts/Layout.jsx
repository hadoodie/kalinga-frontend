// src/layouts/Layout.jsx
import React from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import "../styles/layout.css";

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      {/* Sidebar fixed on the left */}
      <Sidebar />

      {/* Right side: Topbar + Content + Footer */}
      <div className="layout-main">
        <Topbar />

        {/* Main Page Content */}
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
