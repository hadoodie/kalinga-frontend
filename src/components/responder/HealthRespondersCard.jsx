import React, { useEffect, useState } from "react";
import nodeApi from "../../services/nodeApi";
import "../../styles/personnel-style.css";

const HealthRespondersCard = () => {
  const [stats, setStats] = useState({ on_duty: 0, standby: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    nodeApi
      .get("/responders/stats")
      .then(({ data }) => {
        const d = data.data || {};
        setStats({
          on_duty: d.on_duty ?? 0,
          standby: d.standby ?? 0,
          total: (d.on_duty ?? 0) + (d.standby ?? 0) + (d.off_duty ?? 0),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onDutyPercent =
    stats.total > 0 ? (stats.on_duty / stats.total) * 100 : 0;

  return (
    <div className="card evacuation">
      <h3>Health Responders</h3>

      {loading ? (
        <p style={{ textAlign: "center", padding: "1rem" }}>Loading…</p>
      ) : (
        <>
          <div
            className="circle-chart"
            style={{
              position: "relative",
              width: "160px",
              margin: "0 auto 20px",
            }}
          >
            <svg viewBox="0 0 36 36">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle-on"
                strokeDasharray={`${onDutyPercent}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div
              className="circle-label"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  lineHeight: "1",
                }}
              >
                {stats.total}
              </span>
              <span
                className="circle-sub"
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginTop: "4px",
                }}
              >
                Total
              </span>
            </div>
          </div>

          <div
            className="legend"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.875rem",
                color: "#374151",
              }}
            >
              <span
                style={{
                  background: "#1A4718",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              ></span>{" "}
              On-Duty ({stats.on_duty})
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.875rem",
                color: "#374151",
              }}
            >
              <span
                style={{
                  background: "#FEC700",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              ></span>{" "}
              Stand-by ({stats.standby})
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HealthRespondersCard;
