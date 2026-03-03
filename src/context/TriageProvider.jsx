// src/context/TriageProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generatePatientTriage } from "../lib/triageUtils";

const TriageContext = createContext(null);

export const useTriage = () => {
  const ctx = useContext(TriageContext);
  if (!ctx) throw new Error("useTriage must be used inside TriageProvider");
  return ctx;
};

export const TriageProvider = ({ children, refreshInterval = 30000 }) => {
  const [triageData, setTriageData] = useState(() =>
    enrichData(generatePatientTriage())
  );
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setTriageData(enrichData(generatePatientTriage()));
      setLastUpdated(Date.now());
    }, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval]);

  /** 🧠 Convert raw triage data → adds:
   *  - counts: { low, medium, high, very-high, critical }
   *  - topDoctor: most requested specialist
   */
  function enrichData(data) {
    return data.map((hospitalRow) => {
      const counts = {
        low: 0,
        medium: 0,
        high: 0,
        "very-high": 0,
        critical: 0,
      };

      const doctorCount = {};

      hospitalRow.patients.forEach((p) => {
        counts[p.level] = (counts[p.level] || 0) + 1;

        doctorCount[p.recommendedDoctor] =
          (doctorCount[p.recommendedDoctor] || 0) + 1;
      });

      const topDoctor =
        Object.entries(doctorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "General Practitioner";

      return {
        ...hospitalRow,
        counts,
        topDoctor,
      };
    });
  }

  /** 🏥 Fast lookup table */
  const hospitalMap = useMemo(() => {
    const map = {};
    triageData.forEach((h) => (map[h.hospital] = h));
    return map;
  }, [triageData]);

  const value = {
    triageData,
    hospitalMap,
    lastUpdated,
    refresh: () => {
      setTriageData(enrichData(generatePatientTriage()));
      setLastUpdated(Date.now());
    },
  };

  return (
    <TriageContext.Provider value={value}>{children}</TriageContext.Provider>
  );
};
