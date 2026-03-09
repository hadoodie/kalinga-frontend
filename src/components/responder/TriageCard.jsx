// src/components/TriageCard.jsx
import React, { useEffect, useState } from "react";
import nodeApi from "../../services/nodeApi";
import "../../styles/triage-style.css";

const TriageCard = () => {
  const [triageData, setTriageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchTriage = () => {
    Promise.all([
      nodeApi.get("/hospitals"),
      nodeApi.get("/triage/stats"),
    ])
      .then(([hospitalsRes, statsRes]) => {
        const hospitals = hospitalsRes.data?.data || [];
        const agg = statsRes.data?.data || {};
        const count = Math.max(hospitals.length, 1);

        const per = (n) => Math.round((n || 0) / count);

        setTriageData(
          hospitals.slice(0, 10).map((h) => ({
            hospital: h.name,
            low:      per(agg.low),
            medium:   per(agg.medium),
            high:     per(agg.high),
            veryHigh: per(agg.very_high),
            critical: per(agg.critical),
          }))
        );
        setFetchError(null);
      })
      .catch((err) => {
        console.error(err);
        setFetchError("Failed to load triage data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTriage();
    const interval = setInterval(fetchTriage, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card triage-card">
      <h3 className="card-title">DOH Hospitals Triage System</h3>

      {loading && <p style={{ padding: "1rem" }}>Loading triage data…</p>}
      {fetchError && <p style={{ color: "red", padding: "1rem" }}>{fetchError}</p>}

      {!loading && !fetchError && (
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
              {triageData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    No triage data available
                  </td>
                </tr>
              ) : (
                triageData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.hospital}</td>
                    <td className="low">{row.low}</td>
                    <td className="medium">{row.medium}</td>
                    <td className="high">{row.high}</td>
                    <td className="very-high">{row.veryHigh}</td>
                    <td className="critical">{row.critical}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
