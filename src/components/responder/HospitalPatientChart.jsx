// src/components/HospitalPatientChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const HospitalPatientChart = () => {
  const data = [
    { name: "Admitted Patients", value: 720 },
    { name: "Discharged Patients", value: 430 },
    { name: "Referred Patients", value: 210 },
    { name: "Critical Cases", value: 65 },
  ];

  const COLORS = ["#1A4718", "#FEC700", "#1877F2", "#cf0909ff"];

  return (
    <div className="card">
      <h3 className="card-title">Hospital Patient Distribution</h3>
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
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </div>
    </div>
  );
};

export default HospitalPatientChart;
