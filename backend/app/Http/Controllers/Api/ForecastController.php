<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ForecastDemand;
use App\Models\ForecastRisk;
use App\Models\Hospital;
use App\Models\Resource;
use Illuminate\Http\Request;

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

        // High-risk items in the next window
        $highRisk = ForecastRisk::latestRun()
            ->nextHours($hours)
            ->highRisk()
            ->with(['hospital:id,name', 'resource:id,name,category'])
            ->orderBy('risk_prob', 'desc')
            ->limit(20)
            ->get();

        // Aggregate demand by resource
        $demandByResource = ForecastDemand::latestRun()
            ->nextHours($hours)
            ->selectRaw('resource_id, SUM(yhat) as total_demand')
            ->groupBy('resource_id')
            ->orderByDesc('total_demand')
            ->limit(10)
            ->with('resource:id,name,category,unit')
            ->get();

        // Overall risk distribution
        $riskDistribution = ForecastRisk::latestRun()
            ->nextHours($hours)
            ->selectRaw("risk_level, COUNT(*) as count")
            ->groupBy('risk_level')
            ->pluck('count', 'risk_level');

        return response()->json([
            'high_risk_items'    => $highRisk,
            'top_demand'         => $demandByResource,
            'risk_distribution'  => $riskDistribution,
            'meta' => [
                'horizon_hours' => $hours,
                'generated_at'  => ForecastRisk::max('generated_at'),
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
}
