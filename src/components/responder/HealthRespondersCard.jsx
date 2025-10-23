import React from "react";
import "../../styles/personnel-style.css";

const HealthRespondersCard = () => {
  // 🔹 Example values (replace with real data)
  const onDuty = 45;   // exact number
  const standBy = 15;  // exact number
  const total = onDuty + standBy;

  // 🔹 Calculate percentages for drawing circle
  const onDutyPercent = (onDuty / total) * 100;
  const standByPercent = (standBy / total) * 100;

  return (
    <div className="card evacuation">
      <h3>Health Responders</h3>

      <div className="circle-chart">
        <svg viewBox="0 0 36 36">
          {/* Background Circle */}
          <path
            className="circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />

          {/* On-Duty portion */}
          <path
            className="circle-on"
            strokeDasharray={`${onDutyPercent}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Center Label → Show exact total */}
        <div className="circle-label">
          {total}
          <div className="circle-sub">Total</div>
        </div>
      </div>

      {/* Legend with exact numbers */}
      <div className="legend">
        <div>
          <span style={{ background: "#1A4718" }}></span> On-Duty Responders ({onDuty})
        </div>
        <div>
          <span style={{ background: "#FEC700" }}></span> Stand-by Responders ({standBy})
        </div>
      </div>
    </div>
  );
};

export default HealthRespondersCard;
