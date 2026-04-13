// src/components/HospitalPatientChart.jsx
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import nodeApi from "../../services/nodeApi";

const COLORS = ["#1A4718", "#FEC700", "#1877F2", "#cf0909ff"];

const HospitalPatientChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        // Primary: Node backend
        const { data: res } = await nodeApi.get(
          "/hospitals/patient-distribution",
        );
        setData(res.data || []);
      } catch (err) {
        console.error("Failed to fetch patient distribution", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDistribution();
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
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow:
                  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ fontWeight: "600", color: "#374151" }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </div>
      )}
    </div>
  );
};

export default HospitalPatientChart;
