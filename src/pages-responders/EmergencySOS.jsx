// src/pages/EmergencySOS.jsx
import React, { useState, useEffect } from "react";
import Layout from "../layouts/Layout";
import Footer from "../components/responder/Footer";
import "../styles/personnel-style.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🔹 Helper component to move map to user's location
const SetViewOnLocation = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 13);
  }, [coords, map]);
  return null;
};

const EmergencySOS = () => {
  const [selectedArea, setSelectedArea] = useState("Metro Manila");
  const [selectedRegion, setSelectedRegion] = useState("Luzon");
  const [userLocation, setUserLocation] = useState(null);

  // 🔹 Major Hospitals in Metro Manila
  const hospitals = [
    {
      name: "Philippine General Hospital (PGH)",
      position: [14.5737, 120.9831],
      specialty: "General, Emergency, Pediatrics, Surgery",
    },
    {
      name: "St. Luke’s Medical Center (Quezon City)",
      position: [14.6425, 121.045],
      specialty: "Cardiology, Neurology, Orthopedics",
    },
    {
      name: "Makati Medical Center",
      position: [14.5547, 121.0151],
      specialty: "Internal Medicine, Emergency, OB-Gyne",
    },
    {
      name: "East Avenue Medical Center",
      position: [14.641, 121.048],
      specialty: "Emergency, Trauma, Surgery",
    },
    {
      name: "Manila Doctors Hospital",
      position: [14.5824, 120.9808],
      specialty: "Cardiology, Oncology, Internal Medicine",
    },
    {
      name: "Jose R. Reyes Memorial Medical Center",
      position: [14.6077, 120.9812],
      specialty: "Neurology, Pediatrics, Surgery",
    },
  ];

  // 🔹 Detect user location (with Manila fallback)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          console.warn("Location access denied — using Manila as default.");
          setUserLocation([14.5995, 120.9842]); // 📍 Manila
        }
      );
    } else {
      setUserLocation([14.5995, 120.9842]);
    }
  }, []);

  return (
    <Layout>
      <div className="dashboard-content">
        {/* Page Title */}
        <h2 className="page-title">LIVE EMERGENCY FEED</h2>

        {/* Controls */}
        <div className="controls">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="dropdown"
          >
            <option value="Metro Manila">Metro Manila</option>
            <option value="Laguna">Laguna</option>
            <option value="Cavite">Cavite</option>
            <option value="Baguio">Baguio</option>
            <option value="Pampanga">Pampanga</option>
            <option value="Bulacan">Bulacan</option>
            <option value="Nueva Ecija">Nueva Ecija</option>
            <option value="Batangas">Batangas</option>
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="dropdown"
          >
            <option value="Luzon">Luzon</option>
            <option value="Visayas">Visayas</option>
            <option value="Mindanao">Mindanao</option>
          </select>
        </div>

        {/* 🌍 Interactive Map Section */}
        <div
          className="map-section"
          style={{
            height: "400px",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {userLocation ? (
            <MapContainer
              center={userLocation}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* User Marker */}
              <Marker position={userLocation}>
                <Popup>You are here 📍</Popup>
              </Marker>

              {/* Hospital Markers */}
              {hospitals.map((h, i) => (
                <Marker key={i} position={h.position}>
                  <Popup>
                    <strong>{h.name}</strong>
                    <br />
                    {h.specialty}
                  </Popup>
                </Marker>
              ))}

              <SetViewOnLocation coords={userLocation} />
            </MapContainer>
          ) : (
            <p style={{ textAlign: "center", padding: "2rem" }}>
              Getting your location...
            </p>
          )}
        </div>

        {/* Alerts Section */}
        <div className="alerts-section">
          <h3 className="section-title">Emergency Alerts</h3>

          <div className="alert-card rescued">
            <p className="alert-id">
              <strong>[RESCUE-12]</strong> | 14:22
            </p>
            <p>All civilians accounted for. Evacuation successful.</p>
            <p className="alert-location">
              <em>Sector 2A - Residential Zone</em>
            </p>
            <p className="alert-status">Status: Rescued</p>
          </div>

          <div className="alert-card rescued">
            <p className="alert-id">
              <strong>[SCOUT-09]</strong> | 15:45
            </p>
            <p>Search completed. Everyone rescued, no injuries.</p>
            <p className="alert-location">
              <em>Sector 3B - School Grounds</em>
            </p>
            <p className="alert-status">Status: Rescued</p>
          </div>
        </div>
      </div>

      <Footer />
    </Layout>
  );
};

export default EmergencySOS;
