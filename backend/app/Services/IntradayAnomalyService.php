<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\StockMovement;
use App\Models\Hospital;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

/**
 * IntradayAnomalyService — Epic 4
 *
 * Event-driven anomaly detector that compares real-time hourly
 * consumption against the forecasted depletion curve.
 *
 * NOT a scheduled batch job — invoked on every stock movement (out)
 * via the StockMovement observer or explicitly by controllers.
 *
 * Algorithm:
 *   z = (actual_hourly_consumption − forecast_yhat) / σ_historical
 *   If z > 1.5  → WARNING  → trigger emergency re-forecast
 *   If z > 2.5  → CRITICAL → trigger re-forecast + dispatch alert
 */
class IntradayAnomalyService
{
    /** Z-score threshold for anomaly detection */
    protected float $zThreshold;

    /** Z-score threshold for critical classification */
    protected float $criticalZ;

    /** Hours of history to compute σ */
    protected int $lookbackHours;

    /** Floor for σ to prevent division by zero */
    protected float $minStd;

    public function __construct()
    {
        $this->zThreshold   = (float) config('services.forecasting.anomaly_z_threshold', 1.5);
        $this->criticalZ    = (float) config('services.forecasting.anomaly_critical_z', 2.5);
        $this->lookbackHours = (int) config('services.forecasting.anomaly_lookback_hours', 168);
        $this->minStd       = 0.1;
    }

    // ── Primary entry point ─────────────────────────────────

    /**
     * Check whether the current hour's consumption for a given
     * resource at a hospital constitutes an anomaly.
     *
     * This is designed to be called from StockMovementObserver::created()
     * whenever a movement_type == 'out' is recorded.
     *
     * @return array{
     *   is_anomaly: bool,
     *   severity: string,
     *   z_score: float,
     *   actual: float,
     *   expected: float,
     *   sigma: float,
     *   recommend_reforecast: bool,
     *   details: string,
     * }
     */
    public function checkResource(int $hospitalId, int $resourceId): array
    {
        $now = Carbon::now()->startOfHour();

        // 1. Actual consumption this hour
        $actual = $this->getHourlyConsumption($hospitalId, $resourceId, $now);

        // 2. Expected consumption from the latest forecast
        $expected = $this->getForecastedDemand($hospitalId, $resourceId, $now);

        // 3. Historical σ
        $sigma = $this->getHistoricalStd($hospitalId, $resourceId, $now);

        // 4. Z-score
        $z = $sigma > 0 ? ($actual - $expected) / $sigma : 0.0;

        $isAnomaly = $z > $this->zThreshold;
        $severity  = $this->classifySeverity($z);

        $details = '';
        if ($isAnomaly) {
            $details = sprintf(
                'Consumption %.1f exceeds forecast %.1f by %.2fσ (threshold %.1fσ)',
                $actual,
                $expected,
                $z,
                $this->zThreshold,
            );
            if ($severity === 'critical') {
                $details .= ' — CRITICAL, escalate to dispatch';
            }
        }

        $result = [
            'hospital_id'         => $hospitalId,
            'resource_id'         => $resourceId,
            'hour'                => $now->toIso8601String(),
            'actual'              => round($actual, 4),
            'expected'            => round($expected, 4),
            'sigma'               => round($sigma, 4),
            'z_score'             => round($z, 4),
            'is_anomaly'          => $isAnomaly,
            'severity'            => $severity,
            'recommend_reforecast' => $isAnomaly,
            'details'             => $details,
        ];

        // Side effects — only fire when anomaly detected
        if ($isAnomaly) {
            $this->recordAnomalyAlert($result);
            $this->triggerReforecast($hospitalId, $resourceId, $severity);
        }

        return $result;
    }

    // ── Batch check for a whole hospital ────────────────────

    /**
     * Check all resources at a hospital for intraday anomalies.
     *
     * @return array<int, array> Keyed by resource_id
     */
    public function checkHospital(int $hospitalId): array
    {
        $resources = Resource::where('hospital_id', $hospitalId)
            ->where('status', '!=', 'inactive')
            ->pluck('id');

        $results = [];
        foreach ($resources as $resourceId) {
            $result = $this->checkResource($hospitalId, $resourceId);
            $results[$resourceId] = $result;
        }

        return $results;
    }

    /**
     * Return only the anomalies from a hospital-wide check.
     */
    public function getAnomalies(int $hospitalId): array
    {
        $all = $this->checkHospital($hospitalId);
        return array_filter($all, fn ($r) => $r['is_anomaly']);
    }

    // ── Data retrieval helpers ──────────────────────────────

    /**
     * Sum of outflow quantities for the given hour slot.
     */
    protected function getHourlyConsumption(int $hospitalId, int $resourceId, Carbon $hour): float
    {
        $start = $hour->copy();
        $end   = $hour->copy()->addHour();

        return (float) StockMovement::where('hospital_id', $hospitalId)
            ->where('resource_id', $resourceId)
            ->where('movement_type', 'out')
            ->whereBetween('created_at', [$start, $end])
            ->sum('quantity');
    }

    /**
     * Get the forecasted yhat for this hour from forecast_demand_hourly.
     * Falls back to the resource's avg daily usage / 24 if no forecast exists.
     */
    protected function getForecastedDemand(int $hospitalId, int $resourceId, Carbon $hour): float
    {
        // Try the most recent forecast row for this hour slot
        $forecast = DB::table('forecast_demand_hourly')
            ->where('hospital_id', $hospitalId)
            ->where('resource_id', $resourceId)
            ->where('forecast_time', '>=', $hour)
            ->where('forecast_time', '<', $hour->copy()->addHour())
            ->orderByDesc('generated_at')
            ->value('yhat');

        if ($forecast !== null) {
            return (float) $forecast;
        }

        // Fallback: average daily usage / 24
        $resource = Resource::find($resourceId);
        if ($resource) {
            $dailyUsage = $resource->resilience_config?->normal_daily_usage ?? 0;
            return round($dailyUsage / 24, 4);
        }

        return 0.0;
    }

    /**
     * Compute the standard deviation of hourly outflow for the (hospital, resource)
     * over the lookback window.  Cached for 15 min to avoid repeated queries.
     */
    protected function getHistoricalStd(int $hospitalId, int $resourceId, Carbon $now): float
    {
        $cacheKey = "anomaly_std:{$hospitalId}:{$resourceId}";

        return (float) Cache::remember($cacheKey, now()->addMinutes(15), function () use ($hospitalId, $resourceId, $now) {
            $cutoff = $now->copy()->subHours($this->lookbackHours);

            // Get hourly sums over the lookback window
            $hourlySums = StockMovement::where('hospital_id', $hospitalId)
                ->where('resource_id', $resourceId)
                ->where('movement_type', 'out')
                ->where('created_at', '>=', $cutoff)
                ->where('created_at', '<', $now)
                ->selectRaw("DATE_TRUNC('hour', created_at) as hour_slot, SUM(quantity) as consumption")
                ->groupBy('hour_slot')
                ->pluck('consumption')
                ->toArray();

            if (count($hourlySums) < 2) {
                return $this->minStd;
            }

            $values = array_map('floatval', $hourlySums);
            $mean   = array_sum($values) / count($values);
            $sqDiff = array_map(fn ($v) => pow($v - $mean, 2), $values);
            $variance = array_sum($sqDiff) / (count($values) - 1); // sample std

            return max(sqrt($variance), $this->minStd);
        });
    }

    // ── Classification ──────────────────────────────────────

    protected function classifySeverity(float $z): string
    {
        if ($z >= $this->criticalZ) {
            return 'critical';
        }
        if ($z >= $this->zThreshold) {
            return 'warning';
        }
        return 'normal';
    }

    // ── Side effects ────────────────────────────────────────

    /**
     * Persist an anomaly alert to the DB for audit trail / dashboard.
     */
    protected function recordAnomalyAlert(array $result): void
    {
        try {
            DB::table('anomaly_alerts')->insert([
                'hospital_id'         => $result['hospital_id'],
                'resource_id'         => $result['resource_id'],
                'detected_at'         => $result['hour'],
                'z_score'             => $result['z_score'],
                'actual_consumption'  => $result['actual'],
                'expected_consumption' => $result['expected'],
                'historical_std'      => $result['sigma'],
                'severity'            => $result['severity'],
                'details'             => $result['details'],
                'resolved'            => false,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('[IntradayAnomaly] Failed to record alert', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Trigger an emergency re-forecast via the forecasting microservice.
     *
     * For *warning* severity: request a targeted re-forecast for this
     * hospital + resource.
     * For *critical* severity: also broadcast a real-time event so the
     * frontend can alert dispatch operators.
     */
    protected function triggerReforecast(int $hospitalId, int $resourceId, string $severity): void
    {
        Log::info('[IntradayAnomaly] Anomaly detected — triggering re-forecast', [
            'hospital_id' => $hospitalId,
            'resource_id' => $resourceId,
            'severity'    => $severity,
        ]);

        // Request emergency pipeline run via ForecastingClient
        try {
            $client = app(ForecastingClient::class);
            if ($client->isConfigured() && $client->isAvailable()) {
                $client->runPipeline('production', 24); // short horizon for speed
            }
        } catch (\Exception $e) {
            Log::warning('[IntradayAnomaly] Re-forecast trigger failed', [
                'error' => $e->getMessage(),
            ]);
        }

        // For critical anomalies, broadcast real-time event
        if ($severity === 'critical') {
            try {
                event(new \App\Events\AnomalyDetected(
                    $hospitalId,
                    $resourceId,
                    $severity,
                ));
            } catch (\Exception $e) {
                // Event class may not exist yet — log and continue
                Log::warning('[IntradayAnomaly] Could not broadcast event', [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    // ── Getters for config (useful in tests) ────────────────

    public function getZThreshold(): float
    {
        return $this->zThreshold;
    }

    public function getCriticalZ(): float
    {
        return $this->criticalZ;
    }

    public function getLookbackHours(): int
    {
        return $this->lookbackHours;
    }
}
