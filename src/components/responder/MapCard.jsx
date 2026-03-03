import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SetViewOnLocation = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 13);
  }, [coords, map]);
  return null;
};

const MapCard = () => {
  const [userLocation, setUserLocation] = useState(null);

  // 🔹 Example hospital dataset (Metro Manila)
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

  // 🔹 Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation([14.5995, 120.9842]) // Default to Manila
      );
    } else {
      setUserLocation([14.5995, 120.9842]);
    }
  }, []);

  return (
    <div
      className="card reports-card"
      style={{
        paddingBottom: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3 className="card-title" style={{ marginBottom: "0.75rem" }}>
        Nearest Hospitals Around You
      </h3>

      <div
        style={{
          flexGrow: 1,
          width: "100%",
          height: "100%",
          minHeight: "380px",
          borderRadius: "10px",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {userLocation ? (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "10px",
            }}
            className="leaflet-map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* 📍 User location */}
            <Marker position={userLocation}>
              <Popup>You are here 📍</Popup>
            </Marker>

            {/* 🏥 Hospitals */}
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
          <p style={{ textAlign: "center", padding: "2rem" }}>Getting your location...</p>
        )}
      </div>
    </div>
  );
};

export default MapCard;
