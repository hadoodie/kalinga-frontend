import { describe, it, expect } from "vitest";
import { ROUTES } from "../config/routes";

/**
 * Integration-level checks for the logistics forecast data flow.
 *
 * These tests validate route wiring, service availability,
 * and data shape contracts without needing a running backend.
 */

describe("Logistics forecast data-flow integration", () => {
  // ── Route Wiring ────────────────────────────────────────────

  describe("ROUTES.LOGISTICS", () => {
    it("has HOSPITAL_FORECAST_DETAIL route with :hospitalId param", () => {
      const route = ROUTES.LOGISTICS.HOSPITAL_FORECAST_DETAIL;
      expect(route).toBeDefined();
      expect(route).toContain(":hospitalId");
      expect(route).toMatch(/^\/logistics\/forecast\/hospital\//);
    });

    it("has DASHBOARD route", () => {
      expect(ROUTES.LOGISTICS.DASHBOARD).toBe("/logistics/dashboard");
    });
  });

  // ── forecastService contract ────────────────────────────────

  describe("forecastService exports", () => {
    it("exposes getHospitalDetail method", async () => {
      const { default: forecastService } =
        await import("../services/forecastService");
      expect(typeof forecastService.getHospitalDetail).toBe("function");
    });

    it("exposes getAutoReorders method", async () => {
      const { default: forecastService } =
        await import("../services/forecastService");
      expect(typeof forecastService.getAutoReorders).toBe("function");
    });

    it("exposes getNarrative method", async () => {
      const { default: forecastService } =
        await import("../services/forecastService");
      expect(typeof forecastService.getNarrative).toBe("function");
    });

    it("exposes getSummary method", async () => {
      const { default: forecastService } =
        await import("../services/forecastService");
      expect(typeof forecastService.getSummary).toBe("function");
    });
  });

  // ── Route path generation ───────────────────────────────────

  describe("Hospital detail route generation", () => {
    it("generates correct path when replacing :hospitalId", () => {
      const path = ROUTES.LOGISTICS.HOSPITAL_FORECAST_DETAIL.replace(
        ":hospitalId",
        "42",
      );
      expect(path).toBe("/logistics/forecast/hospital/42");
    });
  });
});
