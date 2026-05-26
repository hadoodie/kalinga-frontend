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
    <div className="card evacuation responder-widget responder-widget--responders">
      <h3 className="card-title">Health Responders</h3>

      {loading ? (
        <p style={{ textAlign: "center", padding: "1rem" }}>Loading…</p>
      ) : (
        <>
          <div className="circle-chart responder-donut-wrap">
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
            <div className="circle-label responder-total-label">
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
          </div>

          <div className="legend responder-legend">
            <div className="responder-legend-item">
              <span
                className="responder-legend-dot"
                style={{ background: "#1A4718" }}
              ></span>
              On-Duty ({stats.on_duty})
            </div>
            <div className="responder-legend-item">
              <span
                className="responder-legend-dot"
                style={{ background: "#FEC700" }}
              ></span>
              Stand-by ({stats.standby})
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HealthRespondersCard;
