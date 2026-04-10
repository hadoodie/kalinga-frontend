// src/context/TriageProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import nodeApi from "../services/nodeApi";

const TriageContext = createContext(null);

export const useTriage = () => {
  const ctx = useContext(TriageContext);
  if (!ctx) throw new Error("useTriage must be used inside TriageProvider");
  return ctx;
};

export const TriageProvider = ({ children, refreshInterval = 30000 }) => {
  const [triageData, setTriageData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const fetchTriage = useCallback(async () => {
    try {
      const [hospRes, triageRes] = await Promise.all([
        nodeApi.get("/hospitals", { params: { limit: 50 } }),
        nodeApi.get("/triage/patients", { params: { limit: 500 } }),
      ]);
      const hospitals = hospRes.data?.data || [];
      const patients = triageRes.data?.data || [];

      // Group patients by hospital_id
      const byHospital = {};
      patients.forEach((p) => {
        const hid = p.hospital_id;
        if (!byHospital[hid]) byHospital[hid] = [];
        byHospital[hid].push(p);
      });

      const enriched = hospitals.map((h) => {
        const hPatients = byHospital[h.id] || [];
        const counts = { low: 0, medium: 0, high: 0, "very-high": 0, critical: 0 };
        const doctorCount = {};

        hPatients.forEach((p) => {
          const lvl = p.triage_level?.toLowerCase().replace("_", "-") || "low";
          counts[lvl] = (counts[lvl] || 0) + 1;
          const doc = p.recommended_doctor || "General Practitioner";
          doctorCount[doc] = (doctorCount[doc] || 0) + 1;
        });

        const topDoctor =
          Object.entries(doctorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
          "General Practitioner";

        return {
          hospital: h.name,
          specialty: h.level || "General",
          patients: hPatients,
          counts,
          topDoctor,
        };
      });

      setTriageData(enriched);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error("TriageProvider: failed to fetch triage data", err);
    }
  }, []);

  useEffect(() => {
    fetchTriage();
    const id = setInterval(fetchTriage, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, fetchTriage]);

  /** Fast lookup table */
  const hospitalMap = useMemo(() => {
    const map = {};
    triageData.forEach((h) => (map[h.hospital] = h));
    return map;
  }, [triageData]);

  const value = {
    triageData,
    hospitalMap,
    lastUpdated,
    refresh: fetchTriage,
  };

  return (
    <TriageContext.Provider value={value}>{children}</TriageContext.Provider>
  );
};
