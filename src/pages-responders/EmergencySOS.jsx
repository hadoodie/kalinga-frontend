// src/pages-responders/EmergencySOS.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/emergency-sos.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom hospital icon
const hospitalIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom user icon
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper component to move map to province center
const SetViewOnLocation = ({ coords, zoom = 10 }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, zoom);
  }, [coords, map, zoom]);
  return null;
};

// Province centers for map positioning
const provinceCenters = {
  "Metro Manila": [14.5995, 120.9842],
  Laguna: [14.2691, 121.4113],
  Cavite: [14.2456, 120.8783],
  Bulacan: [14.8527, 120.816],
  Pampanga: [15.0794, 120.62],
  Batangas: [13.7565, 121.0583],
  Rizal: [14.6037, 121.3084],
  Quezon: [14.0313, 122.1105],
};

// Comprehensive hospital data by province
const hospitalsByProvince = {
  "Metro Manila": [
    {
      name: "Philippine General Hospital (PGH)",
      position: [14.5737, 120.9831],
      specialty: "General, Emergency, Pediatrics, Surgery",
      status: "active",
      capacity: 85,
    },
    {
      name: "St. Luke's Medical Center (QC)",
      position: [14.6425, 121.045],
      specialty: "Cardiology, Neurology, Orthopedics",
      status: "active",
      capacity: 72,
    },
    {
      name: "Makati Medical Center",
      position: [14.5547, 121.0151],
      specialty: "Internal Medicine, Emergency, OB-Gyne",
      status: "active",
      capacity: 68,
    },
    {
      name: "East Avenue Medical Center",
      position: [14.641, 121.048],
      specialty: "Emergency, Trauma, Surgery",
      status: "active",
      capacity: 90,
    },
    {
      name: "Manila Doctors Hospital",
      position: [14.5824, 120.9808],
      specialty: "Cardiology, Oncology, Internal Medicine",
      status: "active",
      capacity: 65,
    },
    {
      name: "Jose R. Reyes Memorial Medical Center",
      position: [14.6077, 120.9812],
      specialty: "Neurology, Pediatrics, Surgery",
      status: "active",
      capacity: 78,
    },
    {
      name: "The Medical City",
      position: [14.5866, 121.0615],
      specialty: "Multi-specialty, Cancer Center",
      status: "active",
      capacity: 55,
    },
    {
      name: "Philippine Heart Center",
      position: [14.6421, 121.0431],
      specialty: "Cardiology, Cardiac Surgery",
      status: "alert",
      capacity: 95,
    },
    {
      name: "Lung Center of the Philippines",
      position: [14.6399, 121.0419],
      specialty: "Pulmonology, Thoracic Surgery",
      status: "active",
      capacity: 70,
    },
    {
      name: "National Kidney and Transplant Institute",
      position: [14.6387, 121.0413],
      specialty: "Nephrology, Transplant Surgery",
      status: "active",
      capacity: 60,
    },
  ],
  Laguna: [
    {
      name: "Laguna Provincial Hospital",
      position: [14.2833, 121.4],
      specialty: "General, Emergency",
      status: "active",
      capacity: 75,
    },
    {
      name: "Los Banos Doctors Hospital",
      position: [14.1667, 121.2333],
      specialty: "General, Pediatrics",
      status: "active",
      capacity: 50,
    },
    {
      name: "Calamba Medical Center",
      position: [14.2117, 121.1653],
      specialty: "Emergency, Surgery",
      status: "active",
      capacity: 65,
    },
    {
      name: "San Pablo City General Hospital",
      position: [14.0667, 121.3167],
      specialty: "General, OB-Gyne",
      status: "active",
      capacity: 55,
    },
  ],
  Cavite: [
    {
      name: "General Emilio Aguinaldo Memorial Hospital",
      position: [14.2883, 120.8933],
      specialty: "General, Emergency, Surgery",
      status: "active",
      capacity: 80,
    },
    {
      name: "De La Salle University Medical Center",
      position: [14.2275, 120.985],
      specialty: "Multi-specialty, Research",
      status: "active",
      capacity: 45,
    },
    {
      name: "Imus Municipal Hospital",
      position: [14.4333, 120.9333],
      specialty: "General, Emergency",
      status: "active",
      capacity: 70,
    },
    {
      name: "Bacoor District Hospital",
      position: [14.4578, 120.9397],
      specialty: "General, Pediatrics",
      status: "alert",
      capacity: 88,
    },
  ],
  Bulacan: [
    {
      name: "Bulacan Medical Center",
      position: [14.8, 120.9167],
      specialty: "General, Emergency, Surgery",
      status: "active",
      capacity: 75,
    },
    {
      name: "Malolos Doctors Hospital",
      position: [14.8433, 120.8117],
      specialty: "General, Internal Medicine",
      status: "active",
      capacity: 60,
    },
    {
      name: "Meycauayan District Hospital",
      position: [14.7367, 120.9617],
      specialty: "General, Emergency",
      status: "active",
      capacity: 55,
    },
    {
      name: "San Jose del Monte General Hospital",
      position: [14.8139, 121.0453],
      specialty: "General, OB-Gyne",
      status: "active",
      capacity: 65,
    },
  ],
  Pampanga: [
    {
      name: "Jose B. Lingad Memorial Regional Hospital",
      position: [15.0833, 120.6],
      specialty: "General, Emergency, Trauma",
      status: "active",
      capacity: 85,
    },
    {
      name: "Angeles University Foundation Medical Center",
      position: [15.145, 120.5883],
      specialty: "Multi-specialty, Teaching Hospital",
      status: "active",
      capacity: 50,
    },
    {
      name: "Sacred Heart Medical Center",
      position: [15.1583, 120.5917],
      specialty: "Cardiology, Surgery",
      status: "active",
      capacity: 60,
    },
    {
      name: "Guagua District Hospital",
      position: [14.9667, 120.6333],
      specialty: "General, Emergency",
      status: "alert",
      capacity: 92,
    },
  ],
  Batangas: [
    {
      name: "Batangas Medical Center",
      position: [13.7567, 121.0583],
      specialty: "General, Emergency, Surgery",
      status: "active",
      capacity: 80,
    },
    {
      name: "Lipa Medix Medical Center",
      position: [13.9411, 121.1625],
      specialty: "General, Pediatrics",
      status: "active",
      capacity: 55,
    },
    {
      name: "Balayan District Hospital",
      position: [13.9333, 120.7333],
      specialty: "General, Emergency",
      status: "active",
      capacity: 60,
    },
    {
      name: "Lemery District Hospital",
      position: [13.8783, 120.9067],
      specialty: "General, OB-Gyne",
      status: "active",
      capacity: 50,
    },
  ],
  Rizal: [
    {
      name: "Rizal Provincial Hospital",
      position: [14.6, 121.0833],
      specialty: "General, Emergency, Surgery",
      status: "active",
      capacity: 75,
    },
    {
      name: "Antipolo City Hospital",
      position: [14.5858, 121.1761],
      specialty: "General, Pediatrics",
      status: "active",
      capacity: 65,
    },
    {
      name: "Rodriguez Memorial Hospital",
      position: [14.7417, 121.1167],
      specialty: "General, Emergency",
      status: "active",
      capacity: 50,
    },
    {
      name: "Cainta Municipal Hospital",
      position: [14.5833, 121.1167],
      specialty: "General, OB-Gyne",
      status: "alert",
      capacity: 90,
    },
  ],
  Quezon: [
    {
      name: "Quezon Medical Center",
      position: [13.9333, 121.6167],
      specialty: "General, Emergency, Surgery",
      status: "active",
      capacity: 70,
    },
    {
      name: "Lucena United Doctors Hospital",
      position: [13.9417, 121.6167],
      specialty: "General, Multi-specialty",
      status: "active",
      capacity: 55,
    },
    {
      name: "Tayabas City Hospital",
      position: [14.0167, 121.5833],
      specialty: "General, Emergency",
      status: "active",
      capacity: 45,
    },
    {
      name: "Infanta Municipal Hospital",
      position: [14.75, 121.65],
      specialty: "General, Primary Care",
      status: "active",
      capacity: 40,
    },
  ],
};

// Status badge colors
const statusColors = {
  Ongoing: { bg: "#fef3c7", text: "#b45309", border: "#f59e0b" },
  Responded: { bg: "#dcfce7", text: "#15803d", border: "#22c55e" },
  Pending: { bg: "#dbeafe", text: "#1d4ed8", border: "#3b82f6" },
  Investigating: { bg: "#f3e8ff", text: "#7c3aed", border: "#8b5cf6" },
  Critical: { bg: "#fee2e2", text: "#b91c1c", border: "#dc2626" },
  Rescued: { bg: "#d1fae5", text: "#059669", border: "#10b981" },
};

// Generate random alerts based on hospitals
const generateAlerts = (province) => {
  const hospitals = hospitalsByProvince[province] || [];
  const alertTypes = [
    { type: "Medical Emergency", icon: "🏥", severity: "Critical" },
    { type: "Traffic Accident", icon: "🚗", severity: "Ongoing" },
    { type: "Fire Emergency", icon: "🔥", severity: "Ongoing" },
    { type: "Natural Disaster", icon: "🌊", severity: "Critical" },
    { type: "Missing Person", icon: "🔍", severity: "Investigating" },
    { type: "Cardiac Arrest", icon: "💓", severity: "Critical" },
    { type: "Building Collapse", icon: "🏚️", severity: "Ongoing" },
    { type: "Rescue Operation", icon: "🚁", severity: "Responded" },
  ];

  const sectors = ["A", "B", "C", "D"];
  const zones = ["Residential", "Commercial", "Industrial", "School", "Public"];

  return hospitals.slice(0, 4).map((hospital, i) => {
    const alertType = alertTypes[i % alertTypes.length];
    const hour = 8 + i * 2;
    const minute = Math.floor(Math.random() * 60);
    return {
      id: `ALERT-${String(i + 1).padStart(2, "0")}`,
      hospital: hospital.name,
      type: alertType.type,
      icon: alertType.icon,
      status: alertType.severity,
      time: `${hour}:${String(minute).padStart(2, "0")}`,
      location: `Sector ${sectors[i % 4]}${i + 1} - ${zones[i % 5]} Zone`,
      description: `${alertType.type} reported near ${
        hospital.name.split(" ")[0]
      }. Emergency response team dispatched.`,
      responders: Math.floor(Math.random() * 8) + 2,
    };
  });
};

const EmergencySOS = () => {
  const [selectedProvince, setSelectedProvince] = useState("Metro Manila");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showAlertDetails, setShowAlertDetails] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Get hospitals for selected province
  const hospitals = useMemo(() => {
    return hospitalsByProvince[selectedProvince] || [];
  }, [selectedProvince]);

  // Generate alerts for selected province
  const alerts = useMemo(() => {
    return generateAlerts(selectedProvince);
  }, [selectedProvince]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    if (filterStatus === "all") return alerts;
    return alerts.filter((a) => a.status === filterStatus);
  }, [alerts, filterStatus]);

  // Stats for current province
  const stats = useMemo(() => {
    return {
      totalHospitals: hospitals.length,
      activeAlerts: alerts.filter(
        (a) => a.status === "Critical" || a.status === "Ongoing"
      ).length,
      respondersDeployed: alerts.reduce((sum, a) => sum + a.responders, 0),
      avgCapacity: Math.round(
        hospitals.reduce((sum, h) => sum + h.capacity, 0) / hospitals.length
      ),
    };
  }, [hospitals, alerts]);

  // Detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation(provinceCenters[selectedProvince])
      );
    } else {
      setUserLocation(provinceCenters[selectedProvince]);
    }
  }, []);

  // Update map center when province changes
  const mapCenter =
    provinceCenters[selectedProvince] || provinceCenters["Metro Manila"];

  return (
    <Layout>
      <div className="emergency-sos-container">
        {/* === HEADER === */}
        <div className="sos-header">
          <div className="header-left">
            <h1>🚨 Live Emergency Feed</h1>
            <p className="subtitle">
              Real-time emergency monitoring for {selectedProvince}
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-value">{stats.totalHospitals}</span>
              <span className="stat-label">Hospitals</span>
            </div>
            <div className="stat-card alert">
              <span className="stat-value">{stats.activeAlerts}</span>
              <span className="stat-label">Active Alerts</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.respondersDeployed}</span>
              <span className="stat-label">Responders</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.avgCapacity}%</span>
              <span className="stat-label">Avg Capacity</span>
            </div>
          </div>
        </div>

        {/* === CONTROLS === */}
        <div className="sos-controls">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="province-select"
          >
            {Object.keys(hospitalsByProvince).map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="Critical">Critical</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Responded">Responded</option>
            <option value="Investigating">Investigating</option>
          </select>
        </div>

        {/* === MAIN CONTENT GRID === */}
        <div className="sos-grid">
          {/* MAP SECTION */}
          <div className="map-section glass-card">
            <h3>🗺️ Emergency Map</h3>
            <div className="map-wrapper">
              <MapContainer
                center={mapCenter}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* User Marker */}
                {userLocation && (
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup>📍 Your Location</Popup>
                  </Marker>
                )}

                {/* Hospital Markers */}
                {hospitals.map((h, i) => (
                  <Marker
                    key={i}
                    position={h.position}
                    icon={hospitalIcon}
                    eventHandlers={{
                      click: () => setSelectedHospital(h),
                    }}
                  >
                    <Popup>
                      <div className="hospital-popup">
                        <strong>{h.name}</strong>
                        <p>{h.specialty}</p>
                        <div
                          className={`capacity-badge ${
                            h.capacity > 85
                              ? "high"
                              : h.capacity > 70
                              ? "medium"
                              : "low"
                          }`}
                        >
                          Capacity: {h.capacity}%
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Alert Circle Markers */}
                {alerts.slice(0, 3).map((alert, i) => {
                  const hospital = hospitals.find(
                    (h) => h.name === alert.hospital
                  );
                  if (!hospital) return null;
                  return (
                    <CircleMarker
                      key={`alert-${i}`}
                      center={[
                        hospital.position[0] + 0.01,
                        hospital.position[1] + 0.01,
                      ]}
                      radius={15}
                      pathOptions={{
                        color: statusColors[alert.status]?.border || "#dc2626",
                        fillColor: statusColors[alert.status]?.bg || "#fee2e2",
                        fillOpacity: 0.7,
                      }}
                    >
                      <Popup>
                        {alert.type} - {alert.status}
                      </Popup>
                    </CircleMarker>
                  );
                })}

                <SetViewOnLocation coords={mapCenter} zoom={11} />
              </MapContainer>
            </div>
          </div>

          {/* ALERTS SECTION */}
          <div className="alerts-section glass-card">
            <h3>⚠️ Emergency Alerts ({filteredAlerts.length})</h3>
            <div className="alerts-list">
              {filteredAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  className={`alert-card ${alert.status.toLowerCase()}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setShowAlertDetails(alert)}
                >
                  <div className="alert-header">
                    <span className="alert-icon">{alert.icon}</span>
                    <div className="alert-info">
                      <span className="alert-id">{alert.id}</span>
                      <span className="alert-time">{alert.time}</span>
                    </div>
                    <span
                      className="status-badge"
                      style={{
                        background: statusColors[alert.status]?.bg,
                        color: statusColors[alert.status]?.text,
                        border: `1px solid ${
                          statusColors[alert.status]?.border
                        }`,
                      }}
                    >
                      {alert.status}
                    </span>
                  </div>
                  <div className="alert-body">
                    <p className="alert-type">{alert.type}</p>
                    <p className="alert-location">📍 {alert.location}</p>
                    <p className="alert-hospital">🏥 {alert.hospital}</p>
                  </div>
                  <div className="alert-footer">
                    <span className="responders-count">
                      👥 {alert.responders} Responders
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* HOSPITALS LIST */}
          <div className="hospitals-section glass-card">
            <h3>🏥 Nearby Hospitals ({hospitals.length})</h3>
            <div className="hospitals-list">
              {hospitals.map((hospital, i) => (
                <div
                  key={i}
                  className={`hospital-card ${
                    hospital.status === "alert" ? "alert" : ""
                  }`}
                  onClick={() => setSelectedHospital(hospital)}
                >
                  <div className="hospital-info">
                    <h4>{hospital.name}</h4>
                    <p className="specialty">{hospital.specialty}</p>
                  </div>
                  <div className="hospital-status">
                    <div
                      className={`capacity-bar ${
                        hospital.capacity > 85
                          ? "critical"
                          : hospital.capacity > 70
                          ? "warning"
                          : "normal"
                      }`}
                    >
                      <div
                        className="capacity-fill"
                        style={{ width: `${hospital.capacity}%` }}
                      ></div>
                    </div>
                    <span className="capacity-text">
                      {hospital.capacity}% Capacity
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === ALERT DETAIL MODAL === */}
        <AnimatePresence>
          {showAlertDetails && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAlertDetails(null)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setShowAlertDetails(null)}
                >
                  ✕
                </button>
                <div className="modal-header">
                  <span className="modal-icon">{showAlertDetails.icon}</span>
                  <div>
                    <h2>{showAlertDetails.type}</h2>
                    <p className="modal-id">
                      {showAlertDetails.id} | {showAlertDetails.time}
                    </p>
                  </div>
                  <span
                    className="status-badge large"
                    style={{
                      background: statusColors[showAlertDetails.status]?.bg,
                      color: statusColors[showAlertDetails.status]?.text,
                      border: `2px solid ${
                        statusColors[showAlertDetails.status]?.border
                      }`,
                    }}
                  >
                    {showAlertDetails.status}
                  </span>
                </div>
                <div className="modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">
                      {showAlertDetails.location}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Nearest Hospital</span>
                    <span className="detail-value">
                      {showAlertDetails.hospital}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Responders Deployed</span>
                    <span className="detail-value">
                      {showAlertDetails.responders} personnel
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">
                      {showAlertDetails.description}
                    </span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="action-btn primary">
                    Dispatch More Units
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={() => setShowAlertDetails(null)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === HOSPITAL DETAIL MODAL === */}
        <AnimatePresence>
          {selectedHospital && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHospital(null)}
            >
              <motion.div
                className="modal-content hospital-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setSelectedHospital(null)}
                >
                  ✕
                </button>
                <h2>🏥 {selectedHospital.name}</h2>
                <div className="modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Specialty</span>
                    <span className="detail-value">
                      {selectedHospital.specialty}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current Capacity</span>
                    <div className="capacity-visual">
                      <div
                        className={`capacity-bar large ${
                          selectedHospital.capacity > 85
                            ? "critical"
                            : selectedHospital.capacity > 70
                            ? "warning"
                            : "normal"
                        }`}
                      >
                        <div
                          className="capacity-fill"
                          style={{ width: `${selectedHospital.capacity}%` }}
                        ></div>
                      </div>
                      <span>{selectedHospital.capacity}%</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span
                      className={`status-indicator ${selectedHospital.status}`}
                    >
                      {selectedHospital.status === "active"
                        ? "🟢 Active"
                        : "🔴 Alert"}
                    </span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="action-btn primary">
                    Request Transfer
                  </button>
                  <button className="action-btn secondary">View Details</button>
                  <button
                    className="action-btn tertiary"
                    onClick={() => setSelectedHospital(null)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </Layout>
  );
};

export default EmergencySOS;
