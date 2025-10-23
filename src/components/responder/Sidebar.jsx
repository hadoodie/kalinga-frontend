// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/personnel-style.css";

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
        <li className={isActive("/responder/dashboard") ? "active" : ""}>
          <Link to="/responder/dashboard">Dashboard</Link>
        </li>

        <li className={isActive("/responder/incident-logs") ? "active" : ""}>
          <Link to="/responder/incident-logs">Incident Logs</Link>
        </li>

        <li className={isActive("/responder/emergency-sos") ? "active" : ""}>
          <Link to="/responder/emergency-sos">Emergency SOS</Link>
        </li>

        <li className={isActive("/responder/triage-system") ? "active" : ""}>
          <Link to="/responder/triage-system">Triage System</Link>
        </li>

        {/* Online Training with submenu */}
        <li
          className={`has-submenu ${
            isActive("/responder/online-training") ||
            isActive("/responder/modules") ||
            isActive("/responder/certifications")
              ? "active"
              : ""
          }`}
        >
          <Link to="/responder/online-training">Online Training</Link>
          <ul className="submenu">
            <li className={isActive("/responder/modules") ? "active" : ""}>
              <Link to="/responder/modules">Modules</Link>
            </li>
            <li className={isActive("/responder/certifications") ? "active" : ""}>
              <Link to="/responder/certifications">Certifications</Link>
            </li>
          </ul>
        </li>

        <li className={isActive("/responder/settings") ? "active" : ""}>
          <Link to="/responder/settings">Settings</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
