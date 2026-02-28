<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\StockMovement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * ABC/XYZ Inventory Classifier Service — Epic 1.
 *
 * Dynamically classifies inventory items on two dimensions:
 *
 *   ABC (volume/value over a rolling 90-day window):
 *     A = top 80% cumulative volume (high-impact)
 *     B = next 15% (moderate-impact)
 *     C = remaining 5% (low-impact / tail)
 *
 *   XYZ (demand predictability via Coefficient of Variation):
 *     X = CV ≤ 0.50  — stable, highly predictable
 *     Y = 0.50 < CV ≤ 1.00 — moderate variability
 *     Z = CV > 1.00  — erratic / unpredictable
 *
 *   Cold Start: items with < 14 days of history default to 'Z'.
 */
class InventoryClassifierService
{
    /** Rolling window for volume/value analysis */
    const WINDOW_DAYS = 90;

    /** Minimum days of data before CV is trusted */
    const COLD_START_DAYS = 14;

    /** ABC cumulative breakpoints */
    const ABC_A_PCT = 0.80;
    const ABC_B_PCT = 0.95;

    /** XYZ coefficient of variation thresholds */
    const XYZ_X_MAX_CV = 0.50;
    const XYZ_Y_MAX_CV = 1.00;

    /**
     * Classify all resources for a given hospital.
     *
     * @param  int  $hospitalId
     * @return Collection  Array of classification results keyed by resource_id
     */
    public function classifyForHospital(int $hospitalId): Collection
    {
        $cutoff = Carbon::now()->subDays(self::WINDOW_DAYS);
        $coldStartCutoff = Carbon::now()->subDays(self::COLD_START_DAYS);

        // Fetch resources
        $resources = Resource::where('hospital_id', $hospitalId)->get();

        if ($resources->isEmpty()) {
            return collect();
        }

        $resourceIds = $resources->pluck('id')->toArray();

        // ── Get daily outflow aggregation ────────────────────
        $dailyDemand = $this->getDailyDemand($resourceIds, $cutoff);

        // ── ABC Classification ───────────────────────────────
        $abcClasses = $this->computeAbc($dailyDemand);

        // ── XYZ Classification ───────────────────────────────
        $xyzClasses = $this->computeXyz($dailyDemand, $resources, $coldStartCutoff);

        // ── Merge results ────────────────────────────────────
        $results = collect();
        foreach ($resources as $resource) {
            $rid = $resource->id;
            $abc = $abcClasses[$rid] ?? ['class' => 'C', 'volume' => 0, 'rank_pct' => 1.0];
            $xyz = $xyzClasses[$rid] ?? ['class' => 'Z', 'cv' => null, 'cold_start' => true];

            $results->put($rid, [
                'resource_id'      => $rid,
                'hospital_id'      => $hospitalId,
                'abc_class'        => $abc['class'],
                'total_volume_90d' => $abc['volume'],
                'abc_rank_pct'     => $abc['rank_pct'],
                'xyz_class'        => $xyz['class'],
                'cv'               => $xyz['cv'],
                'is_cold_start'    => $xyz['cold_start'],
                'abc_xyz_class'    => $abc['class'] . $xyz['class'],
            ]);
        }

        return $results;
    }

    /**
     * Classify and persist results to the resources table.
     *
     * @param  int  $hospitalId
     * @return int  Number of resources updated
     */
    public function classifyAndPersist(int $hospitalId): int
    {
        $results = $this->classifyForHospital($hospitalId);
        $updated = 0;

        foreach ($results as $rid => $classification) {
            Resource::where('id', $rid)->update([
                'abc_class'                 => $classification['abc_class'],
                'xyz_class'                 => $classification['xyz_class'],
                'classification_updated_at' => Carbon::now(),
            ]);
            $updated++;
        }

        Log::info("[InventoryClassifier] Hospital {$hospitalId}: classified {$updated} resources");

        return $updated;
    }

    /**
     * Classify all resources across all hospitals.
     *
     * @return int  Total resources updated
     */
    public function classifyAll(): int
    {
        $hospitalIds = Resource::distinct()->pluck('hospital_id')->filter()->toArray();
        $total = 0;

        foreach ($hospitalIds as $hospitalId) {
            $total += $this->classifyAndPersist($hospitalId);
        }

        Log::info("[InventoryClassifier] Classified {$total} resources across " . count($hospitalIds) . " hospitals");

        return $total;
    }

    // ═══════════════════════════════════════════════════════════
    // Internal Methods
    // ═══════════════════════════════════════════════════════════

    /**
     * Get daily outflow demand per resource within the window.
     *
     * @return Collection  Keyed by resource_id → array of daily consumption values
     */
    private function getDailyDemand(array $resourceIds, Carbon $cutoff): Collection
    {
        $movements = StockMovement::whereIn('resource_id', $resourceIds)
            ->where('movement_type', 'out')
            ->where('created_at', '>=', $cutoff)
            ->select([
                'resource_id',
                DB::raw('DATE(created_at) as day'),
                DB::raw('SUM(ABS(quantity)) as daily_consumption'),
            ])
            ->groupBy('resource_id', DB::raw('DATE(created_at)'))
            ->get();

        return $movements->groupBy('resource_id')->map(function ($group) {
            return $group->pluck('daily_consumption')->map(fn ($v) => (float) $v)->values();
        });
    }

    /**
     * Compute ABC classification from volume totals.
     *
     * @return array  Keyed by resource_id → ['class', 'volume', 'rank_pct']
     */
    private function computeAbc(Collection $dailyDemand): array
    {
        // Sum total volume per resource
        $totals = $dailyDemand->map(fn ($days) => $days->sum())->sortDesc();

        $grandTotal = $totals->sum();
        if ($grandTotal <= 0) {
            return $totals->map(fn () => ['class' => 'C', 'volume' => 0, 'rank_pct' => 1.0])->toArray();
        }

        $result = [];
        $cumulative = 0;

        foreach ($totals as $resourceId => $volume) {
            $cumulative += $volume;
            $cumulativePct = $cumulative / $grandTotal;

            if ($cumulativePct <= self::ABC_A_PCT) {
                $class = 'A';
            } elseif ($cumulativePct <= self::ABC_B_PCT) {
                $class = 'B';
            } else {
                $class = 'C';
            }

            $result[$resourceId] = [
                'class'    => $class,
                'volume'   => round($volume, 2),
                'rank_pct' => round($cumulativePct, 4),
            ];
        }

        return $result;
    }

    /**
     * Compute XYZ classification from coefficient of variation.
     *
     * @return array  Keyed by resource_id → ['class', 'cv', 'cold_start']
     */
    private function computeXyz(Collection $dailyDemand, Collection $resources, Carbon $coldStartCutoff): array
    {
        $result = [];

        foreach ($resources as $resource) {
            $rid = $resource->id;
            $days = $dailyDemand->get($rid, collect());

            // Cold-start detection
            $isColdStart = false;
            if ($resource->created_at && Carbon::parse($resource->created_at)->gte($coldStartCutoff)) {
                $isColdStart = true;
            } elseif ($days->count() < self::COLD_START_DAYS) {
                $isColdStart = true;
            }

            if ($isColdStart) {
                $result[$rid] = [
                    'class'      => 'Z',
                    'cv'         => null,
                    'cold_start' => true,
                ];
                continue;
            }

            // Compute CV = std / mean
            $mean = $days->avg();
            $cv = null;

            if ($mean > 0 && $days->count() >= 2) {
                $variance = $days->map(fn ($v) => ($v - $mean) ** 2)->avg();
                $std = sqrt($variance);
                $cv = round($std / $mean, 4);
            }

            // XYZ assignment
            if ($cv === null) {
                $class = 'Z';
            } elseif ($cv <= self::XYZ_X_MAX_CV) {
                $class = 'X';
            } elseif ($cv <= self::XYZ_Y_MAX_CV) {
                $class = 'Y';
            } else {
                $class = 'Z';
            }

            $result[$rid] = [
                'class'      => $class,
                'cv'         => $cv,
                'cold_start' => false,
            ];
        }

        return $result;
    }

    /**
     * Get a recommended safety stock multiplier for an ABC-XYZ class.
     */
    public static function safetyStockMultiplier(string $abcXyzClass): float
    {
        return match ($abcXyzClass) {
            'AX' => 1.00,
            'AY' => 1.15,
            'AZ' => 1.40,
            'BX' => 1.00,
            'BY' => 1.10,
            'BZ' => 1.25,
            'CX' => 0.90,
            'CY' => 1.00,
            'CZ' => 1.10,
            default => 1.00,
        };
    }

    /**
     * Get a human-readable description of an ABC-XYZ class.
     */
    public static function describeClass(string $abcXyzClass): string
    {
        return match ($abcXyzClass) {
            'AX' => 'High volume, stable demand — ideal for JIT replenishment',
            'AY' => 'High volume, moderate variability — use statistical safety stock',
            'AZ' => 'High volume, erratic demand — requires safety buffer + monitoring',
            'BX' => 'Medium volume, stable — standard reorder point',
            'BY' => 'Medium volume, moderate variability — periodic review',
            'BZ' => 'Medium volume, erratic — increase review frequency',
            'CX' => 'Low volume, stable — min/max replenishment',
            'CY' => 'Low volume, moderate variability — order on demand',
            'CZ' => 'Low volume, erratic — keep minimal stock or order ad-hoc',
            default => 'Unknown classification',
        };
    }
}
