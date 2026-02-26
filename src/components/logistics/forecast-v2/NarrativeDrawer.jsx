import { useState, useMemo, memo } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Building2,
  TrendingUp,
  Sparkles,
  AlertOctagon,
} from "lucide-react";

// ── Helpers to parse the rule-based narrative into structured sections ──

function parseNarrativeSections(narrative) {
  if (!narrative || typeof narrative !== "string") return null;

  const result = {
    overview: null,
    alert: null,
    priorityItems: [],
    hospitals: [],
    riskPosture: null,
    raw: narrative,
  };

  const lines = narrative
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let currentSection = null;

  for (const line of lines) {
    // Skip the title/date lines
    if (line === "FORECAST EXECUTIVE SUMMARY") continue;
    if (line.startsWith("Generated:")) {
      result.generatedAt = line.replace("Generated:", "").trim();
      continue;
    }

    // Detect sections
    if (line === "PRIORITY ITEMS:" || line === "PRIORITY ITEMS") {
      currentSection = "priority";
      continue;
    }
    if (
      line.startsWith("HOSPITALS REQUIRING ATTENTION") ||
      line.startsWith("HOSPITALS WITH MOST RISK")
    ) {
      currentSection = "hospitals";
      continue;
    }
    if (
      line.startsWith("RISK POSTURE") ||
      line.startsWith("OVERALL RISK") ||
      line.startsWith("RECOMMENDATION")
    ) {
      currentSection = "posture";
      continue;
    }

    // Parse content based on current section
    if (currentSection === "priority") {
      const match = line.match(
        /^\s*(\d+)\.\s*(.+?)\s*[-—]\s*(.+?):\s*Risk\s*([\d.]+)%,?\s*stockout\s*in\s*~?([\d.]+)d?/i,
      );
      if (match) {
        result.priorityItems.push({
          rank: parseInt(match[1]),
          hospital: match[2].trim(),
          resource: match[3].trim(),
          riskPct: parseFloat(match[4]),
          daysUntilStockout: parseFloat(match[5]),
        });
      }
      continue;
    }

    if (currentSection === "hospitals") {
      const match = line.match(
        /^\s*[•\-]\s*(.+?):\s*(\d+)\s*(?:at-risk|high\/critical|risk)\s*items?/i,
      );
      if (match) {
        result.hospitals.push({
          name: match[1].trim(),
          riskCount: parseInt(match[2]),
        });
      }
      continue;
    }

    if (currentSection === "posture") {
      result.riskPosture = (result.riskPosture || "") + " " + line;
      continue;
    }

    // Overview / alert lines (before any section header)
    if (!currentSection) {
      if (line.includes("⚠") || line.includes("ALERT")) {
        result.alert = line.replace(/^⚠️?\s*/, "").trim();
      } else if (line.includes("⚡") || line.includes("CAUTION")) {
        result.alert = line.replace(/^⚡\s*/, "").trim();
      } else if (line.includes("✅")) {
        result.overview = line.replace(/^✅\s*/, "").trim();
      } else if (!result.overview) {
        result.overview = line;
      }
    }
  }

  if (result.riskPosture) result.riskPosture = result.riskPosture.trim();

  return result;
}

function getRiskColor(pct) {
  if (pct >= 85)
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
    };
  if (pct >= 65)
    return {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      dot: "bg-orange-500",
    };
  if (pct >= 35)
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    };
  return {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  };
}

// ── Component ────────────────────────────────────────────────

const NarrativeDrawer = memo(function NarrativeDrawer({
  narrative,
  riskDistribution,
  isLoading,
}) {
  const [open, setOpen] = useState(false);

  const highRiskCount =
    (riskDistribution?.high || 0) + (riskDistribution?.critical || 0);
  const isHealthy = highRiskCount === 0;

  const summaryText = isLoading
    ? "Analyzing…"
    : isHealthy
      ? "All items within safe stock levels"
      : `${highRiskCount} item${highRiskCount === 1 ? "" : "s"} at elevated risk`;

  // Normalise narrative to a string (API may return an object with .narrative or .text)
  const narrativeText =
    typeof narrative === "string"
      ? narrative
      : narrative?.narrative || narrative?.text || null;

  // Extract hospital risk data directly from API stats (richer than parsed text)
  const hospitalRiskData =
    typeof narrative === "object" && narrative?.stats?.risk_by_hospital
      ? narrative.stats.risk_by_hospital
      : null;

  // Parse the narrative into structured data
  const parsed = useMemo(
    () => parseNarrativeSections(narrativeText),
    [narrativeText],
  );

  return (
    <section
      aria-label="AI forecast narrative"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all"
    >
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-slate-50/50 transition cursor-pointer"
        aria-expanded={open}
        aria-controls="narrative-body"
      >
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen
            className="h-4 w-4 text-violet-500 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate">
              Forecast Narrative
            </h3>
            <p className="flex items-center gap-1.5 text-xs mt-0.5">
              {isLoading ? (
                <span className="text-slate-400 animate-pulse">
                  {summaryText}
                </span>
              ) : isHealthy ? (
                <>
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-emerald-500"
                    aria-hidden="true"
                  />
                  <span className="text-emerald-600 font-medium">
                    {summaryText}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-orange-500"
                    aria-hidden="true"
                  />
                  <span className="text-orange-600 font-medium">
                    {summaryText}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {open ? (
          <ChevronUp
            className="h-4 w-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Expanded body */}
      {open && (
        <div
          id="narrative-body"
          className="border-t border-slate-100 px-6 py-5 space-y-5 animate-in fade-in slide-in-from-top-1"
        >
          {/* Risk distribution grid */}
          {riskDistribution && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Risk Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    key: "low",
                    label: "Low",
                    color: "bg-emerald-100 text-emerald-700",
                    indicator: "●",
                  },
                  {
                    key: "medium",
                    label: "Medium",
                    color: "bg-amber-100 text-amber-700",
                    indicator: "▲",
                  },
                  {
                    key: "high",
                    label: "High",
                    color: "bg-orange-100 text-orange-700",
                    indicator: "◆",
                  },
                  {
                    key: "critical",
                    label: "Critical",
                    color: "bg-red-100 text-red-700",
                    indicator: "✦",
                  },
                ].map(({ key, label, color, indicator }) => (
                  <div
                    key={key}
                    className={`rounded-xl px-4 py-3 ${color}`}
                    role="status"
                    aria-label={`${label} risk: ${riskDistribution[key] || 0} items`}
                  >
                    <span className="block text-lg font-bold">
                      {indicator} {riskDistribution[key] || 0}
                    </span>
                    <span className="block text-xs font-medium opacity-75">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Structured Narrative ── */}
          {parsed ? (
            <StructuredNarrativeView parsed={parsed} hospitalRiskData={hospitalRiskData} />
          ) : narrativeText ? (
            /* Fallback: render raw text if parsing returned nothing useful */
            <RawNarrativeFallback narrative={narrativeText} />
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No narrative available yet. Run the forecast pipeline to generate
              one.
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
            </div>
          )}
        </div>
      )}
    </section>
  );
});

// ── Structured view: parses the rule-based narrative into cards ──

function StructuredNarrativeView({ parsed, hospitalRiskData }) {
  const hasAlert = !!parsed.alert;
  const hasPriority = parsed.priorityItems.length > 0;

  // Prefer API-sourced hospital data (has critical_count + avg_severity for
  // tie-breaking) over text-parsed data.
  const hospitals = useMemo(() => {
    if (hospitalRiskData && hospitalRiskData.length > 0) {
      return hospitalRiskData.map((h) => ({
        name: h.name,
        riskCount: h.risk_count,
        criticalCount: h.critical_count ?? 0,
        avgSeverity: h.avg_severity ?? 0,
      }));
    }
    return parsed.hospitals.map((h) => ({
      name: h.name,
      riskCount: h.riskCount,
      criticalCount: 0,
      avgSeverity: 0,
    }));
  }, [hospitalRiskData, parsed.hospitals]);

  const hasHospitals = hospitals.length > 0;
  const maxSeverity = Math.max(1, ...hospitals.map((h) => h.avgSeverity || 1));

  return (
    <div className="space-y-5">
      {/* Generated At */}
      {parsed.generatedAt && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3 w-3" />
          <span>Generated {parsed.generatedAt}</span>
        </div>
      )}

      {/* Alert Banner */}
      {hasAlert && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4">
          <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Critical Alert</p>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">
              {parsed.alert}
            </p>
          </div>
        </div>
      )}

      {/* Overview (when no alert) */}
      {!hasAlert && parsed.overview && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800 leading-relaxed">
            {parsed.overview}
          </p>
        </div>
      )}

      {/* Priority Items */}
      {hasPriority && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Priority Items
          </h4>
          <div className="space-y-2">
            {parsed.priorityItems.map((item, idx) => {
              const risk = getRiskColor(item.riskPct);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-xl border ${risk.border} ${risk.bg} px-4 py-3 transition-colors hover:shadow-sm`}
                >
                  {/* Rank */}
                  <span
                    className={`text-lg font-black ${risk.text} w-7 text-center shrink-0`}
                  >
                    {item.rank}
                  </span>

                  {/* Divider dot */}
                  <span
                    className={`h-2 w-2 rounded-full ${risk.dot} shrink-0`}
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.resource}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.hospital}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${risk.border} ${risk.bg} ${risk.text}`}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      {item.riskPct}%
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        item.daysUntilStockout < 1
                          ? "text-red-600"
                          : item.daysUntilStockout < 3
                            ? "text-amber-600"
                            : "text-slate-500"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {item.daysUntilStockout < 1
                        ? "< 1d"
                        : `~${item.daysUntilStockout}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hospitals Requiring Attention */}
      {hasHospitals && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Hospitals Requiring Attention
          </h4>
          <div className="space-y-2">
            {hospitals.map((h, idx) => {
              // Color based on avg severity — not just position.
              // >=85 avg = red (critical-heavy), >=70 = orange, else slate
              const hasCritical = h.criticalCount > 0;
              const isHighSeverity = h.avgSeverity >= 85;
              const isMidSeverity = h.avgSeverity >= 70;

              const barWidth = Math.max(
                8,
                Math.round((h.avgSeverity / maxSeverity) * 100),
              );

              const cardStyle = isHighSeverity
                ? "border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
                : isMidSeverity
                  ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50";
              const iconColor = isHighSeverity
                ? "text-red-600"
                : isMidSeverity
                  ? "text-orange-600"
                  : "text-slate-400";
              const badgeBg = isHighSeverity
                ? "bg-red-200 text-red-800"
                : isMidSeverity
                  ? "bg-orange-200 text-orange-800"
                  : "bg-slate-200 text-slate-600";
              const barColor = isHighSeverity
                ? "bg-red-500"
                : isMidSeverity
                  ? "bg-orange-500"
                  : "bg-slate-400";

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 transition-colors ${cardStyle}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2
                        className={`h-4 w-4 shrink-0 ${iconColor}`}
                      />
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {h.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasCritical && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                          {h.criticalCount} critical
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeBg}`}
                      >
                        {h.riskCount} at-risk
                      </span>
                    </div>
                  </div>
                  {/* Severity bar — width proportional to avg severity */}
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  {h.avgSeverity > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Avg severity: {h.avgSeverity}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Posture */}
      {parsed.riskPosture && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              Overall Risk Posture
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              {parsed.riskPosture}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fallback for unparseable narratives ──

function RawNarrativeFallback({ narrative }) {
  const paragraphs = narrative
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
        <Sparkles className="h-3 w-3" />
        AI Summary
      </h4>
      <div className="space-y-2">
        {paragraphs.map((p, idx) => {
          const isAlert =
            p.includes("⚠") ||
            p.toLowerCase().includes("alert") ||
            p.toLowerCase().includes("critical");
          const isBullet =
            p.startsWith("•") || p.startsWith("-") || /^\d+\./.test(p);
          const isHeader = p === p.toUpperCase() && p.length < 60;

          if (isHeader) {
            return (
              <h5
                key={idx}
                className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-3 pt-3 border-t border-slate-100 first:mt-0 first:pt-0 first:border-t-0"
              >
                {p.replace(/:$/, "")}
              </h5>
            );
          }

          return (
            <p
              key={idx}
              className={`text-sm leading-relaxed ${
                isAlert
                  ? "text-red-700 font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100"
                  : isBullet
                    ? "text-slate-700 pl-4 border-l-2 border-slate-200"
                    : "text-slate-700"
              }`}
            >
              {p}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default NarrativeDrawer;
