// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/personnel-style.css";

const Sidebar = () => {
  const location = useLocation();

  // Helper to check active state
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="/light-mode.svg" alt="KALINGA Logo" />
        <h1>KALINGA</h1>
      </div>
      <ul>
        <li className={isActive("/dashboard") ? "active" : ""}>
          <Link to="/dashboard">Dashboard</Link>
        </li>

        <li className={isActive("/incident-logs") ? "active" : ""}>
          <Link to="/incident-logs">Incident Logs</Link>
        </li>

        <li className={isActive("/emergency-sos") ? "active" : ""}>
          <Link to="/emergency-sos">Emergency SOS</Link>
        </li>

        <li className={isActive("/triage-system") ? "active" : ""}>
          <Link to="/triage-system">Triage System</Link>
        </li>

        {/* Online Training with submenu */}
        <li
          className={`has-submenu ${
            isActive("/online-training") ||
            isActive("/modules") ||
            isActive("/certifications")
              ? "active"
              : ""
          }`}
        >
          <Link to="/online-training">Online Training</Link>
          <ul className="submenu">
            <li className={isActive("/modules") ? "active" : ""}>
              <Link to="/modules">Modules</Link>
            </li>
            <li className={isActive("/certifications") ? "active" : ""}>
              <Link to="/certifications">Certifications</Link>
            </li>
          </ul>
        </li>

        <li className={isActive("/settings") ? "active" : ""}>
          <Link to="/settings">Settings</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
