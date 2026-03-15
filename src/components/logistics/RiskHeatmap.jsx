import React, { useState, useEffect } from "react";
import { AlertTriangle, Grid3x3, ShoppingCart } from "lucide-react";
import forecastService from "../../services/forecastService";
import { generateDemoRiskData } from "./demoForecastData";

const RISK_CELL_COLORS = {
  low: "bg-green-100 hover:bg-green-200 border-green-300",
  medium: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
  high: "bg-orange-100 hover:bg-orange-200 border-orange-300",
  critical: "bg-red-100 hover:bg-red-200 border-red-300",
};

const RISK_TEXT = {
  low: "text-green-800",
  medium: "text-yellow-800",
  high: "text-orange-800",
  critical: "text-red-800",
};

const RiskHeatmap = () => {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const data = await forecastService.getRiskForecasts({ hours: 48 });
        setRiskData(data?.data || data || []);
        setError(null);
      } catch (err) {
        console.error("Risk heatmap error:", err);
        setError("Could not load risk data");
        setRiskData(generateDemoRiskData());
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  // Group by hospital and resource — take worst risk per pair
  const { hospitals, resources, grid, criticalAlerts } = buildGrid(riskData);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Grid3x3 className="h-5 w-5 mr-2 text-green-700" />
          Inventory Risk Heatmap
        </h3>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          {["low", "medium", "high", "critical"].map((level) => (
            <span key={level} className="flex items-center gap-1">
              <span
                className={`w-3 h-3 rounded ${
                  RISK_CELL_COLORS[level].split(" ")[0]
                }`}
              ></span>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          ⚠ {error} — showing sample data
        </div>
      )}

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {criticalAlerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg animate-pulse"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ {alert.resourceName} at {alert.hospitalName} — stockout in{" "}
                {alert.daysLeft < 1
                  ? "< 1 day"
                  : `${Math.round(alert.daysLeft)} days`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : hospitals.length > 0 && resources.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left px-2 py-2 text-gray-500 font-semibold sticky left-0 bg-white min-w-[140px]">
                  Hospital
                </th>
                {resources.map((r) => (
                  <th
                    key={r.id}
                    className="px-1 py-2 text-center text-gray-500 font-semibold min-w-[80px]"
                  >
                    <span className="truncate block max-w-[80px]">
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h.id} className="border-t border-gray-100">
                  <td className="px-2 py-1.5 font-semibold text-gray-700 sticky left-0 bg-white">
                    <span className="truncate block max-w-[140px]">
                      {h.name}
                    </span>
                  </td>
                  {resources.map((r) => {
                    const cell = grid[`${h.id}-${r.id}`];
                    const level = cell?.risk_level || "low";
                    return (
                      <td key={r.id} className="px-1 py-1.5 text-center">
                        <div
                          className={`relative rounded-lg px-2 py-2 border cursor-pointer transition-all ${RISK_CELL_COLORS[level]}`}
                          onMouseEnter={(e) =>
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              cell,
                              hospital: h.name,
                              resource: r.name,
                            })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <span className={`font-bold ${RISK_TEXT[level]}`}>
                            {cell
                              ? `${(cell.risk_prob * 100).toFixed(0)}%`
                              : "—"}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No risk data available
        </div>
      )}

      {/* Floating Tooltip */}
      {tooltip?.cell && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-3 text-sm pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 10, window.innerWidth - 260),
            top: tooltip.y + 10,
            maxWidth: 250,
          }}
        >
          <p className="font-bold text-gray-800">{tooltip.resource}</p>
          <p className="text-xs text-gray-500 mb-2">{tooltip.hospital}</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Risk Probability:</span>
              <span className="font-bold">
                {(tooltip.cell.risk_prob * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Projected Stock:</span>
              <span className="font-bold">
                {tooltip.cell.projected_stock?.toFixed(0) ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Days Until Stockout:</span>
              <span className="font-bold">
                {tooltip.cell.days_until_stockout < 999
                  ? `${tooltip.cell.days_until_stockout?.toFixed(1)}d`
                  : "Safe"}
              </span>
            </div>
            {tooltip.cell.risk_factors &&
              Object.keys(tooltip.cell.risk_factors).length > 0 && (
                <div className="border-t border-gray-100 pt-1 mt-1">
                  <p className="text-xs text-gray-400 font-semibold">
                    Risk Factors:
                  </p>
                  {Object.values(tooltip.cell.risk_factors).map((f, i) => (
                    <p key={i} className="text-xs text-red-600">
                      • {f}
                    </p>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Reorder Alerts Footer */}
      {criticalAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 flex items-center mb-2">
            <ShoppingCart className="h-4 w-4 mr-1 text-orange-600" />
            Recommended Reorders
          </h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {criticalAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm px-3 py-2 bg-orange-50 rounded-lg"
              >
                <div>
                  <span className="font-semibold text-gray-800">
                    {alert.resourceName}
                  </span>
                  <span className="text-gray-500 ml-1">
                    → {alert.hospitalName}
                  </span>
                </div>
                <span className="text-orange-700 font-bold text-xs">
                  {alert.daysLeft < 3 ? "URGENT" : "Reorder Soon"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────

function buildGrid(riskData) {
  const hospMap = {};
  const resMap = {};
  const grid = {};
  const criticalAlerts = [];

  riskData.forEach((item) => {
    const hid = item.hospital_id;
    const rid = item.resource_id;
    const hName =
      item.hospital?.name || item.hospital_name || `Hospital ${hid}`;
    const rName =
      item.resource?.name || item.resource_name || `Resource ${rid}`;

    hospMap[hid] = { id: hid, name: hName };
    resMap[rid] = { id: rid, name: rName };

    const key = `${hid}-${rid}`;
    const existing = grid[key];
    const riskProb = parseFloat(item.risk_prob || 0);

    // Keep worst risk per hospital×resource pair
    if (!existing || riskProb > existing.risk_prob) {
      grid[key] = {
        risk_prob: riskProb,
        risk_level: item.risk_level || "low",
        projected_stock: parseFloat(item.projected_stock || 0),
        days_until_stockout: parseFloat(item.days_until_stockout || 999),
        risk_factors: item.risk_factors || {},
      };
    }

    // Collect alerts for high/critical
    if (
      (item.risk_level === "high" || item.risk_level === "critical") &&
      !criticalAlerts.find((a) => a.hospitalId === hid && a.resourceId === rid)
    ) {
      criticalAlerts.push({
        hospitalId: hid,
        resourceId: rid,
        hospitalName: hName,
        resourceName: rName,
        riskLevel: item.risk_level,
        daysLeft: parseFloat(item.days_until_stockout || 999),
      });
    }
  });

  // Sort alerts by urgency
  criticalAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    hospitals: Object.values(hospMap).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    resources: Object.values(resMap).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    grid,
    criticalAlerts,
  };
}

export default RiskHeatmap;
