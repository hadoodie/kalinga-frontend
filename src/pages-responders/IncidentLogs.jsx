import React, { useState } from "react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import { useTriage } from "../context/TriageProvider";
import { generateIncidentLogsFromTriage, hospitals } from "../lib/triageUtils";
import "../styles/incident-logs.css";

const IncidentLogs = () => {
  const { triageData } = useTriage();
  const incidentLogs = generateIncidentLogsFromTriage(triageData);
  const [selectedHospital, setSelectedHospital] = useState("All");

  const filteredLogs = selectedHospital === "All"
    ? incidentLogs
    : incidentLogs.filter(log => log.hospital === selectedHospital);

  return (
    <Layout>
      <div className="incident-logs-container">
        <h2>Incident Logs</h2>
        <p className="subtitle">Real-time incident tracking from the Triage System</p>

        <div className="filter-container">
          <label>Filter by Hospital:</label>
          <select
            className="hospital-filter"
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
          >
            <option value="All">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className="incident-grid">
          {filteredLogs.length === 0 ? (
            <p className="no-incidents">No incidents found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="incident-card"
                data-severity={log.severity}
              >
                <div className="card-content">
                  <div className="incident-header">
                    <h3>{log.hospital}</h3>
                    <span className="incident-icon">{log.icon}</span>
                  </div>
                  <p className="incident-type">{log.type}</p>
                  <p className="incident-status">
                    Status: <span className={`status-${log.severity}`}>{log.status}</span>
                  </p>
                  <p className="text-xs">Patient: {log.patientName}</p>
                  <p className="text-xs">Time: {log.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  );
};

export default IncidentLogs;
