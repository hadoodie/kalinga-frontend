/**
 * Shared demo/fallback data for all AI Forecast dashboard components.
 *
 * When the backend API is unavailable, every component falls back to this
 * single source of truth so hospitals, resources, risk distributions,
 * and numbers are perfectly consistent across all cards.
 *
 * Data mirrors what the Python pipeline produces with the 12-hospital,
 * 20-resource, 180-day synthetic generator.
 */

// ── Hospitals ────────────────────────────────────────────────
export const DEMO_HOSPITALS = [
  { id: 1,  name: "Quirino Memorial Medical Center" },
  { id: 2,  name: "East Avenue Medical Center" },
  { id: 3,  name: "Jose Reyes Memorial Medical Center" },
  { id: 4,  name: "San Lazaro Hospital" },
  { id: 5,  name: "Tondo Medical Center" },
  { id: 6,  name: "Rizal Medical Center" },
  { id: 7,  name: "Dr. Jose Fabella Memorial Hospital" },
  { id: 8,  name: "National Children's Hospital" },
  { id: 9,  name: "Ospital ng Makati" },
  { id: 10, name: "Caloocan City Medical Center" },
  { id: 11, name: "Las Piñas General Hospital" },
  { id: 12, name: "Amang Rodriguez Memorial Medical Center" },
];

// ── Resources ────────────────────────────────────────────────
export const DEMO_RESOURCES = [
  { id: 1,  name: "Whole Blood (Type O-)",    category: "blood_products" },
  { id: 2,  name: "Whole Blood (Type A+)",    category: "blood_products" },
  { id: 3,  name: "Packed RBC",               category: "blood_products" },
  { id: 5,  name: "Normal Saline IV 1L",      category: "pharmaceuticals" },
  { id: 6,  name: "Paracetamol 500mg",        category: "pharmaceuticals" },
  { id: 9,  name: "Tetanus Toxoid Vaccine",   category: "pharmaceuticals" },
  { id: 10, name: "Surgical Gloves (M)",      category: "medical_supplies" },
  { id: 12, name: "Syringes 10ml",            category: "medical_supplies" },
  { id: 13, name: "Face Masks N95",           category: "medical_supplies" },
  { id: 15, name: "Oxygen Tanks (10L)",       category: "medical_equipment" },
  { id: 18, name: "Emergency Trauma Kit",     category: "emergency" },
  { id: 20, name: "Oral Rehydration Salts",   category: "emergency" },
];

// ── Risk distribution (matches pipeline output) ──────────────
export const DEMO_RISK_DISTRIBUTION = {
  low: 8064,
  medium: 816,
  high: 912,
  critical: 1728,
};

export const DEMO_TOTAL_PREDICTIONS = 11520;

// ── Top high-risk items ──────────────────────────────────────
export const DEMO_HIGH_RISK_ITEMS = [
  {
    hospital_id: 5,  resource_id: 1,
    hospital: { id: 5,  name: "Tondo Medical Center" },
    resource: { id: 1,  name: "Whole Blood (Type O-)", category: "blood_products" },
    risk_prob: 0.92, risk_level: "critical", days_until_stockout: 1.2,
    projected_stock: 3, risk_factors: { low_stock: "Stock at 8% of minimum", low_survival: "Only 14h survival" },
  },
  {
    hospital_id: 10, resource_id: 18,
    hospital: { id: 10, name: "Caloocan City Medical Center" },
    resource: { id: 18, name: "Emergency Trauma Kit", category: "emergency" },
    risk_prob: 0.88, risk_level: "critical", days_until_stockout: 0.8,
    projected_stock: 1, risk_factors: { low_stock: "Stock at 5% of minimum", incidents: "1 active incidents" },
  },
  {
    hospital_id: 4,  resource_id: 5,
    hospital: { id: 4,  name: "San Lazaro Hospital" },
    resource: { id: 5,  name: "Normal Saline IV 1L", category: "pharmaceuticals" },
    risk_prob: 0.85, risk_level: "critical", days_until_stockout: 2.1,
    projected_stock: 45, risk_factors: { low_stock: "Stock at 12% of minimum" },
  },
  {
    hospital_id: 8,  resource_id: 3,
    hospital: { id: 8,  name: "National Children's Hospital" },
    resource: { id: 3,  name: "Packed RBC", category: "blood_products" },
    risk_prob: 0.79, risk_level: "high", days_until_stockout: 3.4,
    projected_stock: 8, risk_factors: { low_stock: "Stock at 22% of minimum", low_survival: "Only 38h survival" },
  },
  {
    hospital_id: 11, resource_id: 15,
    hospital: { id: 11, name: "Las Piñas General Hospital" },
    resource: { id: 15, name: "Oxygen Tanks (10L)", category: "medical_equipment" },
    risk_prob: 0.76, risk_level: "high", days_until_stockout: 2.8,
    projected_stock: 5, risk_factors: { low_stock: "Stock at 18% of minimum" },
  },
  {
    hospital_id: 12, resource_id: 6,
    hospital: { id: 12, name: "Amang Rodriguez Memorial Medical Center" },
    resource: { id: 6,  name: "Paracetamol 500mg", category: "pharmaceuticals" },
    risk_prob: 0.72, risk_level: "high", days_until_stockout: 4.1,
    projected_stock: 30, risk_factors: { low_stock: "Stock at 25% of minimum" },
  },
  {
    hospital_id: 2,  resource_id: 9,
    hospital: { id: 2,  name: "East Avenue Medical Center" },
    resource: { id: 9,  name: "Tetanus Toxoid Vaccine", category: "pharmaceuticals" },
    risk_prob: 0.68, risk_level: "high", days_until_stockout: 5.2,
    projected_stock: 12, risk_factors: { low_stock: "Stock at 30% of minimum" },
  },
  {
    hospital_id: 3,  resource_id: 13,
    hospital: { id: 3,  name: "Jose Reyes Memorial Medical Center" },
    resource: { id: 13, name: "Face Masks N95", category: "medical_supplies" },
    risk_prob: 0.66, risk_level: "high", days_until_stockout: 5.8,
    projected_stock: 50, risk_factors: { low_stock: "Stock at 32% of minimum" },
  },
];

// ── Hospitals ranked by risk burden ──────────────────────────
export const DEMO_RISK_BY_HOSPITAL = [
  { name: "Tondo Medical Center",              risk_count: 6 },
  { name: "Caloocan City Medical Center",      risk_count: 4 },
  { name: "San Lazaro Hospital",               risk_count: 3 },
  { name: "National Children's Hospital",      risk_count: 3 },
  { name: "Las Piñas General Hospital",        risk_count: 2 },
];

// ── Full risk heatmap data ───────────────────────────────────
export function generateDemoRiskData() {
  // Use seeded-ish pseudorandom for consistency across renders
  const seed = 42;
  let _s = seed;
  const rand = () => { _s = (_s * 16807 + 0) % 2147483647; return _s / 2147483647; };

  const heatmapHospitals = DEMO_HOSPITALS.slice(0, 8);  // first 8 for readability
  const heatmapResources = DEMO_RESOURCES.slice(0, 8);  // first 8 for readability

  const data = [];
  heatmapHospitals.forEach((h) => {
    heatmapResources.forEach((r) => {
      // Make specific pairs high/critical to match DEMO_HIGH_RISK_ITEMS
      const match = DEMO_HIGH_RISK_ITEMS.find(
        (item) => item.hospital_id === h.id && item.resource_id === r.id
      );
      if (match) {
        data.push({
          hospital_id: h.id, resource_id: r.id,
          hospital_name: h.name, resource_name: r.name,
          risk_prob: match.risk_prob, risk_level: match.risk_level,
          projected_stock: match.projected_stock,
          days_until_stockout: match.days_until_stockout,
          risk_factors: match.risk_factors,
        });
        return;
      }
      // Otherwise distribute: ~60% low, 15% medium, 15% high, 10% critical
      const roll = rand();
      let level, prob;
      if (roll < 0.60) {
        level = "low";    prob = 0.05 + rand() * 0.25;
      } else if (roll < 0.75) {
        level = "medium"; prob = 0.36 + rand() * 0.28;
      } else if (roll < 0.90) {
        level = "high";   prob = 0.65 + rand() * 0.19;
      } else {
        level = "critical"; prob = 0.86 + rand() * 0.13;
      }
      data.push({
        hospital_id: h.id, resource_id: r.id,
        hospital_name: h.name, resource_name: r.name,
        risk_prob: prob, risk_level: level,
        projected_stock: Math.floor(rand() * 200),
        days_until_stockout: level === "low" ? 999 : level === "medium" ? 10 + rand() * 10 : 1 + rand() * 6,
        risk_factors: level !== "low" ? { low_stock: `Stock at ${Math.round(prob * 40)}% of minimum` } : {},
      });
    });
  });
  return data;
}

// ── Demo demand chart data ───────────────────────────────────
export function generateDemoDemandData() {
  const data = [];
  const now = new Date();
  for (let i = 0; i < 48; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    const hour = t.getHours();
    // Realistic consumption curve matching the Python generator
    const weights = {
      0: 0.15, 1: 0.10, 2: 0.10, 3: 0.10, 4: 0.12, 5: 0.20,
      6: 0.60, 7: 1.20, 8: 1.60, 9: 1.80, 10: 1.90, 11: 1.85,
      12: 1.50, 13: 1.70, 14: 1.80, 15: 1.60, 16: 1.40, 17: 1.20,
      18: 1.00, 19: 0.80, 20: 0.60, 21: 0.45, 22: 0.30, 23: 0.20,
    };
    const base = (weights[hour] || 1.0) * 2.94; // mean from pipeline
    const noise = (Math.sin(i * 0.7) * 0.3) + (Math.cos(i * 1.3) * 0.2);
    const yhat = Math.max(0.1, base + noise);
    data.push({
      forecast_time: t.toISOString(),
      yhat: +yhat.toFixed(4),
      yhat_lower: +(yhat * 0.65).toFixed(4),
      yhat_upper: +(yhat * 1.45).toFixed(4),
      horizon_h: i + 1,
    });
  }
  return data;
}

// ── Demo auto-reorder requests ───────────────────────────────
export function generateDemoAutoReorders() {
  const now = new Date();
  return DEMO_HIGH_RISK_ITEMS.slice(0, 5).map((item, idx) => ({
    id: 2001 + idx,
    hospital_id: item.hospital_id,
    resource_id: item.resource_id,
    hospital: item.hospital,
    resource: item.resource,
    resource_name: item.resource.name,
    quantity: Math.ceil(item.projected_stock * 3) + 10,
    urgency_level: item.risk_level === "critical" ? "Critical" : "High",
    status: idx === 0 ? "pending" : idx === 1 ? "pending" : idx === 2 ? "approved" : "in_transit",
    reason: `AUTO-REORDER: AI forecasting detected ${item.risk_level === "critical" ? "Critical" : "High"} risk. Risk probability: ${Math.round(item.risk_prob * 100)}%.`,
    meta: {
      source: "ai_auto_reorder",
      risk_prob: item.risk_prob,
      risk_level: item.risk_level,
      days_until_stockout: item.days_until_stockout,
    },
    created_at: new Date(now - (idx + 1) * 2 * 3600000).toISOString(),
  }));
}

// ── Summary endpoint fallback ────────────────────────────────
export function getDemoSummary() {
  return {
    risk_distribution: DEMO_RISK_DISTRIBUTION,
    high_risk_items: DEMO_HIGH_RISK_ITEMS,
    demand_by_resource: [
      { category: "blood_products",    avg_demand: 3.8 },
      { category: "pharmaceuticals",   avg_demand: 4.2 },
      { category: "medical_supplies",  avg_demand: 3.1 },
      { category: "medical_equipment", avg_demand: 1.9 },
      { category: "emergency",         avg_demand: 1.4 },
    ],
    generated_at: new Date().toISOString(),
    meta: {
      horizon_hours: 48,
      model_version: "v0.1",
    },
  };
}
