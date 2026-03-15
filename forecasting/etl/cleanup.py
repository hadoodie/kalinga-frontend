"""
ETL: Cleanup old forecast artifacts.

Removes stale model pickle files, outdated weather cache entries,
and old CSV outputs beyond the configured retention window.
Called from run_forecast.py at the end of each pipeline run.
"""

import json
import time
from pathlib import Path
from forecasting.config import (
    ARTIFACTS_DIR,
    OUTPUT_DIR,
    FORECAST_RETENTION_DAYS,
)

# Retention in seconds for file-based artifacts
RETENTION_SECONDS = FORECAST_RETENTION_DAYS * 86400
# Weather cache entries older than 24h are stale
WEATHER_CACHE_MAX_AGE = 86400


def cleanup_old_artifacts() -> dict:
    """
    Remove stale files from artifacts/ and output/ directories.

    Returns a summary dict: { removed_files: int, removed_cache_entries: int }
    """
    removed_files = 0
    removed_cache_entries = 0
    now = time.time()

    # ── 1. Old model pickle / joblib files ────────────────────
    for pattern in ("*.pkl", "*.joblib", "*.json"):
        for f in ARTIFACTS_DIR.glob(pattern):
            if f.name == "weather_cache.json":
                continue  # handled separately
            try:
                age = now - f.stat().st_mtime
                if age > RETENTION_SECONDS:
                    f.unlink()
                    removed_files += 1
                    print(f"[cleanup] removed artifact: {f.name} (age {age/86400:.0f}d)")
            except Exception as e:
                print(f"[cleanup] error removing {f.name}: {e}")

    # ── 2. Old CSV output files ───────────────────────────────
    for f in OUTPUT_DIR.glob("*.csv"):
        try:
            age = now - f.stat().st_mtime
            if age > RETENTION_SECONDS:
                f.unlink()
                removed_files += 1
                print(f"[cleanup] removed output: {f.name} (age {age/86400:.0f}d)")
        except Exception as e:
            print(f"[cleanup] error removing {f.name}: {e}")

    # ── 3. Prune stale weather cache entries ──────────────────
    cache_file = ARTIFACTS_DIR / "weather_cache.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r") as fh:
                store = json.load(fh)

            keys_to_remove = [
                k for k, v in store.items()
                if (now - v.get("ts", 0)) > WEATHER_CACHE_MAX_AGE
            ]
            for k in keys_to_remove:
                del store[k]
                removed_cache_entries += 1

            with open(cache_file, "w") as fh:
                json.dump(store, fh)

            if keys_to_remove:
                print(f"[cleanup] pruned {len(keys_to_remove)} stale weather cache entries")
        except Exception as e:
            print(f"[cleanup] weather cache prune error: {e}")

    summary = {
        "removed_files": removed_files,
        "removed_cache_entries": removed_cache_entries,
    }
    print(f"[cleanup] done: {summary}")
    return summary
