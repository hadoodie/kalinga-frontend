<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\StockMovement;
use App\Models\SupplyOrder;
use App\Models\ResourceResilienceConfig;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Probabilistic Dynamic Safety Stock Calculator — Epic 2.
 *
 * Replaces flat-percentage buffers with a statistically rigorous
 * calculation that accounts for BOTH demand variability and lead
 * time variability.
 *
 * Formula:
 *   SS = Z × √(avg_LT × σ_d² + avg_d² × σ_LT²)
 *
 * Where:
 *   Z      = Z-score for the target service level
 *   avg_LT = average lead time in days
 *   avg_d  = average daily demand
 *   σ_d    = standard deviation of daily demand
 *   σ_LT   = standard deviation of lead time in days
 */
class SafetyStockService
{
    /** Default target service level (95%) */
    const DEFAULT_SERVICE_LEVEL = 0.95;

    /** Default fallback lead time when no supplier data */
    const DEFAULT_LEAD_TIME_DAYS = 5.0;

    /** Default fallback lead time standard deviation */
    const DEFAULT_LEAD_TIME_STD = 1.5;

    /** Rolling window for demand statistics */
    const DEMAND_WINDOW_DAYS = 90;

    /** Z-score lookup table for common service levels */
    const Z_TABLE = [
        0.50  => 0.0000,
        0.80  => 0.8416,
        0.85  => 1.0364,
        0.90  => 1.2816,
        0.92  => 1.4051,
        0.95  => 1.6449,
        0.97  => 1.8808,
        0.98  => 2.0537,
        0.99  => 2.3263,
        0.995 => 2.5758,
        0.999 => 3.0902,
    ];

    private float $serviceLevel;
    private float $zScore;
    private float $defaultLeadTime;
    private float $defaultLeadTimeStd;

    public function __construct(
        float $serviceLevel = self::DEFAULT_SERVICE_LEVEL,
        float $defaultLeadTimeDays = self::DEFAULT_LEAD_TIME_DAYS,
        float $defaultLeadTimeStd = self::DEFAULT_LEAD_TIME_STD
    ) {
        $this->serviceLevel = $serviceLevel;
        $this->zScore = self::computeZScore($serviceLevel);
        $this->defaultLeadTime = $defaultLeadTimeDays;
        $this->defaultLeadTimeStd = $defaultLeadTimeStd;
    }

    // ═══════════════════════════════════════════════════════════
    // Z-Score Calculation
    // ═══════════════════════════════════════════════════════════

    /**
     * Compute Z-score for a given service level using interpolation.
     */
    public static function computeZScore(float $serviceLevel): float
    {
        if ($serviceLevel <= 0 || $serviceLevel >= 1) {
            throw new \InvalidArgumentException("Service level must be between 0 and 1 exclusive");
        }

        // Exact match
        if (isset(self::Z_TABLE[$serviceLevel])) {
            return self::Z_TABLE[$serviceLevel];
        }

        // Linear interpolation between nearest entries
        $keys = array_keys(self::Z_TABLE);
        sort($keys);

        $lower = $keys[0];
        $upper = end($keys);

        foreach ($keys as $k) {
            if ($k <= $serviceLevel) $lower = $k;
            if ($k >= $serviceLevel) {
                $upper = $k;
                break;
            }
        }

        if ($lower === $upper) {
            return self::Z_TABLE[$lower];
        }

        $fraction = ($serviceLevel - $lower) / ($upper - $lower);
        return self::Z_TABLE[$lower] + $fraction * (self::Z_TABLE[$upper] - self::Z_TABLE[$lower]);
    }

    // ═══════════════════════════════════════════════════════════
    // Core Formula
    // ═══════════════════════════════════════════════════════════

    /**
     * Calculate safety stock for a single item.
     *
     * SS = Z × √(avg_LT × σ_d² + avg_d² × σ_LT²)
     *
     * @param  float  $avgLeadTime   Average lead time in days
     * @param  float  $stdLeadTime   Std deviation of lead time in days
     * @param  float  $avgDemand     Average daily demand
     * @param  float  $stdDemand     Std deviation of daily demand
     * @return float  Safety stock quantity
     */
    public function calculate(
        float $avgLeadTime,
        float $stdLeadTime,
        float $avgDemand,
        float $stdDemand
    ): float {
        if ($avgDemand <= 0 || $avgLeadTime <= 0) {
            return 0.0;
        }

        $varianceComponent = (
            $avgLeadTime * pow($stdDemand, 2)
            + pow($avgDemand, 2) * pow($stdLeadTime, 2)
        );

        return round($this->zScore * sqrt(max($varianceComponent, 0.0)), 2);
    }

    /**
     * Calculate reorder point = (avg_demand × avg_lead_time) + safety_stock.
     */
    public function reorderPoint(
        float $avgLeadTime,
        float $stdLeadTime,
        float $avgDemand,
        float $stdDemand
    ): float {
        $ss = $this->calculate($avgLeadTime, $stdLeadTime, $avgDemand, $stdDemand);
        return round($avgDemand * $avgLeadTime + $ss, 2);
    }

    // ═══════════════════════════════════════════════════════════
    // Data-Driven Calculations
    // ═══════════════════════════════════════════════════════════

    /**
     * Compute safety stock for a specific resource at a hospital.
     *
     * Pulls demand stats from stock_movements and lead time stats
     * from supply_orders automatically.
     *
     * @param  int    $resourceId
     * @param  int    $hospitalId
     * @param  string|null  $abcXyzClass  Optional ABC-XYZ class for multiplier adjustment
     * @return array  ['safety_stock', 'reorder_point', 'avg_demand', 'std_demand',
     *                 'avg_lead_time', 'std_lead_time', 'z_score', 'service_level']
     */
    public function computeForResource(int $resourceId, int $hospitalId, ?string $abcXyzClass = null): array
    {
        $demandStats = $this->getDemandStats($resourceId, $hospitalId);
        $leadTimeStats = $this->getLeadTimeStats($resourceId);

        $avgDemand = $demandStats['avg_daily_demand'];
        $stdDemand = $demandStats['std_daily_demand'];
        $avgLeadTime = $leadTimeStats['avg_lead_time_days'];
        $stdLeadTime = $leadTimeStats['std_lead_time_days'];

        $safetyStock = $this->calculate($avgLeadTime, $stdLeadTime, $avgDemand, $stdDemand);
        $rop = $this->reorderPoint($avgLeadTime, $stdLeadTime, $avgDemand, $stdDemand);

        // Apply ABC-XYZ class multiplier if provided
        if ($abcXyzClass) {
            $multiplier = InventoryClassifierService::safetyStockMultiplier($abcXyzClass);
            $safetyStock = round($safetyStock * $multiplier, 2);
            $rop = round($avgDemand * $avgLeadTime + $safetyStock, 2);
        }

        return [
            'safety_stock'   => $safetyStock,
            'reorder_point'  => $rop,
            'avg_demand'     => round($avgDemand, 4),
            'std_demand'     => round($stdDemand, 4),
            'avg_lead_time'  => round($avgLeadTime, 2),
            'std_lead_time'  => round($stdLeadTime, 2),
            'z_score'        => round($this->zScore, 4),
            'service_level'  => $this->serviceLevel,
            'abc_xyz_class'  => $abcXyzClass,
            'days_of_data'   => $demandStats['days_with_data'],
            'orders_sampled' => $leadTimeStats['order_count'],
        ];
    }

    /**
     * Compute safety stock for all resources at a hospital.
     *
     * @param  int         $hospitalId
     * @param  Collection|null  $classifications  Optional pre-computed ABC/XYZ results
     * @return Collection  Keyed by resource_id
     */
    public function computeForHospital(int $hospitalId, ?Collection $classifications = null): Collection
    {
        $resources = Resource::where('hospital_id', $hospitalId)->get();
        $results = collect();

        foreach ($resources as $resource) {
            $abcXyz = null;
            if ($classifications && $classifications->has($resource->id)) {
                $abcXyz = $classifications[$resource->id]['abc_xyz_class'] ?? null;
            } elseif ($resource->abc_class && $resource->xyz_class) {
                $abcXyz = $resource->abc_class . $resource->xyz_class;
            }

            try {
                $result = $this->computeForResource($resource->id, $hospitalId, $abcXyz);
                $results->put($resource->id, $result);
            } catch (\Exception $e) {
                Log::warning("[SafetyStock] Failed for resource {$resource->id}: {$e->getMessage()}");
            }
        }

        return $results;
    }

    // ═══════════════════════════════════════════════════════════
    // Statistical Helpers
    // ═══════════════════════════════════════════════════════════

    /**
     * Get demand statistics for a resource from stock movements.
     *
     * @return array  ['avg_daily_demand', 'std_daily_demand', 'days_with_data']
     */
    private function getDemandStats(int $resourceId, int $hospitalId): array
    {
        $cutoff = Carbon::now()->subDays(self::DEMAND_WINDOW_DAYS);

        $dailyDemand = StockMovement::where('resource_id', $resourceId)
            ->where('movement_type', 'out')
            ->where('created_at', '>=', $cutoff)
            ->whereHas('resource', fn ($q) => $q->where('hospital_id', $hospitalId))
            ->select([
                DB::raw('DATE(created_at) as day'),
                DB::raw('SUM(ABS(quantity)) as daily_consumption'),
            ])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('daily_consumption')
            ->map(fn ($v) => (float) $v);

        if ($dailyDemand->isEmpty()) {
            // Fallback: try to derive from resilience config
            $config = ResourceResilienceConfig::where('resource_id', $resourceId)
                ->where('hospital_id', $hospitalId)
                ->first();

            return [
                'avg_daily_demand'  => (float) ($config->normal_daily_usage ?? 0),
                'std_daily_demand'  => 0.0,
                'days_with_data'    => 0,
            ];
        }

        $mean = $dailyDemand->avg();
        $count = $dailyDemand->count();

        // Sample standard deviation
        $variance = $dailyDemand->map(fn ($v) => pow($v - $mean, 2))->avg();
        $std = $count > 1 ? sqrt($variance) : 0.0;

        return [
            'avg_daily_demand'  => round($mean, 4),
            'std_daily_demand'  => round($std, 4),
            'days_with_data'    => $count,
        ];
    }

    /**
     * Get lead time statistics from historical supply orders.
     *
     * @return array  ['avg_lead_time_days', 'std_lead_time_days', 'order_count']
     */
    private function getLeadTimeStats(int $resourceId): array
    {
        $resource = Resource::find($resourceId);
        if (!$resource || !$resource->sku) {
            return [
                'avg_lead_time_days'  => $this->defaultLeadTime,
                'std_lead_time_days'  => $this->defaultLeadTimeStd,
                'order_count'         => 0,
            ];
        }

        $orders = SupplyOrder::where('resource_sku', $resource->sku)
            ->where('status', 'received')
            ->whereNotNull('actual_delivery_date')
            ->whereNotNull('created_at')
            ->get();

        if ($orders->isEmpty()) {
            return [
                'avg_lead_time_days'  => $this->defaultLeadTime,
                'std_lead_time_days'  => $this->defaultLeadTimeStd,
                'order_count'         => 0,
            ];
        }

        $leadTimes = $orders->map(function ($order) {
            $created = Carbon::parse($order->created_at);
            $delivered = Carbon::parse($order->actual_delivery_date);
            return max($delivered->diffInDays($created, true), 0.0);
        })->filter(fn ($v) => $v > 0);

        if ($leadTimes->isEmpty()) {
            return [
                'avg_lead_time_days'  => $this->defaultLeadTime,
                'std_lead_time_days'  => $this->defaultLeadTimeStd,
                'order_count'         => 0,
            ];
        }

        $mean = $leadTimes->avg();
        $count = $leadTimes->count();
        $variance = $leadTimes->map(fn ($v) => pow($v - $mean, 2))->avg();
        $std = $count > 1 ? sqrt($variance) : 0.0;

        return [
            'avg_lead_time_days'  => round($mean, 2),
            'std_lead_time_days'  => round($std, 2),
            'order_count'         => $count,
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // Accessors
    // ═══════════════════════════════════════════════════════════

    public function getServiceLevel(): float
    {
        return $this->serviceLevel;
    }

    public function getZScore(): float
    {
        return $this->zScore;
    }
}
