import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaExclamationTriangle,
  FaUserMd,
  FaHospital,
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import nodeApi from "../../services/nodeApi";
import "../../styles/reports-card.css";

const getSeverityClass = (severity) => {
  switch (severity) {
    case "critical": return "severity-critical";
    case "high":     return "severity-high";
    case "medium":   return "severity-medium";
    default:         return "severity-low";
  }
};

const Reports = () => {
  const [expandedSection, setExpandedSection] = useState("capacity");
  const [capacityAlerts, setCapacityAlerts] = useState([]);
  const [specialistAlerts, setSpecialistAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nodeApi
      .get("/reports", { params: { limit: 20 } })
      .then(({ data }) => {
        const reports = data.data || [];
        setCapacityAlerts(
          reports.filter((r) => r.type === "capacity" || r.type === "supply" || !r.type)
        );
        setSpecialistAlerts(reports.filter((r) => r.type === "specialist"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = (section) =>
    setExpandedSection(expandedSection === section ? null : section);

  const totalAlerts = capacityAlerts.length + specialistAlerts.length;

  return (
    <div className="reports-card">
      <div className="reports-header">
        <div className="reports-title">
          <FaHospital className="title-icon" />
          <div>
            <h3>DOH Hospital Reports</h3>
            <span className="subtitle">Real-time capacity &amp; specialist alerts</span>
          </div>
        </div>
        <div className="alert-badge">
          <FaBell />
          <span>{totalAlerts}</span>
        </div>
      </div>

      {loading && <p style={{ padding: "1rem" }}>Loading reports…</p>}

      {/* Hospital Capacity Section */}
      {!loading && (
        <div className="reports-section">
          <button
            className={`section-header ${expandedSection === "capacity" ? "expanded" : ""}`}
            onClick={() => toggleSection("capacity")}
          >
            <div className="section-title">
              <FaExclamationTriangle className="section-icon warning" />
              <span>Hospital Capacity Alerts</span>
              <span className="alert-count">{capacityAlerts.length}</span>
            </div>
            {expandedSection === "capacity" ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSection === "capacity" && (
              <motion.div
                className="section-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {capacityAlerts.length === 0 && (
                  <p style={{ padding: "0.5rem 1rem" }}>No capacity alerts.</p>
                )}
                {capacityAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    className={`alert-item ${getSeverityClass(alert.severity)}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="alert-header">
                      <span className="hospital-name">{alert.hospital_name}</span>
                      <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-meta">
                      {alert.occupancy != null && (
                        <div className="occupancy-bar">
                          <div
                            className="occupancy-fill"
                            style={{ width: `${alert.occupancy}%` }}
                          />
                          <span>{alert.occupancy}% occupied</span>
                        </div>
                      )}
                      <span className="alert-time">
                        <FaClock /> {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                    {alert.action && (
                      <div className="alert-action">
                        <strong>Action:</strong> {alert.action}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Specialist Availability Section */}
      {!loading && (
        <div className="reports-section">
          <button
            className={`section-header ${expandedSection === "specialist" ? "expanded" : ""}`}
            onClick={() => toggleSection("specialist")}
          >
            <div className="section-title">
              <FaUserMd className="section-icon resource" />
              <span>Specialist Availability</span>
              <span className="alert-count">{specialistAlerts.length}</span>
            </div>
            {expandedSection === "specialist" ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          <AnimatePresence>
            {expandedSection === "specialist" && (
              <motion.div
                className="section-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {specialistAlerts.length === 0 && (
                  <p style={{ padding: "0.5rem 1rem" }}>No specialist alerts.</p>
                )}
                {specialistAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    className="specialist-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="specialist-header">
                      <span className="hospital-name">{alert.hospital_name}</span>
                      <span className={`status-badge ${alert.status?.replace(/\s+/g, "-")}`}>
                        {alert.status}
                      </span>
                    </div>
                    <div className="specialist-info">
                      <span className="specialty"><FaUserMd /> {alert.title}</span>
                    </div>
                    {alert.action && (
                      <div className="redirect-info">
                        <FaMapMarkerAlt />
                        <span>Action: <strong>{alert.action}</strong></span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Reports;
