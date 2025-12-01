// src/pages-responders/TriageSystem.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Layout from "../layouts/Layout";
import "../styles/triage-system.css";
import Footer from "../components/responder/Footer";

// Severity color map
const SEVERITY_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  veryHigh: "#dc2626",
  critical: "#7f1d1d",
};

// Personnel calculation based on severity
const calculatePersonnelNeeds = (hospitalData) => {
  const totalLow = hospitalData.reduce((sum, h) => sum + h.values[0], 0);
  const totalMedium = hospitalData.reduce((sum, h) => sum + h.values[1], 0);
  const totalHigh = hospitalData.reduce((sum, h) => sum + h.values[2], 0);
  const totalVeryHigh = hospitalData.reduce((sum, h) => sum + h.values[3], 0);
  const totalCritical = hospitalData.reduce((sum, h) => sum + h.values[4], 0);

  return {
    nurses: Math.ceil(
      totalLow * 0.5 +
        totalMedium * 1 +
        totalHigh * 1.5 +
        totalVeryHigh * 2 +
        totalCritical * 3
    ),
    doctors: Math.ceil(
      totalMedium * 0.3 +
        totalHigh * 0.5 +
        totalVeryHigh * 1 +
        totalCritical * 2
    ),
    specialists: Math.ceil(
      totalHigh * 0.2 + totalVeryHigh * 0.5 + totalCritical * 1
    ),
    icu: Math.ceil(totalVeryHigh * 0.3 + totalCritical * 0.8),
  };
};

const TriageSystem = () => {
  const [selectedArea, setSelectedArea] = useState("Metro Manila");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("hospital");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareHospitals, setCompareHospitals] = useState([]);

  const areas = [
    "Metro Manila",
    "North Luzon",
    "South Luzon",
    "Visayas",
    "Mindanao",
  ];

  // Extended hospital data with more details
  const data = {
    "Metro Manila": [
      {
        hospital: "Philippine Heart Center",
        specialty: "Cardiology",
        topDoctor: "Dr. Santos",
        values: [25, 12, 4, 3, 1],
        trend: [20, 22, 25, 28, 25],
      },
      {
        hospital: "East Avenue Medical Center",
        specialty: "General",
        topDoctor: "Dr. Cruz",
        values: [40, 18, 10, 5, 2],
        trend: [35, 38, 42, 40, 40],
      },
      {
        hospital: "Jose Reyes Memorial Medical Center",
        specialty: "Neurology",
        topDoctor: "Dr. Reyes",
        values: [32, 14, 6, 4, 1],
        trend: [28, 30, 32, 34, 32],
      },
      {
        hospital: "San Lazaro Hospital",
        specialty: "Infectious Disease",
        topDoctor: "Dr. Garcia",
        values: [28, 20, 9, 2, 0],
        trend: [22, 25, 28, 30, 28],
      },
      {
        hospital: "National Children's Hospital",
        specialty: "Pediatrics",
        topDoctor: "Dr. Luna",
        values: [35, 15, 7, 3, 1],
        trend: [30, 32, 35, 38, 35],
      },
      {
        hospital: "Lung Center of the Philippines",
        specialty: "Pulmonology",
        topDoctor: "Dr. Bautista",
        values: [22, 10, 5, 2, 1],
        trend: [18, 20, 22, 24, 22],
      },
    ],
    "North Luzon": [
      {
        hospital: "Baguio General Hospital",
        specialty: "General",
        topDoctor: "Dr. Abad",
        values: [38, 10, 5, 2, 1],
        trend: [32, 35, 38, 40, 38],
      },
      {
        hospital: "Ilocos Training & Regional Medical Center",
        specialty: "Trauma",
        topDoctor: "Dr. Valdez",
        values: [25, 12, 6, 2, 1],
        trend: [20, 22, 25, 28, 25],
      },
      {
        hospital: "Region 1 Medical Center",
        specialty: "Orthopedics",
        topDoctor: "Dr. Ramos",
        values: [30, 14, 8, 4, 2],
        trend: [26, 28, 30, 32, 30],
      },
    ],
    "South Luzon": [
      {
        hospital: "Batangas Medical Center",
        specialty: "General",
        topDoctor: "Dr. Hernandez",
        values: [45, 22, 10, 6, 2],
        trend: [40, 42, 45, 48, 45],
      },
      {
        hospital: "Bicol Regional Hospital",
        specialty: "General",
        topDoctor: "Dr. Ocampo",
        values: [30, 15, 8, 5, 2],
        trend: [26, 28, 30, 32, 30],
      },
      {
        hospital: "CALABARZON Regional Hospital",
        specialty: "Trauma",
        topDoctor: "Dr. Torres",
        values: [42, 20, 9, 4, 1],
        trend: [38, 40, 42, 44, 42],
      },
    ],
    Visayas: [
      {
        hospital: "Vicente Sotto Memorial Medical Center",
        specialty: "Cardiology",
        topDoctor: "Dr. Villanueva",
        values: [40, 18, 9, 4, 1],
        trend: [35, 37, 40, 42, 40],
      },
      {
        hospital: "Western Visayas Medical Center",
        specialty: "General",
        topDoctor: "Dr. Aquino",
        values: [32, 14, 6, 3, 0],
        trend: [28, 30, 32, 34, 32],
      },
      {
        hospital: "Eastern Visayas Regional Medical Center",
        specialty: "Orthopedics",
        topDoctor: "Dr. Mendoza",
        values: [28, 12, 5, 2, 1],
        trend: [24, 26, 28, 30, 28],
      },
    ],
    Mindanao: [
      {
        hospital: "Southern Philippines Medical Center",
        specialty: "General",
        topDoctor: "Dr. Fernandez",
        values: [60, 20, 15, 6, 3],
        trend: [52, 55, 60, 62, 60],
      },
      {
        hospital: "Northern Mindanao Medical Center",
        specialty: "Trauma",
        topDoctor: "Dr. Castro",
        values: [35, 18, 9, 5, 2],
        trend: [30, 32, 35, 38, 35],
      },
      {
        hospital: "Davao Regional Medical Center",
        specialty: "Cardiology",
        topDoctor: "Dr. Diaz",
        values: [48, 22, 12, 5, 2],
        trend: [42, 45, 48, 50, 48],
      },
    ],
  };

  const alerts = [
    {
      text: "Philippine Heart Center currently lacks <b>cardiologists</b> for new critical cases.",
      level: "critical",
      hospital: "Philippine Heart Center",
    },
    {
      text: "Jose Reyes Memorial reports a <b>surge in neurology cases</b>.",
      level: "veryHigh",
      hospital: "Jose Reyes Memorial Medical Center",
    },
    {
      text: "San Lazaro Hospital at <b>85% capacity</b> for infectious disease ward.",
      level: "high",
      hospital: "San Lazaro Hospital",
    },
  ];

  // Calculate totals for current area
  const areaTotals = useMemo(() => {
    const hospitals = data[selectedArea];
    return {
      low: hospitals.reduce((sum, h) => sum + h.values[0], 0),
      medium: hospitals.reduce((sum, h) => sum + h.values[1], 0),
      high: hospitals.reduce((sum, h) => sum + h.values[2], 0),
      veryHigh: hospitals.reduce((sum, h) => sum + h.values[3], 0),
      critical: hospitals.reduce((sum, h) => sum + h.values[4], 0),
    };
  }, [selectedArea]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = [...data[selectedArea]];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (h) =>
          h.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      const severityIndex = {
        low: 0,
        medium: 1,
        high: 2,
        veryHigh: 3,
        critical: 4,
      };
      result = result.filter(
        (h) => h.values[severityIndex[severityFilter]] > 0
      );
    }

    // Sorting
    if (sortBy === "hospital") {
      result.sort((a, b) => a.hospital.localeCompare(b.hospital));
    } else if (sortBy === "total") {
      result.sort(
        (a, b) =>
          b.values.reduce((s, v) => s + v, 0) -
          a.values.reduce((s, v) => s + v, 0)
      );
    } else if (sortBy === "critical") {
      result.sort((a, b) => b.values[4] - a.values[4]);
    }

    return result;
  }, [selectedArea, searchTerm, sortBy, severityFilter]);

  // Pie chart data for personnel needs
  const personnelData = useMemo(() => {
    const needs = calculatePersonnelNeeds(data[selectedArea]);
    return [
      { name: "Nurses", value: needs.nurses, fill: "#3b82f6" },
      { name: "Doctors", value: needs.doctors, fill: "#22c55e" },
      { name: "Specialists", value: needs.specialists, fill: "#f59e0b" },
      { name: "ICU Staff", value: needs.icu, fill: "#dc2626" },
    ];
  }, [selectedArea]);

  // Bar chart data for severity overview
  const severityChartData = useMemo(() => {
    return data[selectedArea].map((h) => ({
      name: h.hospital.split(" ").slice(0, 2).join(" "),
      Low: h.values[0],
      Medium: h.values[1],
      High: h.values[2],
      "Very High": h.values[3],
      Critical: h.values[4],
    }));
  }, [selectedArea]);

  // Trend data for line chart
  const trendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return days.map((day, i) => {
      const dayData = { name: day };
      data[selectedArea].forEach((h) => {
        dayData[h.hospital.split(" ")[0]] = h.trend[i];
      });
      return dayData;
    });
  }, [selectedArea]);

  // Handle hospital comparison
  const toggleCompare = (hospital) => {
    if (compareHospitals.includes(hospital.hospital)) {
      setCompareHospitals(
        compareHospitals.filter((h) => h !== hospital.hospital)
      );
    } else if (compareHospitals.length < 3) {
      setCompareHospitals([...compareHospitals, hospital.hospital]);
    }
  };

  // Get compare data
  const compareData = useMemo(() => {
    return data[selectedArea].filter((h) =>
      compareHospitals.includes(h.hospital)
    );
  }, [selectedArea, compareHospitals]);

  const badge = {
    low: "Low",
    medium: "Medium",
    high: "High",
    veryHigh: "Very High",
    critical: "Critical",
  };

  return (
    <Layout>
      <div className="triage-fullpage">
        {/* === TOP CONTROLS === */}
        <div className="top-controls">
          <div>
            <h1>DOH Hospital Triage & Specialist Tracking</h1>
            <p className="subtitle">
              Real-time patient severity monitoring across {selectedArea}
            </p>
          </div>
          <div className="header-widgets">
            <div className="status-widget">
              <div className="status-item">
                <span className="label">Total Patients</span>
                <span className="value">
                  {Object.values(areaTotals).reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Critical</span>
                <span className="value alert active">
                  {areaTotals.critical}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Hospitals</span>
                <span className="value">{data[selectedArea].length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* === FILTERS ROW === */}
        <div className="filters-row">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            {areas.map((area, i) => (
              <option key={i} value={area}>
                {area}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="veryHigh">Very High</option>
            <option value="critical">Critical</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="hospital">Sort by Name</option>
            <option value="total">Sort by Total</option>
            <option value="critical">Sort by Critical</option>
          </select>
          <button
            className={`compare-toggle ${compareMode ? "active" : ""}`}
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setCompareHospitals([]);
            }}
          >
            {compareMode ? "Exit Compare" : "Compare Hospitals"}
          </button>
        </div>

        {/* === GRID LAYOUT === */}
        <div className="grid-cards">
          {/* Severity Overview Card */}
          <div className="card summary">
            <h3 className="card-title">Severity Overview</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={severityChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Low" stackId="a" fill={SEVERITY_COLORS.low} />
                  <Bar
                    dataKey="Medium"
                    stackId="a"
                    fill={SEVERITY_COLORS.medium}
                  />
                  <Bar dataKey="High" stackId="a" fill={SEVERITY_COLORS.high} />
                  <Bar
                    dataKey="Very High"
                    stackId="a"
                    fill={SEVERITY_COLORS.veryHigh}
                  />
                  <Bar
                    dataKey="Critical"
                    stackId="a"
                    fill={SEVERITY_COLORS.critical}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hospital Table Card */}
          <div className="card table-card">
            <div className="table-header">
              <h3>Hospital Patient Distribution</h3>
              {compareMode && (
                <span className="compare-hint">
                  Select up to 3 hospitals to compare
                </span>
              )}
            </div>
            <div className="table-scroll">
              <table className="triage-table">
                <thead>
                  <tr>
                    {compareMode && <th></th>}
                    <th>Hospital</th>
                    <th>Low</th>
                    <th>Medium</th>
                    <th>High</th>
                    <th>Very High</th>
                    <th>Critical</th>
                    <th>Top Doctor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`clickable-row ${
                        compareHospitals.includes(row.hospital)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        compareMode
                          ? toggleCompare(row)
                          : setSelectedHospital(row)
                      }
                    >
                      {compareMode && (
                        <td>
                          <input
                            type="checkbox"
                            checked={compareHospitals.includes(row.hospital)}
                            onChange={() => toggleCompare(row)}
                          />
                        </td>
                      )}
                      <td>
                        {row.hospital}
                        <div className="subtext">{row.specialty}</div>
                      </td>
                      <td className="low">{row.values[0]}</td>
                      <td className="medium">{row.values[1]}</td>
                      <td className="high">{row.values[2]}</td>
                      <td className="very-high">{row.values[3]}</td>
                      <td className="critical">{row.values[4]}</td>
                      <td>
                        <span className="doctor-badge">{row.topDoctor}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Trends Card */}
          <div className="card trends">
            <h3 className="card-title">Weekly Patient Trends</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  {data[selectedArea].slice(0, 3).map((h, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={h.hospital.split(" ")[0]}
                      stroke={["#3b82f6", "#22c55e", "#f59e0b"][i]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Personnel Needs Card */}
          <div className="card personnel">
            <h3 className="card-title">Personnel Requirements</h3>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={personnelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {personnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts Card */}
          <div className="card alerts">
            <h3 className="card-title">Active Alerts</h3>
            {alerts.map((a, i) => (
              <div key={i} className={`alert-card severity-${a.level}`}>
                <span className={`severity-badge ${a.level}`}>
                  {badge[a.level]}
                </span>
                <span dangerouslySetInnerHTML={{ __html: a.text }} />
              </div>
            ))}
          </div>

          {/* Compare Card (shown when hospitals selected) */}
          {compareHospitals.length > 0 && (
            <div className="card compare">
              <h3 className="card-title">Hospital Comparison</h3>
              <div className="compare-bars">
                {compareData.map((h, i) => {
                  const total = h.values.reduce((a, b) => a + b, 0);
                  return (
                    <div key={i} className="compare-item">
                      <div className="compare-label">{h.hospital}</div>
                      <div className="bar-row">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(h.values[0] / total) * 100}%`,
                            background: SEVERITY_COLORS.low,
                          }}
                        ></div>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(h.values[1] / total) * 100}%`,
                            background: SEVERITY_COLORS.medium,
                          }}
                        ></div>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(h.values[2] / total) * 100}%`,
                            background: SEVERITY_COLORS.high,
                          }}
                        ></div>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(h.values[3] / total) * 100}%`,
                            background: SEVERITY_COLORS.veryHigh,
                          }}
                        ></div>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(h.values[4] / total) * 100}%`,
                            background: SEVERITY_COLORS.critical,
                          }}
                        ></div>
                      </div>
                      <div className="compare-stats">
                        Total: {total} | Critical: {h.values[4]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
                className="modal-content"
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
                <h2>{selectedHospital.hospital}</h2>
                <p className="modal-specialty">
                  Specialty: {selectedHospital.specialty} | Lead:{" "}
                  {selectedHospital.topDoctor}
                </p>

                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Low", "Medium", "High", "Very High", "Critical"].map(
                      (sev, i) => {
                        const total = selectedHospital.values.reduce(
                          (a, b) => a + b,
                          0
                        );
                        const percent = (
                          (selectedHospital.values[i] / total) *
                          100
                        ).toFixed(1);
                        const actions = [
                          "Routine monitoring",
                          "Scheduled assessment",
                          "Priority attention required",
                          "Immediate specialist consultation",
                          "Emergency intervention",
                        ];
                        return (
                          <tr key={i}>
                            <td className={sev.toLowerCase().replace(" ", "-")}>
                              {sev}
                            </td>
                            <td>{selectedHospital.values[i]}</td>
                            <td>{percent}%</td>
                            <td>{actions[i]}</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>

                <div className="modal-chart">
                  <h4>5-Day Patient Trend</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart
                      data={["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => ({
                        day: d,
                        patients: selectedHospital.trend[i],
                      }))}
                    >
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="patients"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <button
                  className="close-btn"
                  onClick={() => setSelectedHospital(null)}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </Layout>
  );
};

export default TriageSystem;
