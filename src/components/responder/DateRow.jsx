import React, { useEffect, useState } from "react";
import nodeApi from "../../services/nodeApi";
import "../../styles/daterow.css";

const DateRow = () => {
  const today = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = today.toLocaleDateString("en-US", options).toUpperCase();
  const weekday = today.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  const [regions, setRegions] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedHospital, setSelectedHospital] = useState("All");

  useEffect(() => {
    nodeApi
      .get("/location/areas")
      .then(({ data }) => setRegions(data?.data || []))
      .catch(console.error);

    nodeApi
      .get("/hospitals", { params: { limit: 50 } })
      .then(({ data }) => setHospitals(data?.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="date-row">
      <span className="date-text">
        <strong>{formattedDate}</strong> <span className="weekday">{weekday}</span>
      </span>
      <div className="dropdowns">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="All">All Areas</option>
          {regions.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
        >
          <option value="All">All Centers</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.name}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DateRow;
