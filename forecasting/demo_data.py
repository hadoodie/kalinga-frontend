"""
Kalinga Synthetic Data Generator — Realistic Philippine Hospital Simulation.

Generates ~180 days of rich, realistic data that mirrors the Kalinga DB schema.
Includes:
  - 12 real DOH hospitals across Metro Manila & nearby provinces
  - 20 medical resources across 5 categories
  - Seasonal typhoon patterns (Jun-Nov peak), holiday surges, weekend dips
  - Correlated multi-hospital surge events (typhoon hits = all nearby spike)
  - Deliberate stockout scenarios so the risk model flags high/critical
  - Realistic supply chain delays (restocking gaps, delayed deliveries)
  - Road blockades correlated with active incidents
  - ~400k+ stock movement rows for meaningful ML training data
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta


# ══════════════════════════════════════════════════════════════
# HOSPITALS — real DOH retained hospitals + LGU hospitals
# ══════════════════════════════════════════════════════════════
HOSPITALS = [
    # DOH-Retained (National)
    {"id": 1,  "name": "Quirino Memorial Medical Center",         "lat": 14.5613, "lon": 121.0014, "bed_cap": 500, "tier": "tertiary"},
    {"id": 2,  "name": "East Avenue Medical Center",              "lat": 14.6370, "lon": 121.0437, "bed_cap": 550, "tier": "tertiary"},
    {"id": 3,  "name": "Jose Reyes Memorial Medical Center",      "lat": 14.6085, "lon": 120.9837, "bed_cap": 400, "tier": "tertiary"},
    {"id": 4,  "name": "San Lazaro Hospital",                     "lat": 14.6163, "lon": 120.9785, "bed_cap": 500, "tier": "tertiary"},
    {"id": 5,  "name": "Tondo Medical Center",                    "lat": 14.6152, "lon": 120.9653, "bed_cap": 200, "tier": "secondary"},
    {"id": 6,  "name": "Rizal Medical Center",                    "lat": 14.5356, "lon": 121.0678, "bed_cap": 600, "tier": "tertiary"},
    {"id": 7,  "name": "Dr. Jose Fabella Memorial Hospital",      "lat": 14.5990, "lon": 120.9840, "bed_cap": 350, "tier": "specialty"},
    {"id": 8,  "name": "National Children's Hospital",            "lat": 14.5770, "lon": 120.9883, "bed_cap": 250, "tier": "specialty"},
    # LGU / Regional
    {"id": 9,  "name": "Ospital ng Makati",                       "lat": 14.5510, "lon": 121.0195, "bed_cap": 300, "tier": "secondary"},
    {"id": 10, "name": "Caloocan City Medical Center",            "lat": 14.6532, "lon": 120.9720, "bed_cap": 150, "tier": "primary"},
    {"id": 11, "name": "Las Piñas General Hospital",              "lat": 14.4445, "lon": 120.9930, "bed_cap": 200, "tier": "secondary"},
    {"id": 12, "name": "Amang Rodriguez Memorial Medical Center", "lat": 14.6195, "lon": 121.0959, "bed_cap": 350, "tier": "tertiary"},
]

# ══════════════════════════════════════════════════════════════
# RESOURCES — 20 items across 5 categories
# ══════════════════════════════════════════════════════════════
RESOURCES = [
    # Blood products
    {"id": 1,  "name": "Whole Blood (Type O-)", "sku": "BB-ON-001", "category": "blood_products",   "unit": "units",  "daily_base": 15, "shelf_days": 35,  "cold_chain": True},
    {"id": 2,  "name": "Whole Blood (Type A+)", "sku": "BB-AP-001", "category": "blood_products",   "unit": "units",  "daily_base": 10, "shelf_days": 35,  "cold_chain": True},
    {"id": 3,  "name": "Packed RBC",            "sku": "BB-PR-001", "category": "blood_products",   "unit": "units",  "daily_base": 8,  "shelf_days": 42,  "cold_chain": True},
    {"id": 4,  "name": "Fresh Frozen Plasma",   "sku": "BB-FP-001", "category": "blood_products",   "unit": "units",  "daily_base": 5,  "shelf_days": 365, "cold_chain": True},
    # Pharmaceuticals
    {"id": 5,  "name": "Normal Saline IV 1L",   "sku": "PH-NS-001", "category": "pharmaceuticals",  "unit": "bags",   "daily_base": 50, "shelf_days": 730, "cold_chain": False},
    {"id": 6,  "name": "Paracetamol 500mg",     "sku": "PH-PA-001", "category": "pharmaceuticals",  "unit": "strips", "daily_base": 60, "shelf_days": 730, "cold_chain": False},
    {"id": 7,  "name": "Amoxicillin 500mg",     "sku": "PH-AM-001", "category": "pharmaceuticals",  "unit": "strips", "daily_base": 30, "shelf_days": 730, "cold_chain": False},
    {"id": 8,  "name": "Metformin 500mg",       "sku": "PH-MF-001", "category": "pharmaceuticals",  "unit": "strips", "daily_base": 25, "shelf_days": 730, "cold_chain": False},
    {"id": 9,  "name": "Tetanus Toxoid Vaccine", "sku": "PH-TT-001", "category": "pharmaceuticals", "unit": "vials",  "daily_base": 12, "shelf_days": 365, "cold_chain": True},
    # Medical Supplies
    {"id": 10, "name": "Surgical Gloves (M)",    "sku": "MS-SG-001", "category": "medical_supplies", "unit": "boxes",  "daily_base": 30, "shelf_days": 1825, "cold_chain": False},
    {"id": 11, "name": "Gauze Rolls (sterile)",  "sku": "MS-GR-001", "category": "medical_supplies", "unit": "rolls",  "daily_base": 25, "shelf_days": 1825, "cold_chain": False},
    {"id": 12, "name": "Syringes 10ml",          "sku": "MS-SY-010", "category": "medical_supplies", "unit": "pcs",    "daily_base": 80, "shelf_days": 1825, "cold_chain": False},
    {"id": 13, "name": "Face Masks N95",         "sku": "MS-FM-001", "category": "medical_supplies", "unit": "pcs",    "daily_base": 100,"shelf_days": 1825, "cold_chain": False},
    {"id": 14, "name": "Suture Kit (nylon)",     "sku": "MS-SK-001", "category": "medical_supplies", "unit": "kits",   "daily_base": 8,  "shelf_days": 1825, "cold_chain": False},
    # Medical Equipment (reusable, tracked as inventory)
    {"id": 15, "name": "Oxygen Tanks (10L)",     "sku": "ME-OX-010", "category": "medical_equipment","unit": "tanks",  "daily_base": 8,  "shelf_days": None, "cold_chain": False},
    {"id": 16, "name": "Pulse Oximeters",        "sku": "ME-PO-001", "category": "medical_equipment","unit": "units",  "daily_base": 3,  "shelf_days": None, "cold_chain": False},
    {"id": 17, "name": "Nebulizer Kits",         "sku": "ME-NB-001", "category": "medical_equipment","unit": "kits",   "daily_base": 5,  "shelf_days": None, "cold_chain": False},
    # Emergency / Disaster
    {"id": 18, "name": "Emergency Trauma Kit",   "sku": "EM-TK-001", "category": "emergency",       "unit": "kits",   "daily_base": 2,  "shelf_days": 365, "cold_chain": False},
    {"id": 19, "name": "Body Bags",              "sku": "EM-BB-001", "category": "emergency",       "unit": "pcs",    "daily_base": 1,  "shelf_days": None, "cold_chain": False},
    {"id": 20, "name": "Oral Rehydration Salts", "sku": "EM-OR-001", "category": "emergency",       "unit": "sachets","daily_base": 40, "shelf_days": 730, "cold_chain": False},
]

INCIDENT_TYPES = [
    "typhoon", "tropical_storm", "earthquake", "flood",
    "fire", "mass_casualty", "disease_outbreak", "chemical_spill",
]

# Philippine typhoon season: Jun–Nov peaks, with named storm events
TYPHOON_EVENTS = [
    # (day_offset_from_start, duration_days, severity, name)
    (15,  3, "high",     "Tropical Storm Aghon"),
    (42,  5, "critical", "Typhoon Butchoy"),
    (78,  2, "medium",   "Tropical Depression Carina"),
    (105, 7, "critical", "Super Typhoon Dindo"),
    (130, 4, "high",     "Typhoon Enteng"),
    (155, 3, "medium",   "Tropical Storm Ferdie"),
]

# ══════════════════════════════════════════════════════════════
# GENERATOR FUNCTIONS
# ══════════════════════════════════════════════════════════════

def _hour_weight(hour: int) -> float:
    """Realistic hospital consumption curve: peaks at shift changes + daytime."""
    weights = {
        0: 0.15, 1: 0.10, 2: 0.10, 3: 0.10, 4: 0.12, 5: 0.20,
        6: 0.60, 7: 1.20, 8: 1.60, 9: 1.80, 10: 1.90, 11: 1.85,
        12: 1.50, 13: 1.70, 14: 1.80, 15: 1.60, 16: 1.40, 17: 1.20,
        18: 1.00, 19: 0.80, 20: 0.60, 21: 0.45, 22: 0.30, 23: 0.20,
    }
    return weights.get(hour, 1.0)


def _dow_weight(dow: int) -> float:
    """Day-of-week multiplier. Mon-Fri higher, Sat/Sun dip, Mon spike (backlog)."""
    weights = {0: 1.25, 1: 1.10, 2: 1.05, 3: 1.05, 4: 1.10, 5: 0.70, 6: 0.65}
    return weights.get(dow, 1.0)


def _seasonal_weight(month: int) -> float:
    """Philippine climate seasonal effect. Typhoon season → higher demand."""
    weights = {
        1: 0.90, 2: 0.85, 3: 0.90, 4: 0.95, 5: 1.00,
        6: 1.10, 7: 1.20, 8: 1.30, 9: 1.35, 10: 1.25, 11: 1.15, 12: 1.00,
    }
    return weights.get(month, 1.0)


def _bed_capacity_scale(bed_cap: int) -> float:
    """Larger hospitals consume more. Scale relative to 300-bed reference."""
    return max(0.5, bed_cap / 300)


def _is_holiday(dt: datetime) -> bool:
    """Philippine public holidays (simplified)."""
    md = (dt.month, dt.day)
    holidays = {
        (1, 1), (2, 25), (4, 9), (4, 10), (5, 1), (6, 12),
        (8, 21), (8, 26), (11, 1), (11, 2), (11, 30), (12, 25),
        (12, 30), (12, 31),
    }
    return md in holidays


def generate_resources(seed=42) -> pd.DataFrame:
    """Generate resource inventory for all hospitals × resources."""
    rng = np.random.default_rng(seed)
    rows = []
    for h in HOSPITALS:
        scale = _bed_capacity_scale(h["bed_cap"])
        for r in RESOURCES:
            scaled_daily = max(1, int(r["daily_base"] * scale))
            min_qty = scaled_daily * 3
            max_qty = scaled_daily * 14

            # Some hospitals deliberately understocked (for risk testing)
            if rng.random() < 0.15:
                current = int(rng.integers(0, max(1, int(min_qty * 0.3))))
                is_critical = True
            elif rng.random() < 0.20:
                current = int(rng.integers(int(min_qty * 0.3), max(2, int(min_qty * 0.8))))
                is_critical = rng.random() > 0.5
            else:
                current = int(rng.integers(int(min_qty * 0.8), max(3, int(max_qty * 1.1))))
                is_critical = rng.random() > 0.7

            rows.append({
                "resource_id": r["id"],
                "resource_name": r["name"],
                "sku": r["sku"],
                "category": r["category"],
                "unit": r["unit"],
                "hospital_id": h["id"],
                "hospital_name": h["name"],
                "latitude": h["lat"],
                "longitude": h["lon"],
                "current_quantity": current,
                "minimum_quantity": min_qty,
                "critical_level": int(min_qty * 0.5),
                "normal_daily_usage": scaled_daily,
                "surge_multiplier": round(rng.uniform(1.0, 1.3), 2),
                "handling_class": "cold_chain" if r["cold_chain"] else rng.choice(["ambient", "ambient", "hazmat"]),
                "is_critical": is_critical,
            })
    return pd.DataFrame(rows)


def generate_stock_movements(resources_df: pd.DataFrame, days_back=180, seed=42) -> pd.DataFrame:
    """
    Generate granular hourly stock movements with realistic patterns:
      - Hour-of-day consumption curve (peaks at 9-14, dips at night)
      - Day-of-week patterns (Mon-Fri higher, weekends dip)
      - Seasonal typhoon effects (Jun-Nov higher demand)
      - Correlated surge events (typhoon → multiple hospitals spike)
      - Restocking happens irregularly (Mon/Wed/Fri mornings + emergency)
      - Occasional supply chain disruptions (delayed restock)
    """
    rng = np.random.default_rng(seed)
    now = datetime.utcnow()
    start = now - timedelta(days=days_back)
    rows = []

    # Pre-compute surge windows from typhoon events
    surge_windows = []
    for day_off, dur, sev, name in TYPHOON_EVENTS:
        s = start + timedelta(days=day_off)
        e = s + timedelta(days=dur)
        mult = {"medium": 1.5, "high": 2.0, "critical": 2.8}[sev]
        surge_windows.append((s, e, mult, name))

    for _, res in resources_df.iterrows():
        base_hourly = res["normal_daily_usage"] / 24
        h_id = res["hospital_id"]
        r_id = res["resource_id"]
        cat = res["category"]

        # Category-specific noise: blood is spiky, pharmaceuticals steadier
        noise_scale = {
            "blood_products": 1.5,
            "pharmaceuticals": 0.8,
            "medical_supplies": 1.0,
            "medical_equipment": 1.2,
            "emergency": 2.0,
        }.get(cat, 1.0)

        for day_offset in range(days_back, 0, -1):
            day_dt = now - timedelta(days=day_offset)
            dow = day_dt.weekday()
            month = day_dt.month

            day_mult = _dow_weight(dow) * _seasonal_weight(month)

            # Holiday effect: lower routine but higher ER
            if _is_holiday(day_dt):
                if cat in ("emergency", "blood_products"):
                    day_mult *= 1.4
                else:
                    day_mult *= 0.6

            # Typhoon surge effect
            for s, e, mult, _ in surge_windows:
                if s <= day_dt <= e:
                    if cat in ("emergency", "blood_products", "pharmaceuticals"):
                        day_mult *= mult
                    else:
                        day_mult *= (1.0 + (mult - 1.0) * 0.5)
                    break

            for hour in range(24):
                ts = day_dt.replace(hour=hour, minute=0, second=0, microsecond=0)
                if ts > now:
                    continue

                hw = _hour_weight(hour)
                jitter = max(0.1, rng.normal(1.0, 0.15 * noise_scale))
                rate = base_hourly * hw * day_mult * jitter

                out_qty = max(0, int(rng.poisson(max(0.01, rate))))
                if out_qty > 0:
                    reason = rng.choice(
                        ["consumption", "patient_use", "emergency", "surgery", "transfer_out"],
                        p=[0.40, 0.30, 0.10, 0.10, 0.10],
                    )
                    rows.append({
                        "hospital_id": h_id, "resource_id": r_id,
                        "quantity": out_qty, "type": "out",
                        "reason": reason, "created_at": ts,
                    })

            # Restocking: Mon/Wed/Fri mornings + random emergency restocks
            if dow in (0, 2, 4) and rng.random() < 0.80:
                restock_hour = int(rng.choice([8, 9, 10]))
                restock_ts = day_dt.replace(hour=restock_hour, minute=0, second=0, microsecond=0)
                if restock_ts <= now:
                    qty = int(res["normal_daily_usage"] * rng.uniform(1.5, 3.0))
                    rows.append({
                        "hospital_id": h_id, "resource_id": r_id,
                        "quantity": qty, "type": "in",
                        "reason": rng.choice(["restock", "delivery", "scheduled_delivery"]),
                        "created_at": restock_ts,
                    })

            # Emergency restock if stock critically low (simulated)
            elif rng.random() < 0.05:
                restock_ts = day_dt.replace(hour=14, minute=0, second=0, microsecond=0)
                if restock_ts <= now:
                    qty = int(res["normal_daily_usage"] * rng.uniform(2.0, 5.0))
                    rows.append({
                        "hospital_id": h_id, "resource_id": r_id,
                        "quantity": qty, "type": "in",
                        "reason": rng.choice(["emergency_restock", "donation", "buffer_release"]),
                        "created_at": restock_ts,
                    })

    return pd.DataFrame(rows)


def generate_requests(days_back=180, seed=42) -> pd.DataFrame:
    """Generate realistic supply requests with volume correlated to incidents."""
    rng = np.random.default_rng(seed)
    now = datetime.utcnow()
    start = now - timedelta(days=days_back)
    statuses = ["pending", "approved", "allocated", "in_transit", "delivered", "rejected", "cancelled"]
    priorities = ["low", "medium", "high", "critical"]
    rows = []

    # Pre-compute surge windows
    surge_windows = []
    for day_off, dur, sev, name in TYPHOON_EVENTS:
        s = start + timedelta(days=day_off)
        e = s + timedelta(days=dur)
        mult = {"medium": 1.8, "high": 3.0, "critical": 5.0}[sev]
        surge_windows.append((s, e, mult))

    for day_offset in range(days_back, 0, -1):
        day_dt = now - timedelta(days=day_offset)

        # Base request rate scales with hospital count × seasonal demand
        base_rate = 15 * _seasonal_weight(day_dt.month) * _dow_weight(day_dt.weekday())

        # Typhoon days get massive request spikes
        for s, e, mult in surge_windows:
            if s <= day_dt <= e:
                base_rate *= mult
                break

        n_requests = max(0, rng.poisson(base_rate))
        for _ in range(n_requests):
            h = rng.choice(HOSPITALS)
            r = rng.choice(RESOURCES)
            ts = day_dt.replace(
                hour=int(rng.integers(6, 22)),
                minute=int(rng.integers(0, 60)),
                second=0, microsecond=0,
            )
            if ts > now:
                continue

            # Older requests more likely delivered; recent ones more likely pending
            age_days = day_offset
            if age_days > 14:
                status_probs = [0.02, 0.03, 0.03, 0.02, 0.82, 0.05, 0.03]
            elif age_days > 3:
                status_probs = [0.05, 0.10, 0.15, 0.15, 0.45, 0.05, 0.05]
            else:
                status_probs = [0.30, 0.25, 0.15, 0.10, 0.10, 0.05, 0.05]

            rows.append({
                "hospital_id": h["id"],
                "resource_id": r["id"],
                "quantity_requested": int(r["daily_base"] * rng.uniform(0.5, 4.0)),
                "status": rng.choice(statuses, p=status_probs),
                "priority": rng.choice(priorities, p=[0.20, 0.35, 0.30, 0.15]),
                "created_at": ts,
            })

    return pd.DataFrame(rows)


def generate_incidents(days_back=180, seed=42) -> pd.DataFrame:
    """Generate incidents including named typhoon events + random emergencies."""
    rng = np.random.default_rng(seed)
    now = datetime.utcnow()
    start = now - timedelta(days=days_back)
    rows = []

    # Named typhoon events (guaranteed)
    for day_off, dur, sev, name in TYPHOON_EVENTS:
        started = start + timedelta(days=day_off, hours=int(rng.integers(0, 12)))
        resolved = started + timedelta(days=dur, hours=int(rng.integers(0, 12)))
        active = resolved > now
        rows.append({
            "type": "typhoon" if "Typhoon" in name else "tropical_storm",
            "severity": sev,
            "description": name,
            "latitude": 14.55 + rng.uniform(-0.15, 0.15),
            "longitude": 120.98 + rng.uniform(-0.15, 0.15),
            "started_at": started,
            "resolved_at": None if active else resolved,
            "status": "active" if active else "resolved",
        })

    # Random incidents (floods, fires, mass casualties, etc.)
    for day_offset in range(days_back, 0, -1):
        day_dt = now - timedelta(days=day_offset)

        # Higher incident chance during typhoon season
        incident_chance = 0.06 * _seasonal_weight(day_dt.month)
        if rng.random() < incident_chance:
            started = day_dt.replace(
                hour=int(rng.integers(0, 24)),
                minute=int(rng.integers(0, 60)),
                second=0, microsecond=0,
            )
            duration_h = int(rng.integers(2, 96))
            resolved = started + timedelta(hours=duration_h)
            active = resolved > now

            rows.append({
                "type": rng.choice(["flood", "fire", "mass_casualty", "disease_outbreak",
                                     "earthquake", "chemical_spill"],
                                    p=[0.30, 0.20, 0.15, 0.15, 0.10, 0.10]),
                "severity": rng.choice(["low", "medium", "high", "critical"],
                                        p=[0.15, 0.40, 0.30, 0.15]),
                "description": None,
                "latitude": 14.55 + rng.uniform(-0.20, 0.20),
                "longitude": 120.98 + rng.uniform(-0.20, 0.20),
                "started_at": started,
                "resolved_at": None if active else resolved,
                "status": "active" if active else "resolved",
            })

    return pd.DataFrame(rows)


def generate_blockades(incidents_df: pd.DataFrame, seed=42) -> pd.DataFrame:
    """Generate road blockades correlated with active incidents."""
    rng = np.random.default_rng(seed)
    now = datetime.utcnow()
    rows = []

    road_names = [
        "EDSA Northbound", "EDSA Southbound", "C5 Road", "Quirino Highway",
        "Aurora Boulevard", "España Boulevard", "Commonwealth Avenue",
        "Marcos Highway", "Ortigas Avenue", "Shaw Boulevard",
        "Taft Avenue", "Roxas Boulevard", "SLEX Northbound",
    ]

    # Active incidents generate blockades
    if not incidents_df.empty:
        active = incidents_df[incidents_df["status"] == "active"]
        for _, inc in active.iterrows():
            if rng.random() < 0.6:  # 60% chance an active incident blocks a road
                rows.append({
                    "road_name": rng.choice(road_names),
                    "latitude": inc["latitude"] + rng.uniform(-0.02, 0.02),
                    "longitude": inc["longitude"] + rng.uniform(-0.02, 0.02),
                    "severity": rng.choice(["partial", "full"], p=[0.6, 0.4]),
                    "status": "active",
                    "started_at": inc["started_at"],
                })

    # Random blockades (construction, accidents)
    for _ in range(int(rng.integers(1, 5))):
        rows.append({
            "road_name": rng.choice(road_names),
            "latitude": 14.55 + rng.uniform(-0.15, 0.15),
            "longitude": 120.98 + rng.uniform(-0.15, 0.15),
            "severity": rng.choice(["partial", "full"], p=[0.7, 0.3]),
            "status": "active",
            "started_at": now - timedelta(hours=int(rng.integers(1, 72))),
        })

    return pd.DataFrame(rows)


def generate_resilience_configs(resources_df: pd.DataFrame, seed=42) -> pd.DataFrame:
    """Generate resilience configs with realistic survival hours based on stock levels."""
    rng = np.random.default_rng(seed)
    rows = []
    seen = set()
    for _, res in resources_df.iterrows():
        key = (res["hospital_id"], res["resource_id"])
        if key in seen:
            continue
        seen.add(key)

        daily = max(1, res["normal_daily_usage"])
        current = res["current_quantity"]
        surge = res["surge_multiplier"]

        # Actual survival hours based on stock / (daily_usage * surge / 24)
        hourly_rate = (daily * surge) / 24
        survival_hours = (current / hourly_rate) if hourly_rate > 0 else 999
        survival_hours = min(survival_hours, 720)  # cap at 30 days

        rows.append({
            "hospital_id": res["hospital_id"],
            "resource_id": res["resource_id"],
            "current_survival_hours": round(survival_hours, 1),
            "target_survival_hours": 168,  # 7 day target
            "reorder_point": int(res["minimum_quantity"] * 1.2),
            "safety_stock": int(res["minimum_quantity"] * 0.5),
        })
    return pd.DataFrame(rows)


def generate_all(days_back=180, seed=42) -> dict:
    """
    Generate a complete set of realistic synthetic data.

    With 12 hospitals × 20 resources × 180 days ≈ 400k+ stock movement rows.
    """
    resources_df = generate_resources(seed=seed)
    incidents = generate_incidents(days_back, seed)
    return {
        "resources": resources_df,
        "stock_movements": generate_stock_movements(resources_df, days_back, seed),
        "requests": generate_requests(days_back=days_back, seed=seed),
        "incidents": incidents,
        "blockades": generate_blockades(incidents, seed),
        "resilience_configs": generate_resilience_configs(resources_df, seed),
    }
