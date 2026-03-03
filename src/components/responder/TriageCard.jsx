// src/components/TriageCard.jsx
import React, { useEffect, useState } from "react";
import "../../styles/triage-style.css";

// ✅ DOH Hospitals in Metro Manila (same dataset used in MapCard)
const hospitals = [
  {
    name: "Philippine General Hospital (PGH)",
    position: [14.5794, 120.9822],
    specialty: "Cardiology, Emergency, Pediatrics",
  },
  {
    name: "East Avenue Medical Center",
    position: [14.6362, 121.0437],
    specialty: "Neurology, Internal Medicine, Trauma Care",
  },
  {
    name: "Rizal Medical Center",
    position: [14.5641, 121.0713],
    specialty: "Surgery, Obstetrics & Gynecology",
  },
  {
    name: "Jose R. Reyes Memorial Medical Center",
    position: [14.6155, 120.9843],
    specialty: "Emergency, Neurosurgery, Pediatrics",
  },
  {
    name: "St. Luke’s Medical Center (Quezon City)",
    position: [14.6397, 121.0518],
    specialty: "Cardiology, Orthopedics, Oncology",
  },
];

// 🧮 Function to simulate patient load per hospital
const generateTriageData = () =>
  hospitals.map((hospital) => {
    const base = Math.floor(Math.random() * 60 + 80); // base patient count
    return {
      hospital: hospital.name,
      low: Math.floor(base * 0.5),
      medium: Math.floor(base * 0.2),
      high: Math.floor(base * 0.15),
      veryHigh: Math.floor(base * 0.1),
      critical: Math.floor(base * 0.05),
    };
  });

const TriageCard = () => {
  const [triageData, setTriageData] = useState(generateTriageData());
  const [userLocation, setUserLocation] = useState(null);

  // 🔹 Track user location to simulate nearby updates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setUserLocation([14.5995, 120.9842]); // Default: Manila
        }
      );
    } else {
      setUserLocation([14.5995, 120.9842]);
    }
  }, []);

  // 🔄 Update triage data periodically (every 20s for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      setTriageData(generateTriageData());
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card triage-card">
      <h3 className="card-title">
        DOH Hospitals Triage System
        {userLocation && (
          <span style={{ fontSize: "0.8rem", color: "#666", marginLeft: "8px" }}>
            (Based on your current location in Manila)
          </span>
        )}
      </h3>

      <div className="triage-table-wrapper">
        <table className="triage-table">
          <thead>
            <tr>
              <th>DOH Accredited Hospital</th>
              <th className="low">Low</th>
              <th className="medium">Medium</th>
              <th className="high">High</th>
              <th className="very-high">Very High</th>
              <th className="critical">Critical</th>
            </tr>
          </thead>
          <tbody>
            {triageData.map((row, i) => (
              <tr key={i}>
                <td>{row.hospital}</td>
                <td className="low">{row.low}</td>
                <td className="medium">{row.medium}</td>
                <td className="high">{row.high}</td>
                <td className="very-high">{row.veryHigh}</td>
                <td className="critical">{row.critical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="triage-legend">
        <span><span className="legend-dot low"></span> Low</span>
        <span><span className="legend-dot medium"></span> Medium</span>
        <span><span className="legend-dot high"></span> High</span>
        <span><span className="legend-dot very-high"></span> Very High</span>
        <span><span className="legend-dot critical"></span> Critical</span>
      </div>
    </div>
  );
};

export default TriageCard;
