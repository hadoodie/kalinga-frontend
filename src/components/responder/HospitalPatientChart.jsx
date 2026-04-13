// src/components/HospitalPatientChart.jsx
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
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
    <div className="card responder-widget responder-widget--distribution">
      <h3 className="card-title">Hospital Patient Distribution</h3>
      {loading ? (
        <p style={{ padding: "1rem" }}>Loading…</p>
      ) : (
        <div className="chart-container patient-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={54}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} Patients`, name]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow:
                    "0 8px 20px rgba(15, 23, 42, 0.08)",
                }}
                itemStyle={{ fontWeight: 600, color: "#374151" }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: "14px", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default HospitalPatientChart;
