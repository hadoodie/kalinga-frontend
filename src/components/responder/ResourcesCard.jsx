import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import nodeApi from "../../services/nodeApi";
import "../../styles/personnel-style.css";

const COLORS = ["#1E2A78", "#C0392B", "#145A32", "#F1C40F"];
const TYPE_LABELS = {
  water: "Water",
  food: "Food",
  medicine: "Medicines",
  clothes: "Clothes",
};

const ResourcesCard = () => {
  const [allCentersData, setAllCentersData] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nodeApi
      .get("/resources/summary")
      .then(({ data }) => {
        const rows = data.data || [];

        // Aggregate totals per resource type across all centers
        const totals = {};
        rows.forEach(({ type, quantity }) => {
          totals[type] = (totals[type] || 0) + Number(quantity);
        });
        setAllCentersData(
          Object.entries(totals).map(([type, value]) => ({
            name: TYPE_LABELS[type] || "Unknown",
            value,
          })),
        );

        // Group by center name for per-center pie charts
        const byCenter = {};
        rows.forEach(({ type, quantity, center }) => {
          const name = center?.name?.trim() || "Unknown Center";
          if (!byCenter[name]) byCenter[name] = [];
          byCenter[name].push({
            name: TYPE_LABELS[type] || "Unknown",
            value: Number(quantity),
          });
        });

        let formattedCenters = Object.entries(byCenter).map(([name, data]) => ({
          name,
          data,
        }));

        // Let's summarize the total quantity for each center to find the small ones
        const THRESHOLD = 0.05; // 5% total threshold
        const totalOverallQuantity = rows.reduce(
          (acc, curr) => acc + Number(curr.quantity),
          0,
        );

        const mainCenters = [];
        const otherCentersData = {};

        formattedCenters.forEach((center) => {
          const centerTotal = center.data.reduce(
            (acc, item) => acc + item.value,
            0,
          );
          if (
            centerTotal / totalOverallQuantity < THRESHOLD &&
            formattedCenters.length > 5
          ) {
            // Merge into others
            center.data.forEach((item) => {
              otherCentersData[item.name] =
                (otherCentersData[item.name] || 0) + item.value;
            });
          } else {
            mainCenters.push(center);
          }
        });

        if (Object.keys(otherCentersData).length > 0) {
          mainCenters.push({
            name: "Other Centers",
            data: Object.entries(otherCentersData).map(([name, value]) => ({
              name,
              value,
            })),
          });
        }

        setCenters(mainCenters);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card resources-card responder-widget">
        <h3 className="card-title">Resources</h3>
        <p style={{ padding: "1rem" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="card resources-card responder-widget">
      <h3 className="card-title">Resources</h3>

      <div className="resources-main-row">
        {/* Legend */}
        <div className="resources-legend">
          <h4>All Centers</h4>
          <ul>
            {allCentersData.map((item, i) => (
              <li key={i}>
                <span
                  className="legend-box"
                  style={{ background: COLORS[i % COLORS.length] }}
                ></span>
                {item.name} — {item.value.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>

        {/* Donut */}
        <div className="resources-donut">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              <Pie
                data={allCentersData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {allCentersData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} Units`, name]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Individual Centers */}
        <div className="resources-right">
          {centers.map((center, i) => (
            <div key={i} className="center-pie">
              <h5>{center.name}</h5>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={center.data}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    labelLine={false}
                  >
                    {center.data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} Units`, name]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesCard;
