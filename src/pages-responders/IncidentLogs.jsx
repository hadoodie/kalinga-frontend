import React, { useState, useEffect } from "react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import nodeApi from "../services/nodeApi";
import "../styles/incident-logs.css";

const STATUS_ICONS = {
  reported: "🔵",
  acknowledged: "🔶",
  en_route: "⚠️",
  on_scene: "🚨",
  transporting: "🚑",
  hospital_transfer: "🏥",
  resolved: "✅",
  cancelled: "❌",
};

const IncidentLogs = () => {
  const [incidents, setIncidents] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      nodeApi.get("/incidents", { params: { limit: 50, sort_by: "created_at", order: "desc" } }),
      nodeApi.get("/hospitals"),
    ])
      .then(([incRes, hospRes]) => {
        setIncidents(incRes.data?.data || []);
        setHospitals(hospRes.data?.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load incident logs.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs =
    selectedHospital === "All"
      ? incidents
      : incidents.filter((inc) =>
          inc.location
            ?.toLowerCase()
            .includes(selectedHospital.toLowerCase())
        );

  return (
    <Layout>
      <div className="incident-logs-container">
        <h2>Incident Logs</h2>
        <p className="subtitle">Real-time incident tracking from the database</p>

        <div className="filter-container">
          <label>Filter by Hospital:</label>
          <select
            className="hospital-filter"
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
          >
            <option value="All">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <p style={{ padding: "1rem" }}>Loading incidents…</p>}
        {error && <p style={{ color: "red", padding: "1rem" }}>{error}</p>}

        {!loading && !error && (
          <div className="incident-grid">
            {filteredLogs.length === 0 ? (
              <p className="no-incidents">No incidents found.</p>
            ) : (
              filteredLogs.map((inc) => (
                <div
                  key={inc.id}
                  className="incident-card"
                  data-status={inc.status}
                >
                  <div className="card-content">
                    <div className="incident-header">
                      <h3>{inc.location || "Unknown location"}</h3>
                      <span className="incident-icon">
                        {STATUS_ICONS[inc.status] || "📋"}
                      </span>
                    </div>
                    <p className="incident-type">{inc.type}</p>
                    <p className="incident-status">
                      Status:{" "}
                      <span className={`status-badge status-${inc.status?.replace(/_/g, "-")}`}>
                        {inc.status}
                      </span>
                    </p>
                    {inc.reporter_name && (
                      <p className="text-xs">Reporter: {inc.reporter_name}</p>
                    )}
                    <p className="text-xs">
                      Time: {new Date(inc.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <Footer />
    </Layout>
  );
};

export default IncidentLogs;
