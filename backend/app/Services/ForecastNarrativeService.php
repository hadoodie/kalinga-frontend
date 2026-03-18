<?php

namespace App\Services;

use App\Models\ForecastDemand;
use App\Models\ForecastRisk;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ForecastNarrativeService
{
    protected GeminiContextService $gemini;

    public function __construct(GeminiContextService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Generate an executive summary narrative from the latest forecast run.
     *
     * Returns a structured array for the DOH logistics dashboard.
     */
    public function generateExecutiveSummary(?int $hospitalId = null): array
    {
        // ── Gather forecast statistics ────────────────────
        $stats = $this->gatherForecastStats($hospitalId);

        if ($stats['total_demand'] === 0) {
            return [
                'success' => false,
                'error' => 'No forecast data available for narrative',
            ];
        }

        // ── Build the Gemini prompt ─────────────────────────
        $prompt = $this->buildPrompt($stats);

        // ── Call Gemini ─────────────────────────────────────
        if (!$this->gemini->isConfigured()) {
            // Generate a rule-based summary as fallback
            return [
                'success' => true,
                'source' => 'rule_based',
                'text' => $this->ruleFallbackNarrative($stats),
                'stats' => $stats,
            ];
        }

        $response = $this->gemini->generate($prompt, [
            'model' => 'gemini-2.0-flash-lite',
            'max_tokens' => 1024,
            'temperature' => 0.3,
        ]);

        if (!$response['success']) {
            Log::warning('[Narrative] Gemini failed, using fallback', ['error' => $response['error']]);
            return [
                'success' => true,
                'source' => 'rule_based',
                'text' => $this->ruleFallbackNarrative($stats),
                'stats' => $stats,
            ];
        }

        return [
            'success' => true,
            'source' => 'gemini',
            'text' => $response['data']['text'],
            'stats' => $stats,
        ];
    }

    /**
     * Gather all statistics needed for the narrative.
     */
    private function gatherForecastStats(?int $hospitalId = null): array
    {
        // IMPORTANT: Each query needs a fresh scope — Eloquent builders are mutable.
        // Count unique (hospital, resource) pairs — not raw hourly rows.
        // This matches the ForecastController summary() aggregation so numbers
        // in the narrative are consistent with the top-level dashboard cards.
        $totalDemand = ForecastDemand::latestRun()
            ->nextHours(48)
            ->when($hospitalId, fn ($q) => $q->where('hospital_id', $hospitalId))
            ->select(DB::raw('COUNT(DISTINCT CONCAT(hospital_id, \'-\', resource_id)) as cnt'))
            ->value('cnt');
        $totalRisk = ForecastRisk::latestRun()
            ->nextHours(48)
            ->when($hospitalId, fn ($q) => $q->where('hospital_id', $hospitalId))
            ->select(DB::raw('COUNT(DISTINCT CONCAT(hospital_id, \'-\', resource_id)) as cnt'))
            ->value('cnt');

        // Risk distribution — aggregate per (hospital, resource) pair first,
        // then classify the pair by its worst-case risk_prob.
        // Only consider future hours (same window as ForecastController::summary)
        // so the numbers match the dashboard KPI cards exactly.
        $riskDist = DB::table(
            DB::raw("(
                SELECT hospital_id, resource_id,
                       CASE
                           WHEN MAX(risk_prob) >= 0.85 THEN 'critical'
                           WHEN MAX(risk_prob) >= 0.65 THEN 'high'
                           WHEN MAX(risk_prob) >= 0.35 THEN 'medium'
                           ELSE 'low'
                       END as agg_risk_level
                FROM forecast_risk_hourly
                WHERE generated_at = (SELECT MAX(generated_at) FROM forecast_risk_hourly)
                  AND forecast_time >= NOW()
                  AND forecast_time <= NOW() + INTERVAL '48 hours'
                  " . ($hospitalId ? "AND hospital_id = {$hospitalId}" : '') . "
                GROUP BY hospital_id, resource_id
            ) as pairs")
        )
            ->selectRaw('agg_risk_level as risk_level, COUNT(*) as count')
            ->groupBy('agg_risk_level')
            ->pluck('count', 'risk_level')
            ->toArray();

        // Top critical items (hospital × resource) — future hours only
        $criticalItems = ForecastRisk::latestRun()
            ->nextHours(48)
            ->when($hospitalId, fn ($q) => $q->where('hospital_id', $hospitalId))
            ->whereIn('risk_level', ['high', 'critical'])
            ->select([
                'hospital_id', 'resource_id',
                DB::raw('MAX(risk_prob) as max_risk'),
                DB::raw('MIN(days_until_stockout) as min_days'),
                DB::raw('MAX(risk_level) as worst_level'),
            ])
            ->groupBy('hospital_id', 'resource_id')
            ->orderByDesc('max_risk')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $hospital = \App\Models\Hospital::find($item->hospital_id);
                $resource = \App\Models\Resource::find($item->resource_id);
                return [
                    'hospital' => $hospital?->name ?? "H#{$item->hospital_id}",
                    'resource' => $resource?->name ?? "R#{$item->resource_id}",
                    'category' => $resource?->category ?? 'unknown',
                    'risk_prob' => round($item->max_risk * 100),
                    'days_until_stockout' => round($item->min_days, 1),
                    'risk_level' => $item->worst_level,
                ];
            })
            ->toArray();

        // Demand by resource category
        $demandByCategory = ForecastDemand::latestRun()
            ->when($hospitalId, fn ($q) => $q->where('forecast_demand_hourly.hospital_id', $hospitalId))
            ->join('resources', 'forecast_demand_hourly.resource_id', '=', 'resources.id')
            ->select('resources.category', DB::raw('ROUND(AVG(yhat), 2) as avg_demand'))
            ->groupBy('resources.category')
            ->pluck('avg_demand', 'category')
            ->toArray();

        // Hospitals with most risk — count unique (hospital, resource) pairs
        // that are high/critical, not raw hourly rows.
        // Also compute critical_count + avg severity so we can rank hospitals
        // meaningfully when they share the same total at-risk count.
        $riskByHospital = DB::table(
            DB::raw("(
                SELECT hospital_id, resource_id,
                       MAX(risk_prob) as max_risk_prob,
                       CASE
                           WHEN MAX(risk_prob) >= 0.85 THEN 'critical'
                           WHEN MAX(risk_prob) >= 0.65 THEN 'high'
                           WHEN MAX(risk_prob) >= 0.35 THEN 'medium'
                           ELSE 'low'
                       END as agg_risk_level
                FROM forecast_risk_hourly
                WHERE generated_at = (SELECT MAX(generated_at) FROM forecast_risk_hourly)
                  AND forecast_time >= NOW()
                  AND forecast_time <= NOW() + INTERVAL '48 hours'
                  " . ($hospitalId ? "AND hospital_id = {$hospitalId}" : '') . "
                GROUP BY hospital_id, resource_id
            ) as pairs")
        )
            ->whereIn('agg_risk_level', ['high', 'critical'])
            ->select(
                'hospital_id',
                DB::raw('COUNT(*) as risk_count'),
                DB::raw("SUM(CASE WHEN agg_risk_level = 'critical' THEN 1 ELSE 0 END) as critical_count"),
                DB::raw('ROUND(AVG(max_risk_prob) * 100, 1) as avg_severity'),
            )
            ->groupBy('hospital_id')
            ->orderByDesc('risk_count')
            ->orderByDesc('critical_count')
            ->orderByDesc('avg_severity')
            ->limit(5)
            ->get()
            ->map(function ($h) {
                $hospital = \App\Models\Hospital::find($h->hospital_id);
                return [
                    'name' => $hospital?->name ?? "H#{$h->hospital_id}",
                    'risk_count' => $h->risk_count,
                    'critical_count' => (int) $h->critical_count,
                    'avg_severity' => (float) $h->avg_severity,
                ];
            })
            ->toArray();

        // Model info
        $modelVersion = ForecastDemand::latestRun()->value('model_version') ?? 'N/A';
        $generatedAt = ForecastDemand::latestRun()->value('generated_at');

        return [
            'total_demand' => $totalDemand,
            'total_risk' => $totalRisk,
            'risk_distribution' => $riskDist,
            'critical_items' => $criticalItems,
            'demand_by_category' => $demandByCategory,
            'risk_by_hospital' => $riskByHospital,
            'model_version' => $modelVersion,
            'generated_at' => $generatedAt,
        ];
    }

    /**
     * Build a structured prompt for Gemini to generate the narrative.
     */
    private function buildPrompt(array $stats): string
    {
        $criticalList = '';
        foreach ($stats['critical_items'] as $item) {
            $criticalList .= "  - {$item['hospital']}: {$item['resource']} "
                . "(risk: {$item['risk_prob']}%, stockout in ~{$item['days_until_stockout']} days)\n";
        }

        $hospitalRisks = '';
        foreach ($stats['risk_by_hospital'] as $h) {
            $hospitalRisks .= "  - {$h['name']}: {$h['risk_count']} high/critical risk items\n";
        }

        $riskDist = $stats['risk_distribution'];
        $low = $riskDist['low'] ?? 0;
        $med = $riskDist['medium'] ?? 0;
        $high = $riskDist['high'] ?? 0;
        $crit = $riskDist['critical'] ?? 0;

        return <<<PROMPT
You are the AI assistant for DOH Kalinga, a Philippine Department of Health medical logistics system.
Generate a concise executive summary (3-5 paragraphs) for logistics managers based on these forecast results:

FORECAST OVERVIEW:
- Total predictions: {$stats['total_demand']} demand, {$stats['total_risk']} risk
- Model version: {$stats['model_version']}
- Generated: {$stats['generated_at']}

RISK DISTRIBUTION:
- Low: {$low} | Medium: {$med} | High: {$high} | Critical: {$crit}

TOP CRITICAL ITEMS (need immediate attention):
{$criticalList}

HOSPITALS WITH MOST RISK:
{$hospitalRisks}

INSTRUCTIONS:
1. Start with a brief situation overview (1-2 sentences)
2. Highlight the most critical items needing immediate reorder
3. Identify hospitals that need the most attention
4. Recommend specific actions (reorder priorities, inter-hospital transfers)
5. End with overall risk posture assessment
6. Use professional tone suitable for DOH executives
7. Reference specific hospitals and resources by name
8. Keep it under 300 words
PROMPT;
    }

    /**
     * Generate a rule-based narrative when Gemini is unavailable.
     */
    private function ruleFallbackNarrative(array $stats): string
    {
        $riskDist = $stats['risk_distribution'];
        $crit = $riskDist['critical'] ?? 0;
        $high = $riskDist['high'] ?? 0;
        $total = $stats['total_demand'];

        $critPct = $total > 0 ? round(($crit / $total) * 100, 1) : 0;
        $highPct = $total > 0 ? round(($high / $total) * 100, 1) : 0;

        $narrative = "FORECAST EXECUTIVE SUMMARY\n";
        $narrative .= "Generated: " . now()->format('M d, Y H:i') . "\n\n";

        // Overall posture
        if ($crit > 0) {
            $narrative .= "⚠️ ALERT: {$crit} critical risk items detected ({$critPct}% of total). ";
            $narrative .= "Immediate action required for the following items:\n\n";
        } elseif ($high > 0) {
            $narrative .= "⚡ CAUTION: {$high} high-risk items detected ({$highPct}% of total). ";
            $narrative .= "Proactive reordering recommended:\n\n";
        } else {
            $narrative .= "✅ All supply levels within acceptable risk thresholds. ";
            $narrative .= "No immediate action needed.\n\n";
        }

        // List critical items
        if (!empty($stats['critical_items'])) {
            $narrative .= "PRIORITY ITEMS:\n";
            foreach (array_slice($stats['critical_items'], 0, 5) as $i => $item) {
                $num = $i + 1;
                $narrative .= "  {$num}. {$item['hospital']} — {$item['resource']}: "
                    . "Risk {$item['risk_prob']}%, stockout in ~{$item['days_until_stockout']}d\n";
            }
            $narrative .= "\n";
        }

        // Hospital focus
        if (!empty($stats['risk_by_hospital'])) {
            $narrative .= "HOSPITALS REQUIRING ATTENTION:\n";
            foreach ($stats['risk_by_hospital'] as $h) {
                $narrative .= "  • {$h['name']}: {$h['risk_count']} at-risk items\n";
            }
        }

        return $narrative;
    }
}
