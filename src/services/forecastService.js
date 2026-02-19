import api from "./api";

/**
 * Forecast Service — connects React frontend to the Kalinga forecast API.
 *
 * Endpoints served by ForecastController.php:
 *   GET /api/forecasts/demand
 *   GET /api/forecasts/risk
 *   GET /api/forecasts/summary
 *   GET /api/forecasts/hospital/{hospitalId}
 */

const forecastService = {
  // ── Demand Forecasts ──────────────────────────────────────

  /**
   * Fetch demand forecasts with optional filters.
   * @param {Object} params - { hospital_id, resource_id, hours }
   */
  getDemandForecasts: async (params = {}) => {
    try {
      const response = await api.get("/forecasts/demand", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching demand forecasts:", error);
      throw error;
    }
  },

  // ── Risk Forecasts ────────────────────────────────────────

  /**
   * Fetch risk forecasts with optional filters.
   * @param {Object} params - { hospital_id, resource_id, hours, risk_level }
   */
  getRiskForecasts: async (params = {}) => {
    try {
      const response = await api.get("/forecasts/risk", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching risk forecasts:", error);
      throw error;
    }
  },

  /**
   * Fetch only high/critical risk items (shorthand).
   */
  getHighRiskItems: async (params = {}) => {
    return forecastService.getRiskForecasts({ ...params, risk_level: "high" });
  },

  // ── Summary ───────────────────────────────────────────────

  /**
   * Fetch the forecast summary dashboard data.
   * Returns: { high_risk_items, demand_by_resource, risk_distribution, generated_at }
   */
  getSummary: async () => {
    try {
      const response = await api.get("/forecasts/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching forecast summary:", error);
      throw error;
    }
  },

  // ── Hospital Detail ───────────────────────────────────────

  /**
   * Fetch forecast detail for a specific hospital.
   * @param {number} hospitalId
   */
  getHospitalDetail: async (hospitalId) => {
    try {
      const response = await api.get(`/forecasts/hospital/${hospitalId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching forecast for hospital ${hospitalId}:`,
        error,
      );
      throw error;
    }
  },

  // ── Utility helpers ───────────────────────────────────────

  /**
   * Get risk level badge color for Tailwind.
   */
  getRiskColor: (level) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[level] || colors.low;
  },

  /**
   * Format risk level for display.
   */
  formatRiskLevel: (level) => {
    return (level || "low").charAt(0).toUpperCase() + (level || "low").slice(1);
  },

  /**
   * Calculate urgency score (0-100) from risk data for sorting.
   */
  getUrgencyScore: (riskItem) => {
    const prob = riskItem.risk_prob || 0;
    const daysLeft = riskItem.days_until_stockout || 999;
    // Higher probability and fewer days = higher urgency
    return Math.round(prob * 60 + Math.max(0, (7 - daysLeft) / 7) * 40);
  },

  // ── AI Narrative ──────────────────────────────────────────

  /**
   * Fetch AI-generated executive summary.
   */
  getNarrative: async () => {
    try {
      const response = await api.get("/forecasts/narrative");
      return response.data;
    } catch (error) {
      console.error("Error fetching forecast narrative:", error);
      throw error;
    }
  },

  // ── Auto-Reorders ────────────────────────────────────────

  /**
   * Fetch auto-generated reorder requests from the AI pipeline.
   * @param {Object} params - { hours }
   */
  getAutoReorders: async (params = {}) => {
    try {
      const response = await api.get("/forecasts/auto-reorders", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching auto-reorders:", error);
      throw error;
    }
  },
};

export default forecastService;
