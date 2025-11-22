import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  MapPinned,
  Navigation2,
  Route,
  Stethoscope,
} from "lucide-react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_POSITION = [14.5995, 120.9842];

const STATUS_MODES = {
  route: ["reported", "acknowledged", "en_route", "needs_support"],
  hospital: ["on_scene", "transporting", "hospital_transfer", "resolved"],
};

const iconFactory = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

const responderIcon = iconFactory("blue");
const incidentIcon = iconFactory("red");
const hospitalIcon = iconFactory("green");

const normalizeCoordinate = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getIncidentPosition = (incident) => {
  if (!incident) return null;
  const lat =
    normalizeCoordinate(incident.latitude) ||
    normalizeCoordinate(incident.location_lat);
  const lng =
    normalizeCoordinate(incident.longitude) ||
    normalizeCoordinate(incident.location_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }
  return null;
};

const getHospitalPosition = (hospital) => {
  if (!hospital) return null;
  const lat = normalizeCoordinate(hospital.latitude);
  const lng = normalizeCoordinate(hospital.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }
  return null;
};

const determineMode = (status) => {
  if (!status) return "route";
  if (STATUS_MODES.hospital.includes(status)) {
    return "hospital";
  }
  return "route";
};

export default function NavigationPanel({
  incident,
  hospitals,
}) {
  const [responderPosition, setResponderPosition] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!navigator.geolocation) {
      setResponderPosition(DEFAULT_POSITION);
      return () => {
        mounted = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mounted) {
          setResponderPosition([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      () => {
        if (mounted) {
          setResponderPosition(DEFAULT_POSITION);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);

  const incidentPosition = useMemo(
    () => getIncidentPosition(incident) || DEFAULT_POSITION,
    [incident]
  );

  const selectedHospital = hospitals?.[0] ?? null;
  const hospitalPosition = useMemo(
    () => getHospitalPosition(selectedHospital),
    [selectedHospital]
  );

  const mode = determineMode(incident?.status);
  const showHospitalMode = mode === "hospital" && hospitalPosition;
  const polylinePoints = useMemo(() => {
    if (showHospitalMode && hospitalPosition) {
      return [incidentPosition, hospitalPosition];
    }
    if (responderPosition) {
      return [responderPosition, incidentPosition];
    }
    return null;
  }, [responderPosition, incidentPosition, hospitalPosition, showHospitalMode]);

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-[600px] flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${showHospitalMode ? 'bg-emerald-50' : 'bg-blue-50'}`}>
            {showHospitalMode ? (
              <Stethoscope className={`h-6 w-6 ${showHospitalMode ? 'text-emerald-600' : 'text-blue-600'}`} />
            ) : (
              <Navigation2 className={`h-6 w-6 ${showHospitalMode ? 'text-emerald-600' : 'text-blue-600'}`} />
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide font-bold text-gray-500">
              {showHospitalMode ? "Hospital Handoff" : "Route Guidance"}
            </p>
            <h3 className="text-lg font-black text-gray-900">
              {showHospitalMode ? "Nearest capable hospital" : "Fastest route"}
            </h3>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
          showHospitalMode ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {incident?.status ? incident.status.replace(/_/g, " ") : "unknown"}
        </span>
      </header>

      <div className="flex-1 rounded-xl overflow-hidden border border-gray-100">
        <MapContainer
          center={incidentPosition}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {responderPosition ? (
            <Marker position={responderPosition} icon={responderIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                Responder location
              </Tooltip>
            </Marker>
          ) : null}
          {incidentPosition ? (
            <Marker position={incidentPosition} icon={incidentIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                Incident site
              </Tooltip>
            </Marker>
          ) : null}
          {showHospitalMode && hospitalPosition ? (
            <Marker position={hospitalPosition} icon={hospitalIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {selectedHospital?.name || "Hospital"}
              </Tooltip>
            </Marker>
          ) : null}
          {polylinePoints ? (
            <Polyline positions={polylinePoints} color={showHospitalMode ? "green" : "#2563eb"} />
          ) : null}
        </MapContainer>
      </div>

      {showHospitalMode && selectedHospital ? (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex items-start gap-3">
          <Route className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-semibold">{selectedHospital.name}</p>
            <p className="text-xs text-emerald-700">
              {selectedHospital.capabilities?.join(", ") || "Awaiting resource match"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 flex items-start gap-3">
          <MapPinned className="h-4 w-4 mt-0.5" />
          <p>
            {responderPosition
              ? "Live navigation synced with your position."
              : "Enable location services for turn-by-turn updates."}
          </p>
        </div>
      )}

      {incident?.blockades?.length ? (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <p>
            Blockades reported nearby: {incident.blockades.map((b) => b.title || b.road_name).join(", ")}.
          </p>
        </div>
      ) : null}
    </section>
  );
}
