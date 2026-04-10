// src/pages-responders/TriageSystem.jsx
import React, { useState, useMemo, useEffect } from "react";
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
import nodeApi from "../services/nodeApi";

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

  const [areas, setAreas] = useState(["Metro Manila"]);
  const [data, setData] = useState({ "Metro Manila": [] });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      nodeApi.get("/hospitals", { params: { limit: 50 } }),
      nodeApi.get("/triage/patients", { params: { limit: 500 } }),
      nodeApi.get("/reports", { params: { limit: 10, severity: "critical" } }),
    ])
      .then(([hospRes, triageRes, reportsRes]) => {
        const hospitals = hospRes.data?.data || [];
        const patients = triageRes.data?.data || [];
        const reports = reportsRes.data?.data || [];

        // Group triage patients by hospital_id
        const triageByHospital = {};
        patients.forEach((p) => {
          const hid = p.hospital_id;
          if (!triageByHospital[hid]) {
            triageByHospital[hid] = { low: 0, medium: 0, high: 0, very_high: 0, critical: 0 };
          }
          const lvl = p.triage_level?.toLowerCase();
          if (lvl === "low") triageByHospital[hid].low++;
          else if (lvl === "medium") triageByHospital[hid].medium++;
          else if (lvl === "high") triageByHospital[hid].high++;
          else if (lvl === "very_high") triageByHospital[hid].very_high++;
          else if (lvl === "critical") triageByHospital[hid].critical++;
        });

        // Build hospital entries
        const hospitalEntries = hospitals.map((h) => {
          const triage = triageByHospital[h.id] || {
            low: 0, medium: 0, high: 0, very_high: 0, critical: 0,
          };
          const total =
            triage.low + triage.medium + triage.high + triage.very_high + triage.critical;
          return {
            id: h.id,
            hospital: h.name,
            specialty: h.level || "General",
            topDoctor: "—",
            values: [triage.low, triage.medium, triage.high, triage.very_high, triage.critical],
            // flat trend using total (no time-series in DB)
            trend: Array(5).fill(total),
          };
        });

        // Build areas from distinct city/level groupings
        // Since all seeded hospitals are Metro Manila, group as single area
        const areaMap = { "Metro Manila": hospitalEntries };
        const areaList = Object.keys(areaMap);

        setAreas(areaList);
        setData(areaMap);
        setSelectedArea(areaList[0] || "Metro Manila");

        // Transform reports to alerts format
        const alertList = reports.slice(0, 5).map((r) => ({
          text: `<b>${r.hospital_name}</b>: ${r.message || r.title}`,
          level: r.severity === "critical"
            ? "critical"
            : r.severity === "high"
            ? "high"
            : "medium",
          hospital: r.hospital_name,
        }));
        setAlerts(alertList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Calculate totals for current area
  const areaTotals = useMemo(() => {
    const hospitals = data[selectedArea] || [];
    return {
      low: hospitals.reduce((sum, h) => sum + h.values[0], 0),
      medium: hospitals.reduce((sum, h) => sum + h.values[1], 0),
      high: hospitals.reduce((sum, h) => sum + h.values[2], 0),
      veryHigh: hospitals.reduce((sum, h) => sum + h.values[3], 0),
      critical: hospitals.reduce((sum, h) => sum + h.values[4], 0),
    };
  }, [selectedArea, data]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = [...(data[selectedArea] || [])];

    if (searchTerm) {
      result = result.filter(
        (h) =>
          h.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== "all") {
      const severityIndex = { low: 0, medium: 1, high: 2, veryHigh: 3, critical: 4 };
      result = result.filter(
        (h) => h.values[severityIndex[severityFilter]] > 0
      );
    }

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
  }, [selectedArea, searchTerm, sortBy, severityFilter, data]);

  // Pie chart data for personnel needs
  const personnelData = useMemo(() => {
    const needs = calculatePersonnelNeeds(data[selectedArea] || []);
    return [
      { name: "Nurses", value: needs.nurses, fill: "#3b82f6" },
      { name: "Doctors", value: needs.doctors, fill: "#22c55e" },
      { name: "Specialists", value: needs.specialists, fill: "#f59e0b" },
      { name: "ICU Staff", value: needs.icu, fill: "#dc2626" },
    ];
  }, [selectedArea, data]);

  // Bar chart data for severity overview
  const severityChartData = useMemo(() => {
    return (data[selectedArea] || []).map((h) => ({
      name: h.hospital.split(" ").slice(0, 2).join(" "),
      Low: h.values[0],
      Medium: h.values[1],
      High: h.values[2],
      "Very High": h.values[3],
      Critical: h.values[4],
    }));
  }, [selectedArea, data]);

  // Trend data for line chart
  const trendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return days.map((day, i) => {
      const dayData = { name: day };
      (data[selectedArea] || []).forEach((h) => {
        dayData[h.hospital.split(" ")[0]] = h.trend[i];
      });
      return dayData;
    });
  }, [selectedArea, data]);

  const toggleCompare = (hospital) => {
    if (compareHospitals.includes(hospital.hospital)) {
      setCompareHospitals(
        compareHospitals.filter((h) => h !== hospital.hospital)
      );
    } else if (compareHospitals.length < 3) {
      setCompareHospitals([...compareHospitals, hospital.hospital]);
    }
  };

  const compareData = useMemo(() => {
    return (data[selectedArea] || []).filter((h) =>
      compareHospitals.includes(h.hospital)
    );
  }, [selectedArea, compareHospitals, data]);

  const badge = {
    low: "Low",
    medium: "Medium",
    high: "High",
    veryHigh: "Very High",
    critical: "Critical",
  };

  if (loading) {
    return (
      <Layout>
        <div className="triage-fullpage">
          <p style={{ padding: "2rem", textAlign: "center" }}>Loading triage data…</p>
        </div>
        <Footer />
      </Layout>
    );
  }

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
                <span className="value">{(data[selectedArea] || []).length}</span>
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
                  <Bar dataKey="Medium" stackId="a" fill={SEVERITY_COLORS.medium} />
                  <Bar dataKey="High" stackId="a" fill={SEVERITY_COLORS.high} />
                  <Bar dataKey="Very High" stackId="a" fill={SEVERITY_COLORS.veryHigh} />
                  <Bar dataKey="Critical" stackId="a" fill={SEVERITY_COLORS.critical} />
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
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`clickable-row ${
                        compareHospitals.includes(row.hospital) ? "selected" : ""
                      }`}
                      onClick={() =>
                        compareMode ? toggleCompare(row) : setSelectedHospital(row)
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
                        <span className="doctor-badge">{row.specialty}</span>
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
                  {(data[selectedArea] || []).slice(0, 3).map((h, i) => (
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
            {alerts.length === 0 && (
              <p style={{ padding: "1rem", color: "#666" }}>No active alerts.</p>
            )}
            {alerts.map((a, i) => (
              <div key={i} className={`alert-card severity-${a.level}`}>
                <span className={`severity-badge ${a.level}`}>
                  {badge[a.level] || a.level}
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
                        {h.values.map((v, vi) => (
                          <div
                            key={vi}
                            className="bar-fill"
                            style={{
                              width: total > 0 ? `${(v / total) * 100}%` : "0%",
                              background: Object.values(SEVERITY_COLORS)[vi],
                            }}
                          />
                        ))}
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
                  Level: {selectedHospital.specialty}
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
                        const percent =
                          total > 0
                            ? ((selectedHospital.values[i] / total) * 100).toFixed(1)
                            : "0.0";
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
