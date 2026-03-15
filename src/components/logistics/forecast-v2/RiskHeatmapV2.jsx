import { useState, useMemo, memo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Grid3x3,
  Search,
} from "lucide-react";

// Accessible palette: color + shape indicator (WCAG 2.1 SC 1.4.1)
const RISK_STYLES = {
  low: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    indicator: "●",
    label: "Low",
  },
  medium: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    indicator: "▲",
    label: "Medium",
  },
  high: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    indicator: "◆",
    label: "High",
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    indicator: "✦",
    label: "Critical",
  },
};

/**
 * Build a { hospitals, resources, grid<Map> } structure from the flat
 * risk array coming from either the API or demo data.
 */
function buildGrid(riskData) {
  const hospitalMap = new Map();
  const resourceSet = new Set();
  const grid = new Map();

  for (const item of riskData) {
    const hId = item.hospital_id;
    const hName =
      item.hospital?.name || item.hospital_name || `Hospital ${hId}`;
    const rName =
      item.resource?.name ||
      item.resource_name ||
      item.resource?.category ||
      `Resource ${item.resource_id}`;

    hospitalMap.set(hId, hName);
    resourceSet.add(rName);

    const key = `${hId}-${rName}`;
    const existing = grid.get(key);
    if (!existing || (item.risk_prob || 0) > (existing.risk_prob || 0)) {
      grid.set(key, {
        ...item,
        _hospitalName: hName,
        _resourceName: rName,
      });
    }
  }

  return {
    hospitals: [...hospitalMap.entries()].map(([id, name]) => ({ id, name })),
    resources: [...resourceSet].sort(),
    grid,
  };
}

const RiskHeatmapV2 = memo(function RiskHeatmapV2({ riskData, onCellClick }) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const { hospitals, resources, grid } = useMemo(
    () => buildGrid(riskData),
    [riskData],
  );

  const filteredHospitals = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? hospitals.filter((h) => h.name.toLowerCase().includes(q))
      : hospitals;

    return [...filtered].sort((a, b) => {
      const aWorst = Math.max(
        0,
        ...resources.map((r) => grid.get(`${a.id}-${r}`)?.risk_prob || 0),
      );
      const bWorst = Math.max(
        0,
        ...resources.map((r) => grid.get(`${b.id}-${r}`)?.risk_prob || 0),
      );
      return sortAsc ? bWorst - aWorst : aWorst - bWorst;
    });
  }, [hospitals, resources, grid, search, sortAsc]);

  const getCellStyle = useCallback((cell) => {
    if (!cell) return RISK_STYLES.low;
    return RISK_STYLES[cell.risk_level] || RISK_STYLES.low;
  }, []);

  return (
    <section
      aria-label="Inventory risk heatmap"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Grid3x3
              className="h-4 w-4 text-emerald-600"
              aria-hidden="true"
            />
            Inventory Risk Map
          </h3>
          <p className="text-xs text-slate-400">
            Hospital × Resource risk severity. Click any cell to drill down.
          </p>
        </div>

        {/* Legend — accessible: color + shape */}
        <div
          className="flex items-center gap-3 text-xs"
          role="list"
          aria-label="Risk level legend"
        >
          {Object.entries(RISK_STYLES).map(([level, style]) => (
            <span
              key={level}
              className="flex items-center gap-1"
              role="listitem"
            >
              <span className={`${style.text} text-sm`} aria-hidden="true">
                {style.indicator}
              </span>
              <span className="text-slate-500">{style.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-50 bg-slate-50/50">
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            aria-label="Search hospitals in risk map"
          />
        </div>
        <button
          type="button"
          onClick={() => setSortAsc((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition cursor-pointer"
          aria-label={`Sort by risk: currently ${sortAsc ? "highest first" : "lowest first"}`}
        >
          {sortAsc ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {sortAsc ? "Highest risk first" : "Lowest risk first"}
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-xs"
          role="grid"
          aria-label="Risk heatmap grid"
        >
          <thead>
            <tr className="border-b border-slate-100">
              <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-semibold text-slate-500 min-w-[180px]">
                Hospital
              </th>
              {resources.map((r) => (
                <th
                  key={r}
                  className="px-2 py-3 text-center font-semibold text-slate-500 min-w-[90px]"
                >
                  <span
                    className="block truncate max-w-[80px] mx-auto"
                    title={r}
                  >
                    {r}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHospitals.map((hospital) => (
              <tr
                key={hospital.id}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-slate-700">
                  {hospital.name}
                </td>
                {resources.map((r) => {
                  const cell = grid.get(`${hospital.id}-${r}`);
                  const style = getCellStyle(cell);

                  return (
                    <td key={r} className="px-1 py-1.5">
                      <button
                        type="button"
                        onClick={() => cell && onCellClick(cell)}
                        disabled={!cell}
                        className={`w-full rounded-lg border px-2 py-2 text-center transition-all
                          ${style.bg} ${style.border} ${style.text}
                          ${cell ? "hover:shadow-md hover:scale-105 cursor-pointer" : "opacity-30 cursor-default"}
                        `}
                        aria-label={
                          cell
                            ? `${r} at ${hospital.name}: ${style.label} risk, ${Math.round((cell.risk_prob || 0) * 100)}% probability`
                            : `${r} at ${hospital.name}: No data`
                        }
                      >
                        <span
                          className="block text-sm font-bold"
                          aria-hidden="true"
                        >
                          {style.indicator}
                        </span>
                        {cell && (
                          <span className="block text-[10px] font-semibold mt-0.5">
                            {Math.round((cell.risk_prob || 0) * 100)}%
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredHospitals.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <Grid3x3
            className="h-8 w-8 mx-auto mb-2 opacity-30"
            aria-hidden="true"
          />
          <p className="text-sm">No hospitals match your search</p>
        </div>
      )}
    </section>
  );
});

export default RiskHeatmapV2;
