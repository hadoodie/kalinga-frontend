import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import nodeApi from "../../services/nodeApi";

// ✅ Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    nodeApi
      .get("/hospitals", { params: { limit: 20 } })
      .then(({ data }) => {
        const list = (data?.data || []).filter(
          (h) => h.latitude && h.longitude,
        );
        setHospitals(list);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation([14.5995, 120.9842]),
      );
    } else {
      setUserLocation([14.5995, 120.9842]);
    }
  }, []);

  return (
    <div
      className="card responder-widget map-widget-card"
      style={{
        paddingBottom: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3
        className="card-title"
        style={{ marginBottom: "0.75rem", textAlign: "center" }}
      >
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

            {/* 🏥 Hospitals from DB */}
            {hospitals.map((h) => (
              <Marker
                key={h.id}
                position={[parseFloat(h.latitude), parseFloat(h.longitude)]}
              >
                <Popup>
                  <strong>{h.name}</strong>
                  <br />
                  {h.level || h.code}
                  {h.bed_capacity && (
                    <>
                      <br />
                      Beds: {h.current_occupancy}/{h.bed_capacity}
                    </>
                  )}
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
    </div>
  );
};

export default MapCard;
