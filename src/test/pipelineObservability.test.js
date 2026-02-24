import { describe, it, expect } from "vitest";

/**
 * P3 smoke tests — validate that the pipeline-health, accuracy,
 * and trigger methods exist on forecastService, and that the two
 * new React components can be imported.
 */

describe("P3 – Pipeline observability smoke tests", () => {
  // ── forecastService: new P3 methods ──────────────────────

  describe("forecastService P3 methods", () => {
    let forecastService;

    // Dynamic import so the test doesn't fail at parse-time
    // if the service file has syntax issues.
    beforeAll(async () => {
      const mod = await import("../services/forecastService");
      forecastService = mod.default;
    });

    it("exposes getHealth method", () => {
      expect(typeof forecastService.getHealth).toBe("function");
    });

    it("exposes getAccuracy method", () => {
      expect(typeof forecastService.getAccuracy).toBe("function");
    });

    it("exposes getHistory method", () => {
      expect(typeof forecastService.getHistory).toBe("function");
    });

    it("exposes triggerRun method", () => {
      expect(typeof forecastService.triggerRun).toBe("function");
    });

    it("has all expected forecast methods (non-regression)", () => {
      const expected = [
        "getDemandForecasts",
        "getRiskForecasts",
        "getHighRiskItems",
        "getSummary",
        "getHospitalDetail",
        "getNarrative",
        "getAutoReorders",
        "getHealth",
        "getAccuracy",
        "getHistory",
        "triggerRun",
        "getRiskColor",
        "formatRiskLevel",
        "getUrgencyScore",
      ];
      for (const method of expected) {
        expect(forecastService).toHaveProperty(method);
      }
    });
  });

  // ── Component imports ──────────────────────────────────────

  describe("PipelineHealthBar component", () => {
    it("can be imported", async () => {
      const mod = await import(
        "../components/logistics/forecast-v2/PipelineHealthBar"
      );
      expect(mod.default).toBeDefined();
    });
  });

  describe("AccuracyPanel component", () => {
    it("can be imported", async () => {
      const mod = await import(
        "../components/logistics/forecast-v2/AccuracyPanel"
      );
      expect(mod.default).toBeDefined();
    });
  });
});
