import { useEffect, useMemo, useState, useCallback } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { KALINGA_CONFIG } from "@/constants/mapConfig";
import hospitalService from "@/services/hospitalService";

// Ensure default marker icons render correctly
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [
  KALINGA_CONFIG.DEFAULT_LOCATION.lat,
  KALINGA_CONFIG.DEFAULT_LOCATION.lng,
];

const haversineKm = (a, b) => {
  if (!a || !b) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const normalizeHospitals = (payload) => {
  const data = Array.isArray(payload?.data) ? payload.data : payload;
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      const lat = Number(item.latitude ?? item.lat ?? item.coords?.lat);
      const lng = Number(item.longitude ?? item.lng ?? item.coords?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: item.id ?? item.code ?? `${lat}_${lng}`,
        name: item.name ?? item.label ?? "Hospital",
        address: item.address ?? item.full_address ?? "",
        distance_km: item.distance_km,
        capability_score: item.capability_score,
        latitude: lat,
        longitude: lng,
        raw: item,
      };
    })
    .filter(Boolean);
};

const fallbackHospitals = [
  {
    id: "fallback_fatima",
    name: "Fatima University Medical Center",
    address: "Valenzuela City",
    latitude: 14.65891,
    longitude: 120.98032,
  },
  {
    id: "fallback_jnr",
    name: "Dr. Jose N. Rodriguez Memorial Hospital",
    address: "Caloocan City",
    latitude: 14.64234,
    longitude: 120.96789,
  },
  {
    id: "fallback_evrmc",
    name: "East Avenue Medical Center",
    address: "Quezon City",
    latitude: 14.6395,
    longitude: 121.0471,
  },
];

const Recenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const HospitalNavigatorMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState(fallbackHospitals);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState(null);

  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.id === selectedHospitalId) ?? null,
    [hospitals, selectedHospitalId]
  );

  const sortedHospitals = useMemo(() => {
    return hospitals
      .map((h) => {
        const distance = userLocation
          ? haversineKm(userLocation, { lat: h.latitude, lng: h.longitude })
          : h.distance_km ?? Infinity;
        return { ...h, distance_km: distance };
      })
      .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  }, [hospitals, userLocation]);

  const fetchHospitals = useCallback(async () => {
    try {
      const response = await hospitalService.getAll();
      const normalized = normalizeHospitals(response);
      if (normalized.length) {
        setHospitals(normalized);
        setSelectedHospitalId((prev) => prev ?? normalized[0].id);
        return;
      }
    } catch (err) {
      console.warn("Failed to load hospitals, using fallback", err);
    }
    setHospitals(fallbackHospitals);
    setSelectedHospitalId((prev) => prev ?? fallbackHospitals[0].id);
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!userLocation || !selectedHospital) return;
    setLoadingRoute(true);
    setError(null);
    const start = `${userLocation.lng},${userLocation.lat}`;
    const end = `${selectedHospital.longitude},${selectedHospital.latitude}`;
    const url = `${KALINGA_CONFIG.OSRM_URL || "https://router.project-osrm.org"}/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const coords = data?.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) ?? [];
      setRouteCoords(coords);
    } catch (err) {
      console.error("Failed to fetch route", err);
      setError("Unable to fetch driving route. Please try again.");
      setRouteCoords([]);
    } finally {
      setLoadingRoute(false);
    }
  }, [selectedHospital, userLocation]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    if (navigator?.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(next);
        },
        () => {
          setError((prev) => prev ?? "Location unavailable. Using default center.");
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
    setError((prev) => prev ?? "Geolocation not supported. Using default center.");
  }, []);

  useEffect(() => {
    if (selectedHospital && userLocation) {
      fetchRoute();
    }
  }, [selectedHospital, userLocation, fetchRoute]);

  const bestHospital = sortedHospitals[0] ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-600">Best option</p>
            <h2 className="text-xl font-semibold text-slate-900">
              {bestHospital?.name ?? "Hospitals near you"}
            </h2>
            <p className="text-sm text-slate-600">
              {bestHospital?.address ?? "Select a hospital to begin navigation"}
            </p>
            {bestHospital && (
              <p className="text-sm text-slate-500">
                {(bestHospital.distance_km ?? 0).toFixed(2)} km away
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              onClick={fetchHospitals}
            >
              Refresh hospitals
            </button>
            <button
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              onClick={() => bestHospital && setSelectedHospitalId(bestHospital.id)}
              disabled={!bestHospital}
            >
              Navigate to best
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-amber-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <p className="text-sm font-semibold text-slate-800">Hospitals nearby</p>
          <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
            {sortedHospitals.map((hospital) => (
              <button
                key={hospital.id}
                onClick={() => setSelectedHospitalId(hospital.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  hospital.id === selectedHospitalId
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{hospital.name}</span>
                  <span className="text-xs text-slate-500">
                    {(hospital.distance_km ?? 0).toFixed(2)} km
                  </span>
                </div>
                <p className="text-xs text-slate-500">{hospital.address || ""}</p>
              </button>
            ))}
            {!sortedHospitals.length && (
              <p className="text-xs text-slate-500">No hospitals available.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="h-[520px] w-full overflow-hidden rounded-2xl">
            <MapContainer
              center={userLocation ? [userLocation.lat, userLocation.lng] : DEFAULT_CENTER}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {hospitals.map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  eventHandlers={{ click: () => setSelectedHospitalId(hospital.id) }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">{hospital.name}</p>
                      {hospital.address && <p className="text-slate-600">{hospital.address}</p>}
                      <p className="text-xs text-slate-500">
                        {(hospital.distance_km ?? 0).toFixed(2)} km away
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} pathOptions={{ color: "#10b981", weight: 6, opacity: 0.8 }} />
              )}

              <Recenter
                center={
                  selectedHospital
                    ? [selectedHospital.latitude, selectedHospital.longitude]
                    : userLocation
                    ? [userLocation.lat, userLocation.lng]
                    : DEFAULT_CENTER
                }
                zoom={13}
              />
            </MapContainer>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
            <div className="space-x-2">
              <span className="font-semibold">Navigation</span>
              {selectedHospital ? (
                <span>
                  Routing to {selectedHospital.name}
                  {userLocation && selectedHospital
                    ? ` · ${(haversineKm(userLocation, {
                        lat: selectedHospital.latitude,
                        lng: selectedHospital.longitude,
                      }).toFixed(2))} km`
                    : ""}
                </span>
              ) : (
                <span>Select a hospital to navigate</span>
              )}
            </div>
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={fetchRoute}
              disabled={loadingRoute || !selectedHospital || !userLocation}
            >
              {loadingRoute ? "Calculating…" : "Recalculate route"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalNavigatorMap;
