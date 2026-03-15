"""
ETL: Extract data from Kalinga Postgres database.

Pulls the raw tables the forecasting models need:
  - resources (current stock levels)
  - stock_movements (historical in/out)
  - requests (demand signals)
  - incidents (emergency events)
  - road_blockades (route disruptions)
  - hospitals (location + disaster mode)
  - resource_resilience_configs (daily usage rates)
"""

import pandas as pd
from sqlalchemy import create_engine, text
from forecasting.config import DATABASE_URL


def get_engine():
    """Create a SQLAlchemy engine from config."""
    return create_engine(DATABASE_URL, pool_pre_ping=True)


def extract_resources(engine=None) -> pd.DataFrame:
    """Current resource inventory per hospital."""
    engine = engine or get_engine()
    query = """
        SELECT
            r.id            AS resource_id,
            r.hospital_id,
            r.name          AS resource_name,
            r.category,
            r.unit,
            r.quantity       AS current_quantity,
            r.minimum_stock,
            r.is_critical,
            r.expiry_date,
            r.status,
            h.name          AS hospital_name,
            h.latitude,
            h.longitude,
            h.region,
            h.disaster_mode_active
        FROM resources r
        JOIN hospitals h ON r.hospital_id = h.id
        WHERE h.is_active = true
        ORDER BY r.hospital_id, r.id
    """
    return pd.read_sql(text(query), engine)


def extract_stock_movements(engine=None, days_back: int = 90) -> pd.DataFrame:
    """Historical stock movements (last N days)."""
    engine = engine or get_engine()
    query = """
        SELECT
            sm.id,
            sm.resource_id,
            sm.movement_type,
            sm.quantity,
            sm.previous_quantity,
            sm.new_quantity,
            sm.reason,
            sm.created_at,
            r.hospital_id,
            r.name AS resource_name,
            r.category
        FROM stock_movements sm
        JOIN resources r ON sm.resource_id = r.id
        WHERE sm.created_at >= NOW() - MAKE_INTERVAL(days => :days_back)
        ORDER BY sm.created_at
    """
    return pd.read_sql(text(query), engine, params={"days_back": days_back})


def extract_requests(engine=None, days_back: int = 90) -> pd.DataFrame:
    """Resource requests (demand signals)."""
    engine = engine or get_engine()
    query = """
        SELECT
            req.id,
            req.hospital_id,
            req.resource_id,
            req.resource_name,
            req.quantity,
            req.urgency_level,
            req.handling_class,
            req.status,
            req.created_at
        FROM requests req
        WHERE req.created_at >= NOW() - MAKE_INTERVAL(days => :days_back)
        ORDER BY req.created_at
    """
    return pd.read_sql(text(query), engine, params={"days_back": days_back})


def extract_incidents(engine=None, days_back: int = 90) -> pd.DataFrame:
    """Emergency incidents (demand spike signals)."""
    engine = engine or get_engine()
    query = """
        SELECT
            i.id,
            i.type,
            i.status,
            i.latlng,
            i.created_at,
            i.completed_at,
            i.metadata
        FROM incidents i
        WHERE i.created_at >= NOW() - MAKE_INTERVAL(days => :days_back)
        ORDER BY i.created_at
    """
    return pd.read_sql(text(query), engine, params={"days_back": days_back})


def extract_blockades(engine=None) -> pd.DataFrame:
    """Currently active road blockades."""
    engine = engine or get_engine()
    query = """
        SELECT
            id,
            severity,
            status,
            start_lat,
            start_lng,
            reported_at
        FROM road_blockades
        WHERE status = 'active'
    """
    return pd.read_sql(text(query), engine)


def extract_resilience_configs(engine=None) -> pd.DataFrame:
    """Resource resilience configs (daily usage rates + survival hours)."""
    engine = engine or get_engine()
    query = """
        SELECT
            rrc.resource_id,
            rrc.hospital_id,
            rrc.resilience_category,
            rrc.normal_daily_usage,
            rrc.surge_multiplier,
            rrc.current_survival_hours,
            rrc.resilience_status,
            rrc.is_hsi_critical
        FROM resource_resilience_configs rrc
    """
    return pd.read_sql(text(query), engine)


def extract_all(days_back: int = 90) -> dict:
    """Extract all tables in one call. Returns dict of DataFrames."""
    engine = get_engine()
    return {
        "resources":          extract_resources(engine),
        "stock_movements":    extract_stock_movements(engine, days_back),
        "requests":           extract_requests(engine, days_back),
        "incidents":          extract_incidents(engine, days_back),
        "blockades":          extract_blockades(engine),
        "resilience_configs": extract_resilience_configs(engine),
    }
