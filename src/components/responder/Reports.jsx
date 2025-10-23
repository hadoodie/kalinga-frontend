import React from "react";
import { FaExclamationTriangle, FaUserMd } from "react-icons/fa";
import "../../styles/personnel-style.css"; // Custom card styles

const Reports = () => {
  // 🔹 DOH hospital-focused alerts (Metro Manila)
  const hospitalAlerts = [
    "Philippine General Hospital (PGH) is nearing **full capacity** in the Emergency Department. Prepare for **patient redirection**.",
    "East Avenue Medical Center ICU occupancy at **92%**. Coordinate **overflow arrangements**.",
    "Rizal Medical Center reports **limited oxygen supply**. Request **urgent replenishment**.",
    "National Children’s Hospital **NICU nearing full capacity**. Redirect overflow to **PGH Pediatrics Department**.",
  ];

  // 🔹 Specialist availability and redirection suggestions
  const specialistAlerts = [
    "PGH currently lacks available **Cardiologists**. Redirect cardiac patients to **St. Luke’s Medical Center (Quezon City)**.",
    "Jose R. Reyes Memorial Medical Center has no **Neurologists** on duty. Redirect critical cases to **East Avenue Medical Center**.",
    "Manila Doctors Hospital **Orthopedic team on rotation leave**. Transfer trauma cases to **Rizal Medical Center**.",
    "Ospital ng Maynila requires additional **Pediatricians**. Coordinate support from **National Children’s Hospital**.",
  ];

  // 🔹 Helper to render alerts with bold parts
  const renderAlert = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g); // Split text where bold markers are found
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
  };

  return (
    <div className="card reports-card">
      <h3 className="card-title">DOH Hospital Reports</h3>

      {/* Hospital Alerts */}
      <div className="section">
        <h4 className="section-title">Hospital Capacity Alerts</h4>
        <ul className="list">
          {hospitalAlerts.map((alert, i) => (
            <li key={i}>
              <FaExclamationTriangle className="icon warning" />
              <span>{renderAlert(alert)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Specialist Alerts */}
      <div className="section">
        <h4 className="section-title">Specialist Availability</h4>
        <ul className="list">
          {specialistAlerts.map((alert, i) => (
            <li key={i}>
              <FaUserMd className="icon resource" />
              <span>{renderAlert(alert)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Reports;
