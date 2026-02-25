<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ForecastDemand;
use App\Models\ForecastRisk;
use App\Models\Hospital;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ForecastController extends Controller
{
    /**
     * GET /api/forecasts/demand
     *
     * Returns hourly demand forecasts.
     * Query params: hospital_id, resource_id, hours (default 48)
     */
    public function demand(Request $request)
    {
        $request->validate([
            'hospital_id' => 'nullable|exists:hospitals,id',
            'resource_id' => 'nullable|exists:resources,id',
            'hours'       => 'nullable|integer|min:1|max:168',
        ]);

        $hours = $request->integer('hours', 48);

        $query = ForecastDemand::latestRun()
            ->nextHours($hours)
            ->with(['hospital:id,name,code', 'resource:id,name,category,unit'])
            ->orderBy('forecast_time');

        if ($request->hospital_id) {
            $query->forHospital($request->hospital_id);
        }
        if ($request->resource_id) {
            $query->forResource($request->resource_id);
        }

        $forecasts = $query->get();

        return response()->json([
            'data'  => $forecasts,
            'meta'  => [
                'count'          => $forecasts->count(),
                'horizon_hours'  => $hours,
                'model_version'  => $forecasts->first()?->model_version ?? 'N/A',
                'generated_at'   => $forecasts->first()?->generated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * GET /api/forecasts/risk
     *
     * Returns hourly stockout risk scores.
     * Query params: hospital_id, resource_id, hours, risk_level
     */
    public function risk(Request $request)
    {
        $request->validate([
            'hospital_id' => 'nullable|exists:hospitals,id',
            'resource_id' => 'nullable|exists:resources,id',
            'hours'       => 'nullable|integer|min:1|max:168',
            'risk_level'  => 'nullable|in:low,medium,high,critical',
        ]);

        $hours = $request->integer('hours', 48);

        $query = ForecastRisk::latestRun()
            ->nextHours($hours)
            ->with(['hospital:id,name,code', 'resource:id,name,category,unit'])
            ->orderBy('risk_prob', 'desc');

        if ($request->hospital_id) {
            $query->forHospital($request->hospital_id);
        }
        if ($request->resource_id) {
            $query->forResource($request->resource_id);
        }
        if ($request->risk_level) {
            $query->where('risk_level', $request->risk_level);
        }

        $risks = $query->get();

        return response()->json([
            'data'  => $risks,
            'meta'  => [
                'count'          => $risks->count(),
                'horizon_hours'  => $hours,
                'high_risk_count' => $risks->whereIn('risk_level', ['high', 'critical'])->count(),
                'model_version'  => $risks->first()?->model_version ?? 'N/A',
                'generated_at'   => $risks->first()?->generated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * GET /api/forecasts/summary
     *
     * Top-level KPI view for the logistics dashboard.
     * Shows: total at-risk items, top 5 critical resources, demand trend.
     */
    public function summary(Request $request)
    {
        $hours = $request->integer('hours', 48);

        // Resolve the latest run timestamp once to avoid repeated subqueries
        $latestRun = ForecastRisk::max('generated_at');

        if (!$latestRun) {
            return response()->json([
                'high_risk_items'   => [],
                'top_demand'        => [],
                'risk_distribution' => [],
                'meta' => [
                    'horizon_hours' => $hours,
                    'generated_at'  => null,
                    'message'       => 'No forecast data available yet. Run the pipeline first.',
                ],
            ]);
        }

        // High-risk items — aggregate by (hospital, resource) to avoid duplicates.
        // Take the worst-case stats per pair: MAX risk_prob, MIN days_until_stockout.
        $highRisk = DB::table('forecast_risk_hourly as fr')
            ->join('hospitals', 'hospitals.id', '=', 'fr.hospital_id')
            ->join('resources', 'resources.id', '=', 'fr.resource_id')
            ->select([
                'fr.hospital_id',
                'fr.resource_id',
                'hospitals.name as hospital_name',
                'resources.name as resource_name',
                'resources.category as resource_category',
                DB::raw('MAX(fr.risk_prob) as risk_prob'),
                DB::raw('MIN(fr.days_until_stockout) as days_until_stockout'),
                DB::raw("(CASE
                    WHEN MAX(fr.risk_prob) >= 0.85 THEN 'critical'
                    WHEN MAX(fr.risk_prob) >= 0.65 THEN 'high'
                    WHEN MAX(fr.risk_prob) >= 0.35 THEN 'medium'
                    ELSE 'low'
                END) as risk_level"),
                DB::raw('MAX(fr.forecast_time) as forecast_time'),
            ])
            ->where('fr.generated_at', $latestRun)
            ->where('fr.forecast_time', '>=', now())
            ->where('fr.forecast_time', '<=', now()->addHours($hours))
            ->whereIn('fr.risk_level', ['high', 'critical'])
            ->groupBy('fr.hospital_id', 'fr.resource_id', 'hospitals.name', 'resources.name', 'resources.category')
            ->orderByDesc('risk_prob')
            ->limit(20)
            ->get();

        // Aggregate demand by resource
        $demandByResource = ForecastDemand::forRun($latestRun)
            ->nextHours($hours)
            ->selectRaw('resource_id, SUM(yhat) as total_demand')
            ->groupBy('resource_id')
            ->orderByDesc('total_demand')
            ->limit(10)
            ->with('resource:id,name,category,unit')
            ->get();

        // Overall risk distribution — also aggregated per (hospital, resource) pair
        // so we count unique items, not hourly row duplicates.
        $riskDistribution = DB::table(
            DB::raw("(
                SELECT fr2.hospital_id, fr2.resource_id,
                       CASE
                           WHEN MAX(fr2.risk_prob) >= 0.85 THEN 'critical'
                           WHEN MAX(fr2.risk_prob) >= 0.65 THEN 'high'
                           WHEN MAX(fr2.risk_prob) >= 0.35 THEN 'medium'
                           ELSE 'low'
                       END as agg_risk_level
                FROM forecast_risk_hourly fr2
                WHERE fr2.generated_at = ?
                  AND fr2.forecast_time >= NOW()
                  AND fr2.forecast_time <= NOW() + INTERVAL '{$hours} hours'
                GROUP BY fr2.hospital_id, fr2.resource_id
            ) as pairs")
        )
            ->addBinding($latestRun, 'select')
            ->selectRaw('agg_risk_level as risk_level, COUNT(*) as count')
            ->groupBy('agg_risk_level')
            ->pluck('count', 'risk_level');

        return response()->json([
            'high_risk_items'    => $highRisk,
            'top_demand'         => $demandByResource,
            'risk_distribution'  => $riskDistribution,
            'meta' => [
                'horizon_hours' => $hours,
                'generated_at'  => $latestRun,
            ],
        ]);
    }

    /**
     * GET /api/forecasts/hospital/{hospital}
     *
     * Per-hospital forecast detail view.
     */
    public function hospitalDetail(Hospital $hospital, Request $request)
    {
        $hours = $request->integer('hours', 48);

        $demand = ForecastDemand::latestRun()
            ->forHospital($hospital->id)
            ->nextHours($hours)
            ->with('resource:id,name,category,unit')
            ->orderBy('forecast_time')
            ->get();

        $risk = ForecastRisk::latestRun()
            ->forHospital($hospital->id)
            ->nextHours($hours)
            ->with('resource:id,name,category,unit')
            ->orderBy('risk_prob', 'desc')
            ->get();

        return response()->json([
            'hospital' => $hospital->only('id', 'name', 'code', 'region'),
            'demand'   => $demand,
            'risk'     => $risk,
            'meta'     => [
                'horizon_hours'   => $hours,
                'critical_count'  => $risk->where('risk_level', 'critical')->count(),
                'high_count'      => $risk->where('risk_level', 'high')->count(),
            ],
        ]);
    }

    /**
     * GET /api/forecasts/narrative
     *
     * AI-generated executive summary of the current forecast.
     */
    public function narrative()
    {
        try {
            $service = app(\App\Services\ForecastNarrativeService::class);
            $result = $service->generateExecutiveSummary();

            return response()->json([
                'success'  => $result['success'],
                'source'   => $result['source'] ?? null,
                'narrative' => $result['text'] ?? null,
                'stats'    => $result['stats'] ?? null,
                'error'    => $result['error'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => 'Failed to generate narrative: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/forecasts/auto-reorders
     *
     * List auto-generated reorder requests from the AI pipeline.
     */
    public function autoReorders(Request $request)
    {
        $hours = $request->integer('hours', 24);

        $requests = \App\Models\Request::where('created_at', '>=', now()->subHours($hours))
            ->whereJsonContains('meta->source', 'ai_auto_reorder')
            ->with(['hospital:id,name', 'resource:id,name,category'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $requests,
            'meta' => [
                'count'       => $requests->count(),
                'window_hours' => $hours,
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    // Health, Trigger, History & Accuracy endpoints
    // ═══════════════════════════════════════════════════════════

    /**
     * GET /api/forecasts/health
     *
     * Pipeline health check — returns freshness, row counts, and model version.
     */
    public function health()
    {
        $latestDemandAt = ForecastDemand::max('generated_at');
        $latestRiskAt   = ForecastRisk::max('generated_at');
        $latestAt       = $latestDemandAt ?? $latestRiskAt;

        $staleThresholdHours = 4; // pipeline runs every 2h; stale = >4h
        $isStale = $latestAt
            ? now()->diffInHours($latestAt) > $staleThresholdHours
            : true;

        return response()->json([
            'status'        => $latestAt ? ($isStale ? 'stale' : 'healthy') : 'no_data',
            'last_run'      => $latestAt,
            'demand_rows'   => ForecastDemand::count(),
            'risk_rows'     => ForecastRisk::count(),
            'model_version' => ForecastDemand::latest('generated_at')->value('model_version') ?? 'N/A',
            'stale'         => $isStale,
            'checked_at'    => now()->toIso8601String(),
        ]);
    }

    /**
     * POST /api/forecasts/trigger
     *
     * Manually trigger the forecast pipeline (admin only).
     * Queues the Artisan command to avoid HTTP timeout.
     */
    public function trigger(Request $request)
    {
        $request->validate([
            'mode'    => 'nullable|in:production,demo',
            'horizon' => 'nullable|integer|min:1|max:168',
        ]);

        $mode    = $request->input('mode', 'production');
        $horizon = $request->integer('horizon', 48);

        // Prevent concurrent manual triggers (cooldown: 5 min)
        $lockKey = 'forecast:manual_trigger_lock';
        if (Cache::has($lockKey)) {
            return response()->json([
                'success' => false,
                'error'   => 'A forecast run was triggered recently. Please wait before trying again.',
            ], 429);
        }

        Cache::put($lockKey, true, now()->addMinutes(5));

        // Dispatch async via queue so we don't block the HTTP request
        try {
            Artisan::queue('forecasts:run', [
                '--mode'         => $mode,
                '--horizon'      => $horizon,
                '--auto-reorder' => true,
                '--narrative'    => true,
            ]);
        } catch (\Exception $e) {
            Cache::forget($lockKey);
            Log::error('Manual forecast trigger failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'success'  => true,
            'message'  => 'Forecast pipeline queued.',
            'mode'     => $mode,
            'horizon'  => $horizon,
        ]);
    }

    /**
     * GET /api/forecasts/history
     *
     * List past forecast generation runs (timestamps + row counts).
     */
    public function history(Request $request)
    {
        $limit = $request->integer('limit', 20);

        $runs = ForecastDemand::selectRaw("
                generated_at,
                model_version,
                COUNT(*) as demand_rows,
                COUNT(DISTINCT hospital_id) as hospitals,
                COUNT(DISTINCT resource_id) as resources
            ")
            ->groupBy('generated_at', 'model_version')
            ->orderByDesc('generated_at')
            ->limit($limit)
            ->get()
            ->map(function ($run) {
                $riskStats = ForecastRisk::where('generated_at', $run->generated_at)
                    ->selectRaw("COUNT(*) as risk_rows, SUM(CASE WHEN risk_level IN ('high','critical') THEN 1 ELSE 0 END) as high_risk")
                    ->first();

                return [
                    'generated_at'   => $run->generated_at,
                    'model_version'  => $run->model_version,
                    'demand_rows'    => (int) $run->demand_rows,
                    'risk_rows'      => (int) ($riskStats->risk_rows ?? 0),
                    'high_risk'      => (int) ($riskStats->high_risk ?? 0),
                    'hospitals'      => (int) $run->hospitals,
                    'resources'      => (int) $run->resources,
                ];
            });

        return response()->json([
            'data' => $runs,
            'meta' => ['count' => $runs->count()],
        ]);
    }

    /**
     * GET /api/forecasts/accuracy
     *
     * Compare past predictions against actual consumption (if available).
     * Returns MAPE / MAE metrics per resource for the given lookback window.
     */
    public function accuracy(Request $request)
    {
        $request->validate([
            'days' => 'nullable|integer|min:1|max:90',
        ]);

        $days   = $request->integer('days', 7);
        $cutoff = now()->subDays($days);

        // Get past demand predictions that are now in the past
        $pastForecasts = ForecastDemand::where('forecast_time', '>=', $cutoff)
            ->where('forecast_time', '<=', now())
            ->selectRaw('
                resource_id,
                DATE(forecast_time) as forecast_date,
                SUM(yhat) as predicted_demand
            ')
            ->groupBy('resource_id', 'forecast_date')
            ->get();

        if ($pastForecasts->isEmpty()) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'days'    => $days,
                    'message' => 'No past forecast data available for accuracy calculation.',
                ],
            ]);
        }

        // Get actual stock movements (outflows) in the same period
        $actuals = \App\Models\StockMovement::where('created_at', '>=', $cutoff)
            ->where('movement_type', 'out')
            ->selectRaw('
                r.id as resource_id,
                DATE(stock_movements.created_at) as movement_date,
                SUM(stock_movements.quantity) as actual_demand
            ')
            ->join('resources as r', 'stock_movements.resource_id', '=', 'r.id')
            ->groupBy('r.id', 'movement_date')
            ->get()
            ->keyBy(fn ($item) => $item->resource_id . '_' . $item->movement_date);

        // Compute metrics
        $metrics = $pastForecasts->groupBy('resource_id')->map(function ($group) use ($actuals) {
            $errors = [];
            foreach ($group as $row) {
                $key = $row->resource_id . '_' . $row->forecast_date;
                if (isset($actuals[$key])) {
                    $predicted = (float) $row->predicted_demand;
                    $actual    = (float) $actuals[$key]->actual_demand;
                    if ($actual > 0) {
                        $errors[] = [
                            'abs_error'     => abs($predicted - $actual),
                            'pct_error'     => abs($predicted - $actual) / $actual * 100,
                        ];
                    }
                }
            }

            if (empty($errors)) {
                return null;
            }

            return [
                'resource_id' => $group->first()->resource_id,
                'data_points' => count($errors),
                'mae'         => round(collect($errors)->avg('abs_error'), 2),
                'mape'        => round(collect($errors)->avg('pct_error'), 2),
            ];
        })->filter()->values();

        return response()->json([
            'data' => $metrics,
            'meta' => [
                'days'        => $days,
                'resources'   => $metrics->count(),
            ],
        ]);
    }
}
