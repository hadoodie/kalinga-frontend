<?php

namespace App\Services;

use App\Models\ForecastRisk;
use App\Models\Hospital;
use App\Models\Request as SupplyRequest;
use App\Models\Resource;
use App\Models\ResourceResilienceConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoReorderService
{
    /**
     * Maximum auto-reorder requests per pipeline run to prevent flooding.
     */
    const MAX_AUTO_ORDERS_PER_RUN = 50;

    /**
     * Cooldown: don't create duplicate requests within this window.
     */
    const COOLDOWN_HOURS = 6;

    /**
     * Process high-risk forecast items and auto-create supply requests.
     *
     * Logic:
     *  1. Pull latest forecast_risks where risk_level IN (high, critical)
     *  2. Group by hospital × resource (worst risk per pair)
     *  3. Skip if a pending/in-transit request already exists for this pair
     *  4. Calculate reorder quantity based on days_until_stockout
     *  5. Create new Request with urgency = Critical/High, meta = forecast source
     *
     * @return int Number of supply requests created
     */
    public function processHighRiskItems(): int
    {
        $highRiskItems = ForecastRisk::latestRun()
            ->whereIn('risk_level', ['high', 'critical'])
            ->select([
                'hospital_id',
                'resource_id',
                DB::raw('MAX(risk_prob) as max_risk_prob'),
                DB::raw('MIN(projected_stock) as min_projected_stock'),
                DB::raw('MIN(days_until_stockout) as min_days_stockout'),
                DB::raw("MAX(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) as is_critical"),
            ])
            ->groupBy('hospital_id', 'resource_id')
            ->orderByDesc('max_risk_prob')
            ->limit(self::MAX_AUTO_ORDERS_PER_RUN)
            ->get();

        if ($highRiskItems->isEmpty()) {
            Log::info('[AutoReorder] No high-risk items found');
            return 0;
        }

        Log::info("[AutoReorder] Processing {$highRiskItems->count()} high-risk items");

        $created = 0;

        foreach ($highRiskItems as $item) {
            try {
                $wasCreated = $this->createReorderRequest($item);
                if ($wasCreated) {
                    $created++;
                }
            } catch (\Exception $e) {
                Log::error('[AutoReorder] Failed to create request', [
                    'hospital_id' => $item->hospital_id,
                    'resource_id' => $item->resource_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info("[AutoReorder] Created {$created} supply requests");
        return $created;
    }

    /**
     * Create a single reorder supply request for a hospital×resource pair.
     *
     * @return bool Whether a new request was created
     */
    private function createReorderRequest(object $riskItem): bool
    {
        $hospitalId = $riskItem->hospital_id;
        $resourceId = $riskItem->resource_id;

        // Check cooldown — skip if recent pending/approved request exists
        $recentRequest = SupplyRequest::where('hospital_id', $hospitalId)
            ->where('resource_id', $resourceId)
            ->whereIn('status', [
                SupplyRequest::STATUS_PENDING,
                SupplyRequest::STATUS_UNDER_REVIEW,
                SupplyRequest::STATUS_MATCHED,
                SupplyRequest::STATUS_ALLOCATED,
                SupplyRequest::STATUS_IN_TRANSIT,
            ])
            ->where('created_at', '>=', now()->subHours(self::COOLDOWN_HOURS))
            ->exists();

        if ($recentRequest) {
            Log::debug("[AutoReorder] Skipped H{$hospitalId}×R{$resourceId} — recent request exists");
            return false;
        }

        // Load related models for context
        $resource = Resource::find($resourceId);
        $hospital = Hospital::find($hospitalId);

        if (!$resource || !$hospital) {
            return false;
        }

        // Calculate reorder quantity
        $quantity = $this->calculateReorderQuantity($hospitalId, $resourceId, $riskItem);

        // Determine urgency level
        $urgency = $riskItem->is_critical ? 'Critical' : 'High';

        // Build reason text
        $daysLeft = round($riskItem->min_days_stockout, 1);
        $riskProb = round($riskItem->max_risk_prob * 100);
        $reason = "AUTO-REORDER: AI forecasting detected {$urgency} risk. "
            . "Risk probability: {$riskProb}%. "
            . "Estimated days until stockout: {$daysLeft}. "
            . "Projected minimum stock: {$riskItem->min_projected_stock} units.";

        // Create the supply request
        $request = SupplyRequest::create([
            'hospital_id'    => $hospitalId,
            'resource_id'    => $resourceId,
            'resource_name'  => $resource->name,
            'quantity'       => $quantity,
            'urgency_level'  => $urgency,
            'handling_class' => $resource->handling_class ?? 'ambient',
            'reason'         => $reason,
            'status'         => SupplyRequest::STATUS_PENDING,
            'meta'           => [
                'source'            => 'ai_auto_reorder',
                'risk_prob'         => $riskItem->max_risk_prob,
                'risk_level'        => $riskItem->is_critical ? 'critical' : 'high',
                'projected_stock'   => $riskItem->min_projected_stock,
                'days_until_stockout' => $riskItem->min_days_stockout,
                'generated_at'      => now()->toIso8601String(),
            ],
        ]);

        Log::info("[AutoReorder] Created request #{$request->id}", [
            'hospital' => $hospital->name ?? $hospitalId,
            'resource' => $resource->name ?? $resourceId,
            'quantity' => $quantity,
            'urgency'  => $urgency,
        ]);

        return true;
    }

    /**
     * Calculate how much to reorder based on resilience config and forecast.
     *
     * Strategy: bring stock back to the reorder point (7-day target),
     * accounting for projected consumption.
     */
    private function calculateReorderQuantity(int $hospitalId, int $resourceId, object $riskItem): int
    {
        $resilience = ResourceResilienceConfig::where('hospital_id', $hospitalId)
            ->where('resource_id', $resourceId)
            ->first();

        if ($resilience) {
            // Target = reorder_point, current ≈ projected_stock
            $deficit = max(0, $resilience->reorder_point - ($riskItem->min_projected_stock ?? 0));
            // Add 20% safety buffer
            return max(1, (int) ceil($deficit * 1.2));
        }

        // Fallback: order 7× the resource's daily_base usage
        $resource = Resource::find($resourceId);
        $dailyUsage = $resource->daily_base_usage ?? 10;

        return max(1, (int) ceil($dailyUsage * 7));
    }
}
