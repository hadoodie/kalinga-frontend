import { useCallback, useEffect, useState } from "react";
import {
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  RefreshCcw,
  Sparkles,
  Star,
  Target,
  User,
  Zap,
} from "lucide-react";
import adminService from "@/services/adminService";

const scoreColor = (score) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  if (score >= 40) return "text-orange-500";
  return "text-rose-500";
};

const scoreBarColor = (score) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-rose-500";
};

const priorityBadge = {
  critical: "bg-rose-500/20 text-rose-500 border-rose-500/30",
  high: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  medium: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  low: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
};

/**
 * SmartRoutingPanel - AI-powered responder recommendation panel
 * Displays smart routing recommendations for incident assignment
 */
export const SmartRoutingPanel = ({
  incidentId,
  onAssign,
  onAutoAssign,
  className = "",
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    if (!incidentId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await adminService.getSmartResponderRecommendations(incidentId, { limit: 5 });
      setRecommendations(data.recommendations || []);
      setAiAnalysis(data.ai_analysis);
      setMeta(data.meta);
    } catch (err) {
      console.error("Failed to fetch smart recommendations:", err);
      setError(err?.response?.data?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleAutoAssign = async () => {
    if (!incidentId) return;

    setAutoAssigning(true);
    try {
      const result = await adminService.smartAutoAssign(incidentId, {
        notes: "AI-assisted smart routing assignment",
      });
      
      if (onAutoAssign) {
        onAutoAssign(result);
      }
    } catch (err) {
      console.error("Smart auto-assign failed:", err);
      setError(err?.response?.data?.message || "Auto-assign failed");
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleManualAssign = (responder) => {
    if (onAssign) {
      onAssign(responder);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className={`rounded-xl border border-border/60 bg-card p-6 ${className}`}>
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Analyzing responders...</span>
        </div>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className={`rounded-xl border border-border/60 bg-card p-6 ${className}`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-rose-500">{error}</div>
          <button
            onClick={fetchRecommendations}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border/60 bg-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-500" />
          <h3 className="font-medium text-foreground">Smart Routing</h3>
          {aiAnalysis && (
            <span className="text-xs text-muted-foreground ml-2">
              AI-powered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-background/80 transition-colors disabled:opacity-50"
            title="Refresh recommendations"
          >
            <RefreshCcw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* AI Analysis Summary */}
      {aiAnalysis && (
        <div className="border-b border-border/60 bg-violet-500/5 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-foreground">AI Analysis</span>
            {aiAnalysis.incident_priority && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityBadge[aiAnalysis.incident_priority] || priorityBadge.medium}`}>
                {aiAnalysis.incident_priority} priority
              </span>
            )}
            {aiAnalysis.estimated_response_quality && (
              <span className="text-xs text-muted-foreground">
                • {aiAnalysis.estimated_response_quality} response expected
              </span>
            )}
          </div>
          {aiAnalysis.reasoning && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiAnalysis.reasoning}
            </p>
          )}
          {aiAnalysis.special_considerations && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠️ {aiAnalysis.special_considerations}
            </p>
          )}
        </div>
      )}

      {/* Auto-assign Action */}
      {recommendations.length > 0 && (
        <div className="border-b border-border/60 px-4 py-3">
          <button
            onClick={handleAutoAssign}
            disabled={autoAssigning}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning best responder...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Auto-Assign Best Responder
              </>
            )}
          </button>
        </div>
      )}

      {/* Recommendations List */}
      <div className="divide-y divide-border/60">
        {recommendations.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No available responders found</p>
            {meta?.reason === "no_available_responders" && (
              <p className="text-xs mt-1">All responders may be currently assigned</p>
            )}
          </div>
        ) : (
          recommendations.map((rec, index) => (
            <div
              key={rec.responder_id}
              className={`px-4 py-3 transition-colors ${
                rec.ai_recommendation === "recommended"
                  ? "bg-violet-500/5"
                  : "hover:bg-muted/50"
              }`}
            >
              {/* Responder Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <Star className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {rec.ai_recommendation === "recommended" && index !== 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {rec.name}
                      </span>
                      {index === 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          Best Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {rec.distance_km !== null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {rec.distance_km.toFixed(1)} km
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {rec.active_assignments} active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${scoreColor(rec.scores?.composite || 0)}`}>
                      {Math.round(rec.scores?.composite || 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Score
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpanded(rec.responder_id)}
                    className="p-1 rounded hover:bg-background/80 transition-colors"
                  >
                    {expandedId === rec.responder_id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === rec.responder_id && (
                <div className="mt-3 pt-3 border-t border-border/60">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: "Proximity", value: rec.scores?.distance, icon: MapPin },
                      { label: "Availability", value: rec.scores?.workload, icon: Clock },
                      { label: "Experience", value: rec.scores?.experience, icon: Star },
                      { label: "Response Time", value: rec.scores?.response_time, icon: Zap },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${scoreBarColor(item.value || 0)}`}
                              style={{ width: `${item.value || 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium w-6 text-right ${scoreColor(item.value || 0)}`}>
                            {Math.round(item.value || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Reasoning */}
                  {rec.ai_reasoning && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-3">
                      <Sparkles className="h-3 w-3 inline mr-1 text-violet-500" />
                      {rec.ai_reasoning}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {rec.phone && <span>{rec.phone}</span>}
                    </div>
                    <button
                      onClick={() => handleManualAssign(rec)}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Meta */}
      {meta && (
        <div className="border-t border-border/60 bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {meta.total_available_responders || 0} responders available
            </span>
            {meta.incident_type && (
              <span className="text-foreground/70">{meta.incident_type}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartRoutingPanel;
