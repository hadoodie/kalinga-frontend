// src/pages/TriageSystem.jsx
import React, { useState } from "react";
import Layout from "../layouts/Layout";
import "../styles/personnel-style.css";
import Footer from "../components/responder/Footer";

const TriageSystem = () => {
  const [selectedArea, setSelectedArea] = useState("Metro Manila");

  const areas = [
    "Metro Manila",
    "North Luzon",
    "South Luzon",
    "Visayas",
    "Mindanao",
  ];

  const data = {
    "Metro Manila": [
      { hospital: "Philippine Heart Center", values: [25, 12, 4, 3, 1] },
      { hospital: "East Avenue Medical Center", values: [40, 18, 10, 5, 2] },
      {
        hospital: "Jose Reyes Memorial Medical Center",
        values: [32, 14, 6, 4, 1],
      },
      { hospital: "San Lazaro Hospital", values: [28, 20, 9, 2, 0] },
    ],
    "North Luzon": [
      { hospital: "Baguio General Hospital", values: [38, 10, 5, 2, 1] },
      {
        hospital: "Ilocos Training & Regional Medical Center",
        values: [25, 12, 6, 2, 1],
      },
    ],
    "South Luzon": [
      { hospital: "Batangas Medical Center", values: [45, 22, 10, 6, 2] },
      { hospital: "Bicol Regional Hospital", values: [30, 15, 8, 5, 2] },
    ],
    Visayas: [
      {
        hospital: "Vicente Sotto Memorial Medical Center",
        values: [40, 18, 9, 4, 1],
      },
      { hospital: "Western Visayas Medical Center", values: [32, 14, 6, 3, 0] },
    ],
    Mindanao: [
      {
        hospital: "Southern Philippines Medical Center",
        values: [60, 20, 15, 6, 3],
      },
      {
        hospital: "Northern Mindanao Medical Center",
        values: [35, 18, 9, 5, 2],
      },
    ],
  };

  const alerts = [
    {
      text: "Philippine Heart Center currently lacks <b>cardiologists</b> for new critical cases. Patients will be redirected to East Avenue Medical Center.",
      level: "critical",
    },
    {
      text: "Jose Reyes Memorial Medical Center reports a <b>surge in neurology cases</b>. Requesting additional neurologists from nearby facilities.",
      level: "veryHigh",
    },
  ];

  const highlights = [
    {
      text: "<b>High severity</b> respiratory cases rising at San Lazaro Hospital.",
      level: "high",
    },
    {
      text: "East Avenue Medical Center shows <b>increased orthopedic admissions</b>.",
      level: "medium",
    },
    {
      text: "Philippine Heart Center remains at <b>maximum ICU capacity</b>.",
      level: "critical",
    },
  ];

  const badge = {
    low: "🟢 Low",
    medium: "🟡 Medium",
    high: "🟠 High",
    veryHigh: "🔥 Very High",
    critical: "🔴 Critical",
  };

  return (
    <Layout>
      <div className="content">
        {/* === PAGE HEADER === */}
        <div className="page-header">
          <h2 className="page-title">
            DOH Hospital Triage & Specialist Tracking
          </h2>
          <div className="region-dropdown">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              {areas.map((area, i) => (
                <option key={i} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* === TRIAGE CARD === */}
        <div className="triage-card">
          <h2 className="triage-title">{selectedArea}</h2>

          {/* TABLE WRAPPER */}
          <div className="table-container">
            <table className="triage-table">
              <thead>
                <tr>
                  <th>DOH Hospital</th>
                  <th>Low</th>
                  <th>Medium</th>
                  <th>High</th>
                  <th>Very High</th>
                  <th>Critical</th>
                </tr>
              </thead>
              <tbody>
                {data[selectedArea].map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.hospital}</td>
                    <td className="cell low">{row.values[0]}</td>
                    <td className="cell medium">{row.values[1]}</td>
                    <td className="cell high">{row.values[2]}</td>
                    <td className="cell veryHigh">{row.values[3]}</td>
                    <td className="cell critical">{row.values[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* === LEGEND === */}
          <div className="legend">
            {Object.values(badge).map((b, i) => (
              <div key={i} className="legend-item">
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* === ALERTS === */}
        <div className="alerts-card">
          <h3>Specialist Availability Alerts</h3>
          {alerts.map((a, i) => (
            <div key={i} className="alert-item">
              <span className={`badge ${a.level}`}>{badge[a.level]}</span>{" "}
              <span dangerouslySetInnerHTML={{ __html: a.text }} />
            </div>
          ))}
        </div>

        {/* === HIGHLIGHTS === */}
        <div className="highlights-card">
          <h3>Real-Time Hospital Highlights</h3>
          {highlights.map((h, i) => (
            <div key={i} className="highlight-item">
              <span className={`badge ${h.level}`}>{badge[h.level]}</span>{" "}
              <span dangerouslySetInnerHTML={{ __html: h.text }} />
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </Layout>
  );
};

export default TriageSystem;
