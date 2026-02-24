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
    public function generateExecutiveSummary(): array
    {
        // ── Gather forecast statistics ──────────────────────
        $stats = $this->gatherForecastStats();

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
    private function gatherForecastStats(): array
    {
        $latestDemand = ForecastDemand::latestRun();
        $latestRisk = ForecastRisk::latestRun();

        $totalDemand = $latestDemand->count();
        $totalRisk = $latestRisk->count();

        // Risk distribution
        $riskDist = $latestRisk
            ->select('risk_level', DB::raw('COUNT(*) as count'))
            ->groupBy('risk_level')
            ->pluck('count', 'risk_level')
            ->toArray();

        // Top critical items (hospital × resource)
        $criticalItems = $latestRisk
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
            ->with(['hospital:id,name', 'resource:id,name,category'])
            ->get()
            ->map(fn ($item) => [
                'hospital' => $item->hospital?->name ?? "H#{$item->hospital_id}",
                'resource' => $item->resource?->name ?? "R#{$item->resource_id}",
                'category' => $item->resource?->category ?? 'unknown',
                'risk_prob' => round($item->max_risk * 100),
                'days_until_stockout' => round($item->min_days, 1),
                'risk_level' => $item->worst_level,
            ])
            ->toArray();

        // Demand by resource category
        $demandByCategory = $latestDemand
            ->join('resources', 'forecast_demand_hourly.resource_id', '=', 'resources.id')
            ->select('resources.category', DB::raw('ROUND(AVG(yhat), 2) as avg_demand'))
            ->groupBy('resources.category')
            ->pluck('avg_demand', 'category')
            ->toArray();

        // Hospitals with most risk
        $riskByHospital = $latestRisk
            ->whereIn('risk_level', ['high', 'critical'])
            ->select('hospital_id', DB::raw('COUNT(*) as risk_count'))
            ->groupBy('hospital_id')
            ->orderByDesc('risk_count')
            ->limit(5)
            ->with('hospital:id,name')
            ->get()
            ->map(fn ($h) => [
                'name' => $h->hospital?->name ?? "H#{$h->hospital_id}",
                'risk_count' => $h->risk_count,
            ])
            ->toArray();

        // Model info
        $modelVersion = $latestDemand->value('model_version') ?? 'N/A';
        $generatedAt = $latestDemand->value('generated_at');

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
            $narrative .= "⚠️ ALERT: {$crit} critical risk predictions detected ({$critPct}% of total). ";
            $narrative .= "Immediate action required for the following items:\n\n";
        } elseif ($high > 0) {
            $narrative .= "⚡ CAUTION: {$high} high-risk predictions detected ({$highPct}% of total). ";
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
