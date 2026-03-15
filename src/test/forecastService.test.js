import { describe, it, expect } from "vitest";
import forecastService from "../services/forecastService";

describe("forecastService utilities", () => {
  describe("getRiskColor", () => {
    it("returns correct class for each risk level", () => {
      expect(forecastService.getRiskColor("low")).toContain("green");
      expect(forecastService.getRiskColor("medium")).toContain("yellow");
      expect(forecastService.getRiskColor("high")).toContain("orange");
      expect(forecastService.getRiskColor("critical")).toContain("red");
    });

    it("defaults to low for unknown level", () => {
      expect(forecastService.getRiskColor("unknown")).toContain("green");
    });
  });

  describe("formatRiskLevel", () => {
    it("capitalizes the level", () => {
      expect(forecastService.formatRiskLevel("critical")).toBe("Critical");
      expect(forecastService.formatRiskLevel("low")).toBe("Low");
    });

    it("handles null/undefined gracefully", () => {
      expect(forecastService.formatRiskLevel(null)).toBe("Low");
      expect(forecastService.formatRiskLevel(undefined)).toBe("Low");
    });
  });

  describe("getUrgencyScore", () => {
    it("returns higher score for critical items", () => {
      const critical = { risk_prob: 0.95, days_until_stockout: 0.5 };
      const low = { risk_prob: 0.1, days_until_stockout: 30 };
      expect(forecastService.getUrgencyScore(critical)).toBeGreaterThan(
        forecastService.getUrgencyScore(low),
      );
    });

    it("clamps score between 0-100", () => {
      const score = forecastService.getUrgencyScore({
        risk_prob: 1,
        days_until_stockout: 0,
      });
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it("handles missing fields", () => {
      const score = forecastService.getUrgencyScore({});
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});
