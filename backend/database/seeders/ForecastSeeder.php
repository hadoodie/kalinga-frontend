<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * ForecastSeeder — populates forecast_demand_hourly & forecast_risk_hourly
 * with realistic 48-hour predictions for all hospital×resource combinations.
 *
 * Run via: php artisan db:seed --class=ForecastSeeder
 */
class ForecastSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now()->startOfHour();
        $generatedAt = $now->copy();

        // Fetch all hospital IDs and resource IDs already in the DB
        $hospitalIds = DB::table('hospitals')->pluck('id')->toArray();
        $resources   = DB::table('resources')->select('id', 'name', 'category', 'quantity', 'minimum_stock', 'is_critical')->get();

        if (empty($hospitalIds) || $resources->isEmpty()) {
            $this->command->warn('No hospitals or resources found. Run HospitalSeeder + ResourceSeeder first.');
            return;
        }

        $this->command->info("Seeding forecasts for " . count($hospitalIds) . " hospitals × " . $resources->count() . " resources × 48 hours...");

        // Clear existing forecast data
        DB::table('forecast_demand_hourly')->truncate();
        DB::table('forecast_risk_hourly')->truncate();

        $demandRows = [];
        $riskRows   = [];
        $batchSize  = 500;

        // Realistic hourly demand weights (24h cycle)
        $hourlyWeights = [
            0 => 0.15, 1 => 0.10, 2 => 0.10, 3 => 0.10, 4 => 0.12, 5 => 0.20,
            6 => 0.60, 7 => 1.20, 8 => 1.60, 9 => 1.80, 10 => 1.90, 11 => 1.85,
            12 => 1.50, 13 => 1.70, 14 => 1.80, 15 => 1.60, 16 => 1.40, 17 => 1.20,
            18 => 1.00, 19 => 0.80, 20 => 0.60, 21 => 0.45, 22 => 0.30, 23 => 0.20,
        ];

        // Assign risk profiles to specific hospital×resource combos for realism
        $criticalPairs = [];
        $highPairs     = [];

        foreach ($hospitalIds as $hIdx => $hId) {
            foreach ($resources as $rIdx => $resource) {
                // Make ~15% critical, ~20% high, rest low/medium
                $combo = ($hIdx * 100 + $rIdx);
                if ($resource->is_critical && $combo % 7 === 0) {
                    $criticalPairs[] = "{$hId}-{$resource->id}";
                } elseif ($combo % 5 === 0 || ($resource->quantity <= $resource->minimum_stock)) {
                    $highPairs[] = "{$hId}-{$resource->id}";
                }
            }
        }

        foreach ($hospitalIds as $hId) {
            foreach ($resources as $resource) {
                $pairKey = "{$hId}-{$resource->id}";
                $isCriticalPair = in_array($pairKey, $criticalPairs);
                $isHighPair     = in_array($pairKey, $highPairs);

                // Base demand rate varies by category
                $baseDemand = match (true) {
                    str_contains(strtolower($resource->category), 'medicine') => 3.5 + $this->noise(0.8),
                    str_contains(strtolower($resource->category), 'first aid') => 2.2 + $this->noise(0.5),
                    default => 2.0 + $this->noise(0.6),
                };

                // Risk parameters
                $currentStock = $resource->quantity;
                $dailyUsage   = $baseDemand * 8; // ~8 active hours weighted
                $daysUntilStockout = $dailyUsage > 0
                    ? max(0.1, $currentStock / $dailyUsage + $this->noise(1.5))
                    : 999;

                if ($isCriticalPair) {
                    $daysUntilStockout = max(0.3, min(2.5, $daysUntilStockout * 0.15));
                } elseif ($isHighPair) {
                    $daysUntilStockout = max(1.0, min(5.0, $daysUntilStockout * 0.35));
                }

                $riskProb = $isCriticalPair
                    ? 0.85 + $this->noise(0.10)
                    : ($isHighPair
                        ? 0.65 + $this->noise(0.15)
                        : 0.05 + abs($this->noise(0.25)));

                $riskProb  = max(0.0, min(1.0, $riskProb));
                $riskLevel = $this->levelFromProb($riskProb);

                for ($h = 1; $h <= 48; $h++) {
                    $forecastTime = $now->copy()->addHours($h);
                    $hourOfDay    = $forecastTime->hour;
                    $weight       = $hourlyWeights[$hourOfDay] ?? 1.0;

                    // Demand with slight trend + noise
                    $yhat = max(0.01, $baseDemand * $weight + $this->noise(0.3));
                    $yhatLower = max(0.0, $yhat * (0.65 + $this->noise(0.03)));
                    $yhatUpper = $yhat * (1.40 + $this->noise(0.05));

                    $demandRows[] = [
                        'hospital_id'      => $hId,
                        'resource_id'      => $resource->id,
                        'forecast_time'    => $forecastTime->toDateTimeString(),
                        'horizon_h'        => $h,
                        'yhat'             => round($yhat, 4),
                        'yhat_lower'       => round($yhatLower, 4),
                        'yhat_upper'       => round($yhatUpper, 4),
                        'feature_snapshot'  => json_encode([
                            'hour_weight'   => $weight,
                            'base_demand'   => round($baseDemand, 2),
                            'current_stock' => $currentStock,
                        ]),
                        'model_version'    => 'v8.2-seeded',
                        'generated_at'     => $generatedAt->toDateTimeString(),
                        'created_at'       => $generatedAt->toDateTimeString(),
                        'updated_at'       => $generatedAt->toDateTimeString(),
                    ];

                    // Risk entries: evolve over time (risk grows as stock depletes)
                    $hourlyRiskProb = min(1.0, $riskProb + ($h / 48) * 0.08);
                    $hourlyRiskLevel = $this->levelFromProb($hourlyRiskProb);
                    $hourlyProjectedStock = max(0, $currentStock - ($dailyUsage / 24) * $h + $this->noise(2));
                    $hourlyDaysLeft = max(0.0, $daysUntilStockout - ($h / 24));

                    $riskFactors = [];
                    if ($hourlyProjectedStock < ($resource->minimum_stock * 0.3)) {
                        $pct = $resource->minimum_stock > 0
                            ? round(($hourlyProjectedStock / $resource->minimum_stock) * 100)
                            : 0;
                        $riskFactors['low_stock'] = "Stock at {$pct}% of minimum";
                    }
                    if ($hourlyDaysLeft < 3) {
                        $riskFactors['low_survival'] = "Only " . round($hourlyDaysLeft * 24) . "h survival";
                    }
                    if ($isCriticalPair) {
                        $riskFactors['critical_item'] = "Critical supply item flagged";
                    }

                    $riskRows[] = [
                        'hospital_id'        => $hId,
                        'resource_id'        => $resource->id,
                        'forecast_time'      => $forecastTime->toDateTimeString(),
                        'horizon_h'          => $h,
                        'risk_prob'          => round($hourlyRiskProb, 4),
                        'projected_stock'    => round($hourlyProjectedStock, 4),
                        'days_until_stockout' => round($hourlyDaysLeft, 2),
                        'risk_level'         => $hourlyRiskLevel,
                        'risk_factors'       => json_encode($riskFactors),
                        'model_version'      => 'v8.2-seeded',
                        'generated_at'       => $generatedAt->toDateTimeString(),
                        'created_at'         => $generatedAt->toDateTimeString(),
                        'updated_at'         => $generatedAt->toDateTimeString(),
                    ];

                    // Flush in batches to avoid memory issues
                    if (count($demandRows) >= $batchSize) {
                        DB::table('forecast_demand_hourly')->insert($demandRows);
                        $demandRows = [];
                    }
                    if (count($riskRows) >= $batchSize) {
                        DB::table('forecast_risk_hourly')->insert($riskRows);
                        $riskRows = [];
                    }
                }
            }
        }

        // Flush remaining rows
        if (!empty($demandRows)) {
            DB::table('forecast_demand_hourly')->insert($demandRows);
        }
        if (!empty($riskRows)) {
            DB::table('forecast_risk_hourly')->insert($riskRows);
        }

        $totalDemand = DB::table('forecast_demand_hourly')->count();
        $totalRisk   = DB::table('forecast_risk_hourly')->count();
        $criticalCount = DB::table('forecast_risk_hourly')->where('risk_level', 'critical')->count();
        $highCount     = DB::table('forecast_risk_hourly')->where('risk_level', 'high')->count();

        $this->command->info("✓ Seeded {$totalDemand} demand rows + {$totalRisk} risk rows");
        $this->command->info("  → Critical: {$criticalCount} | High: {$highCount}");
        $this->command->info("  → generated_at: {$generatedAt->toIso8601String()}");
    }

    /** Small Gaussian-ish noise. */
    private function noise(float $scale = 1.0): float
    {
        // Box-Muller transform for ~N(0, scale)
        $u1 = max(1e-10, mt_rand() / mt_getrandmax());
        $u2 = mt_rand() / mt_getrandmax();
        return $scale * sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);
    }

    /** Map probability to risk level string. */
    private function levelFromProb(float $prob): string
    {
        return match (true) {
            $prob >= 0.85 => 'critical',
            $prob >= 0.65 => 'high',
            $prob >= 0.35 => 'medium',
            default       => 'low',
        };
    }
}
