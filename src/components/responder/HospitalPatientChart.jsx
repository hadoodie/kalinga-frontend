// src/components/HospitalPatientChart.jsx
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import nodeApi from "../../services/nodeApi";

const COLORS = ["#1A4718", "#FEC700", "#1877F2", "#cf0909ff"];

const HospitalPatientChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nodeApi
      .get("/hospitals/patient-distribution")
      .then(({ data: res }) => setData(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h3 className="card-title">Hospital Patient Distribution</h3>
      {loading ? (
        <p style={{ padding: "1rem" }}>Loading…</p>
      ) : (
        <div className="chart-container">
          <PieChart width={270} height={280}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </div>
      )}
    </div>
  );
};

export default HospitalPatientChart;
