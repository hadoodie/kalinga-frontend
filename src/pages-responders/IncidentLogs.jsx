import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import nodeApi from "../services/nodeApi";
import "../styles/incident-logs.css";

const POLL_INTERVAL_MS = 15000; // 15-second polling for live updates

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
  const lastPollRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Merge incoming incidents (upsert by id, keep sorted by created_at desc)
  const mergeIncidents = useCallback((incoming) => {
    setIncidents((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      incoming.forEach((i) => map.set(i.id, { ...map.get(i.id), ...i }));
      return [...map.values()].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    });
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const [incRes, hospRes] = await Promise.all([
          nodeApi.get("/incidents", { params: { limit: 50, sort_by: "created_at", order: "desc" } }),
          nodeApi.get("/hospitals"),
        ]);
        setIncidents(incRes.data?.data || []);
        setHospitals(hospRes.data?.data || []);
      } catch (err) {
        console.error("Failed to load incidents", err);
        setError("Failed to load incident logs.");
      } finally {
        setLoading(false);
        lastPollRef.current = new Date().toISOString();
      }
    };
    load();
  }, []);

  // Polling for live updates via Node API
  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await nodeApi.get("/incidents", {
          params: {
            limit: 50,
            sort_by: "created_at",
            order: "desc",
            ...(lastPollRef.current ? { date_from: lastPollRef.current } : {}),
          },
        });
        const fresh = data.data || [];
        if (fresh.length > 0) {
          mergeIncidents(fresh);
        }
        lastPollRef.current = new Date().toISOString();
      } catch {
        // silent — will retry next interval
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [mergeIncidents]);

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
