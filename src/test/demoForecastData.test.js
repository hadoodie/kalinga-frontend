import { describe, it, expect } from "vitest";
import {
  DEMO_HOSPITALS,
  DEMO_RESOURCES,
  DEMO_HIGH_RISK_ITEMS,
  DEMO_RISK_DISTRIBUTION,
  generateDemoRiskData,
  generateDemoDemandData,
  getDemoSummary,
} from "../components/logistics/demoForecastData";

describe("demoForecastData", () => {
  it("exports 12 demo hospitals", () => {
    expect(DEMO_HOSPITALS).toHaveLength(12);
    DEMO_HOSPITALS.forEach((h) => {
      expect(h).toHaveProperty("id");
      expect(h).toHaveProperty("name");
    });
  });

  it("exports demo resources with categories", () => {
    expect(DEMO_RESOURCES.length).toBeGreaterThan(0);
    DEMO_RESOURCES.forEach((r) => {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("category");
    });
  });

  it("high risk items have hospital and resource objects", () => {
    DEMO_HIGH_RISK_ITEMS.forEach((item) => {
      expect(item.hospital).toBeDefined();
      expect(item.hospital.name).toBeTruthy();
      expect(item.resource).toBeDefined();
      expect(item.resource.name).toBeTruthy();
      expect(item.risk_prob).toBeGreaterThan(0);
      expect(item.risk_level).toMatch(/high|critical/);
    });
  });

  it("risk distribution sums to a positive number", () => {
    const total = Object.values(DEMO_RISK_DISTRIBUTION).reduce(
      (a, b) => a + b,
      0,
    );
    expect(total).toBeGreaterThan(0);
  });

  describe("generateDemoRiskData", () => {
    it("returns an array of risk items with required fields", () => {
      const data = generateDemoRiskData();
      expect(data.length).toBeGreaterThan(0);
      data.forEach((d) => {
        expect(d).toHaveProperty("hospital_id");
        expect(d).toHaveProperty("resource_id");
        expect(d).toHaveProperty("hospital_name");
        expect(d).toHaveProperty("resource_name");
        expect(d).toHaveProperty("risk_prob");
        expect(d).toHaveProperty("risk_level");
      });
    });

    it("produces deterministic output (seeded random)", () => {
      const run1 = generateDemoRiskData();
      const run2 = generateDemoRiskData();
      expect(run1).toEqual(run2);
    });
  });

  describe("generateDemoDemandData", () => {
    it("returns 48 hourly data points", () => {
      const data = generateDemoDemandData();
      expect(data).toHaveLength(48);
    });

    it("each point has yhat, yhat_lower, yhat_upper, horizon_h", () => {
      const data = generateDemoDemandData();
      data.forEach((d) => {
        expect(d.yhat).toBeGreaterThan(0);
        expect(d.yhat_lower).toBeDefined();
        expect(d.yhat_upper).toBeDefined();
        expect(d.horizon_h).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("getDemoSummary", () => {
    it("returns expected shape", () => {
      const s = getDemoSummary();
      expect(s).toHaveProperty("risk_distribution");
      expect(s).toHaveProperty("high_risk_items");
      expect(s.high_risk_items.length).toBeGreaterThan(0);
      expect(s).toHaveProperty("generated_at");
    });
  });
});
