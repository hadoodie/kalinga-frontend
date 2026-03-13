import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Shield,
  Sparkles,
  Thermometer,
  Zap,
} from "lucide-react";
import api from "@/services/api";

const urgencyConfig = {
  critical: {
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: AlertTriangle,
    label: "Critical",
  },
  high: {
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Zap,
    label: "High Priority",
  },
  medium: {
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: Thermometer,
    label: "Medium",
  },
  low: {
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: Shield,
    label: "Low",
  },
};

/**
 * MessageNLPBadge - Inline urgency indicator for individual messages
 */
export const MessageNLPBadge = ({ nlp, compact = true }) => {
  if (!nlp || nlp.urgency_score < 25) return null;

  const config = urgencyConfig[nlp.urgency_level] || urgencyConfig.low;
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.color} ${config.border} border`}
        title={`Urgency: ${config.label} (${nlp.urgency_score}%)`}
      >
        <Icon className="h-2.5 w-2.5" />
        {nlp.urgency_score >= 75 && <span>{config.label}</span>}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded-lg ${config.bg} ${config.border} border`}
    >
      <Icon className={`h-4 w-4 ${config.color}`} />
      <div className="flex-1">
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
        {nlp.keywords?.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Keywords: {nlp.keywords.slice(0, 3).join(", ")}
          </p>
        )}
      </div>
      <span className={`text-xs font-bold ${config.color}`}>
        {nlp.urgency_score}%
      </span>
    </div>
  );
};

/**
 * ConversationNLPPanel - Full conversation analysis panel
 */
export const ConversationNLPPanel = ({
  incidentId,
  messages = [],
  className = "",
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!incidentId && messages.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let response;

      if (incidentId) {
        // Fetch analysis for incident messages
        response = await api.get(`/nlp/incident/${incidentId}/analysis`);
      } else if (messages.length > 0) {
        // Analyze provided messages
        response = await api.post("/nlp/analyze-conversation", {
          messages: messages.map((m) => m.text || m.message || m),
        });
      }

      setAnalysis(response?.data?.data || null);
    } catch (err) {
      console.error("NLP analysis failed:", err);
      setError(err?.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [incidentId, messages]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading && !analysis) {
    return (
      <div
        className={`rounded-xl border border-border/60 bg-card p-4 ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Analyzing conversation...</span>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div
        className={`rounded-xl border border-border/60 bg-card p-4 ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-sm text-rose-500">{error}</span>
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const urgencyLevel = analysis.overall_urgency?.level || "low";
  const urgencyScore = analysis.overall_urgency?.score || 0;
  const config = urgencyConfig[urgencyLevel] || urgencyConfig.low;
  const Icon = config.icon;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${config.border} ${className}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${config.bg}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-foreground">
            AI Analysis
          </span>
          <span className="text-xs text-muted-foreground">
            • {analysis.message_count || 0} messages
          </span>
        </div>
        <div className="flex items-center gap-3">
          {analysis.escalation_recommended && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500">
              <AlertTriangle className="h-3 w-3" />
              Escalation
            </span>
          )}
          <div className="flex items-center gap-1">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className={`text-sm font-bold ${config.color}`}>
              {urgencyScore}%
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-3 space-y-4 bg-card">
          {/* AI Summary */}
          {analysis.ai_summary && (
            <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  AI Summary
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {analysis.ai_summary}
              </p>
            </div>
          )}

          {/* Symptoms */}
          {Object.keys(analysis.aggregated_symptoms || {}).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Detected Symptoms
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(analysis.aggregated_symptoms).map(
                  ([category, symptoms]) => (
                    <div
                      key={category}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs"
                    >
                      <Thermometer className="h-3 w-3" />
                      <span className="capitalize">{category}</span>
                      {symptoms.length > 1 && (
                        <span className="text-[10px] opacity-70">
                          ({symptoms.length})
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Hazards */}
          {(analysis.aggregated_hazards || []).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Detected Hazards
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.aggregated_hazards.map((hazard) => (
                  <span
                    key={hazard}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span className="capitalize">{hazard}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Questions */}
          {analysis.individual_analyses?.[0]?.ai_insights?.recommended_questions
            ?.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Suggested Questions
              </h4>
              <ul className="space-y-1.5">
                {analysis.individual_analyses[0].ai_insights.recommended_questions
                  .slice(0, 3)
                  .map((question, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <span className="text-muted-foreground">•</span>
                      {question}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Refresh Button */}
          <div className="pt-2 border-t border-border/60">
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Analyzing..." : "Refresh Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * QuickUrgencyIndicator - Simple inline urgency indicator for message lists
 */
export const QuickUrgencyIndicator = ({ message, onClick }) => {
  const [urgency, setUrgency] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkUrgency = useCallback(async () => {
    if (!message) return;

    setLoading(true);
    try {
      const response = await api.post("/nlp/urgency-check", { message });
      setUrgency(response?.data?.data || null);
    } catch (err) {
      console.error("Urgency check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    checkUrgency();
  }, [checkUrgency]);

  if (loading) {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }

  if (!urgency || urgency.score < 50) return null;

  const config = urgencyConfig[urgency.level] || urgencyConfig.medium;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.color} ${config.border} border hover:opacity-80 transition-opacity`}
      title={`Click to see details. Keywords: ${urgency.keywords_found?.join(", ") || "none"}`}
    >
      <Icon className="h-2.5 w-2.5" />
      <span>{urgency.score}%</span>
    </button>
  );
};

/**
 * NLPService - Frontend service for NLP API calls
 */
export const nlpService = {
  analyzeMessage: async (message, context = {}) => {
    const response = await api.post("/nlp/analyze-message", {
      message,
      ...context,
    });
    return response?.data?.data;
  },

  checkUrgency: async (message) => {
    const response = await api.post("/nlp/urgency-check", { message });
    return response?.data?.data;
  },

  analyzeConversation: async (messages, context = {}) => {
    const response = await api.post("/nlp/analyze-conversation", {
      messages,
      ...context,
    });
    return response?.data?.data;
  },

  analyzeIncidentMessages: async (incidentId) => {
    const response = await api.get(`/nlp/incident/${incidentId}/analysis`);
    return response?.data?.data;
  },

  bulkUrgencyAnalysis: async (messages) => {
    const response = await api.post("/nlp/bulk-urgency", { messages });
    return response?.data?.data;
  },
};

export default {
  MessageNLPBadge,
  ConversationNLPPanel,
  QuickUrgencyIndicator,
  nlpService,
};
