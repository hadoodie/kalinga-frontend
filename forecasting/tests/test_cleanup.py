"""
Tests for the forecast artifact cleanup module.

Covers file cleanup, weather cache pruning, and retention logic.
"""

import json
import time
import pytest
from pathlib import Path

from forecasting.etl.cleanup import (
    cleanup_old_artifacts,
    RETENTION_SECONDS,
    WEATHER_CACHE_MAX_AGE,
)


@pytest.fixture(autouse=True)
def isolated_dirs(tmp_path, monkeypatch):
    """Redirect ARTIFACTS_DIR and OUTPUT_DIR to temp dirs."""
    artifacts = tmp_path / "artifacts"
    output = tmp_path / "output"
    artifacts.mkdir()
    output.mkdir()
    monkeypatch.setattr("forecasting.etl.cleanup.ARTIFACTS_DIR", artifacts)
    monkeypatch.setattr("forecasting.etl.cleanup.OUTPUT_DIR", output)
    return artifacts, output


def _age_file(path: Path, age_seconds: float):
    """Backdate a file's mtime."""
    import os
    old_time = time.time() - age_seconds
    os.utime(path, (old_time, old_time))


class TestCleanupOldArtifacts:
    def test_removes_old_pkl_files(self, isolated_dirs):
        artifacts, _ = isolated_dirs
        old_pkl = artifacts / "demand_model.pkl"
        old_pkl.write_bytes(b"fake model")
        _age_file(old_pkl, RETENTION_SECONDS + 100)

        result = cleanup_old_artifacts()
        assert not old_pkl.exists()
        assert result["removed_files"] >= 1

    def test_keeps_recent_pkl_files(self, isolated_dirs):
        artifacts, _ = isolated_dirs
        recent_pkl = artifacts / "risk_model.pkl"
        recent_pkl.write_bytes(b"fresh model")

        result = cleanup_old_artifacts()
        assert recent_pkl.exists()
        assert result["removed_files"] == 0

    def test_removes_old_csv_output(self, isolated_dirs):
        _, output = isolated_dirs
        old_csv = output / "forecast_demand.csv"
        old_csv.write_text("id,value\n1,2\n")
        _age_file(old_csv, RETENTION_SECONDS + 100)

        result = cleanup_old_artifacts()
        assert not old_csv.exists()
        assert result["removed_files"] >= 1

    def test_keeps_recent_csv_output(self, isolated_dirs):
        _, output = isolated_dirs
        fresh_csv = output / "forecast_risk.csv"
        fresh_csv.write_text("id,value\n1,2\n")

        result = cleanup_old_artifacts()
        assert fresh_csv.exists()

    def test_prunes_stale_weather_cache_entries(self, isolated_dirs):
        artifacts, _ = isolated_dirs
        cache_file = artifacts / "weather_cache.json"
        store = {
            "fresh_key": {"ts": time.time(), "data": {"temp": [25]}},
            "stale_key": {"ts": time.time() - WEATHER_CACHE_MAX_AGE - 100, "data": {"temp": [20]}},
        }
        cache_file.write_text(json.dumps(store))

        result = cleanup_old_artifacts()
        assert result["removed_cache_entries"] == 1

        with open(cache_file) as f:
            remaining = json.load(f)
        assert "fresh_key" in remaining
        assert "stale_key" not in remaining

    def test_does_not_delete_weather_cache_file_itself(self, isolated_dirs):
        artifacts, _ = isolated_dirs
        cache_file = artifacts / "weather_cache.json"
        cache_file.write_text("{}")
        _age_file(cache_file, RETENTION_SECONDS + 100)

        cleanup_old_artifacts()
        # weather_cache.json should be skipped by the artifact glob
        assert cache_file.exists()

    def test_handles_empty_directories(self, isolated_dirs):
        result = cleanup_old_artifacts()
        assert result["removed_files"] == 0
        assert result["removed_cache_entries"] == 0

    def test_handles_missing_cache_file(self, isolated_dirs):
        # No weather_cache.json exists — should not crash
        result = cleanup_old_artifacts()
        assert result["removed_cache_entries"] == 0
