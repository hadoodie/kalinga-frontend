import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaExclamationTriangle, 
  FaUserMd, 
  FaHospital, 
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaMapMarkerAlt
} from "react-icons/fa";
import "../../styles/reports-card.css";

const Reports = () => {
  const [expandedSection, setExpandedSection] = useState("capacity");
  const [selectedAlert, setSelectedAlert] = useState(null);

  // DOH hospital-focused alerts with additional metadata
  const hospitalAlerts = [
    {
      id: 1,
      hospital: "Philippine General Hospital (PGH)",
      message: "Emergency Department nearing full capacity",
      action: "Prepare for patient redirection",
      severity: "high",
      occupancy: 94,
      time: "10 mins ago"
    },
    {
      id: 2,
      hospital: "East Avenue Medical Center",
      message: "ICU occupancy critical",
      action: "Coordinate overflow arrangements",
      severity: "critical",
      occupancy: 92,
      time: "25 mins ago"
    },
    {
      id: 3,
      hospital: "Rizal Medical Center",
      message: "Limited oxygen supply",
      action: "Request urgent replenishment",
      severity: "high",
      occupancy: 78,
      time: "1 hour ago"
    },
    {
      id: 4,
      hospital: "National Children's Hospital",
      message: "NICU nearing full capacity",
      action: "Redirect overflow to PGH Pediatrics",
      severity: "medium",
      occupancy: 88,
      time: "2 hours ago"
    },
  ];

  // Specialist availability alerts
  const specialistAlerts = [
    {
      id: 1,
      hospital: "Philippine General Hospital",
      specialty: "Cardiologists",
      status: "unavailable",
      redirect: "St. Luke's Medical Center (QC)",
      time: "Active"
    },
    {
      id: 2,
      hospital: "Jose R. Reyes Memorial",
      specialty: "Neurologists",
      status: "unavailable",
      redirect: "East Avenue Medical Center",
      time: "Active"
    },
    {
      id: 3,
      hospital: "Manila Doctors Hospital",
      specialty: "Orthopedic Team",
      status: "on rotation leave",
      redirect: "Rizal Medical Center",
      time: "Until 6:00 PM"
    },
    {
      id: 4,
      hospital: "Ospital ng Maynila",
      specialty: "Pediatricians",
      status: "limited",
      redirect: "National Children's Hospital",
      time: "Active"
    },
  ];

  const getSeverityClass = (severity) => {
    switch(severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      default: return 'severity-low';
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="reports-card">
      <div className="reports-header">
        <div className="reports-title">
          <FaHospital className="title-icon" />
          <div>
            <h3>DOH Hospital Reports</h3>
            <span className="subtitle">Real-time capacity & specialist alerts</span>
          </div>
        </div>
        <div className="alert-badge">
          <FaBell />
          <span>{hospitalAlerts.length + specialistAlerts.length}</span>
        </div>
      </div>

      {/* Hospital Capacity Section */}
      <div className="reports-section">
        <button 
          className={`section-header ${expandedSection === 'capacity' ? 'expanded' : ''}`}
          onClick={() => toggleSection('capacity')}
        >
          <div className="section-title">
            <FaExclamationTriangle className="section-icon warning" />
            <span>Hospital Capacity Alerts</span>
            <span className="alert-count">{hospitalAlerts.length}</span>
          </div>
          {expandedSection === 'capacity' ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        
        <AnimatePresence>
          {expandedSection === 'capacity' && (
            <motion.div 
              className="section-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {hospitalAlerts.map((alert, index) => (
                <motion.div 
                  key={alert.id}
                  className={`alert-item ${getSeverityClass(alert.severity)}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="alert-header">
                    <span className="hospital-name">{alert.hospital}</span>
                    <span className={`severity-badge ${alert.severity}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-meta">
                    <div className="occupancy-bar">
                      <div 
                        className="occupancy-fill"
                        style={{ width: `${alert.occupancy}%` }}
                      />
                      <span>{alert.occupancy}% occupied</span>
                    </div>
                    <span className="alert-time">
                      <FaClock /> {alert.time}
                    </span>
                  </div>
                  <div className="alert-action">
                    <strong>Action:</strong> {alert.action}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Specialist Availability Section */}
      <div className="reports-section">
        <button 
          className={`section-header ${expandedSection === 'specialist' ? 'expanded' : ''}`}
          onClick={() => toggleSection('specialist')}
        >
          <div className="section-title">
            <FaUserMd className="section-icon resource" />
            <span>Specialist Availability</span>
            <span className="alert-count">{specialistAlerts.length}</span>
          </div>
          {expandedSection === 'specialist' ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        
        <AnimatePresence>
          {expandedSection === 'specialist' && (
            <motion.div 
              className="section-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {specialistAlerts.map((alert, index) => (
                <motion.div 
                  key={alert.id}
                  className="specialist-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="specialist-header">
                    <span className="hospital-name">{alert.hospital}</span>
                    <span className={`status-badge ${alert.status.replace(/\s+/g, '-')}`}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="specialist-info">
                    <span className="specialty">
                      <FaUserMd /> {alert.specialty}
                    </span>
                    <span className="duration">{alert.time}</span>
                  </div>
                  <div className="redirect-info">
                    <FaMapMarkerAlt />
                    <span>Redirect to: <strong>{alert.redirect}</strong></span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;
