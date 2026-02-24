<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Resource;
use App\Models\Hospital;
use App\Models\ResourceResilienceConfig;

/**
 * Seed resource_resilience_configs from existing resources.
 *
 * Maps resource categories to HSI resilience categories and generates
 * realistic daily-usage rates so the ML pipeline's feature columns
 * (normal_daily_usage, surge_multiplier, current_survival_hours)
 * are never empty.
 */
class ResourceResilienceConfigSeeder extends Seeder
{
    /**
     * Map Resource.category → resilience_category enum value.
     */
    private const CATEGORY_MAP = [
        'Medicine'          => 'medicines_critical',
        'First Aid Kit'     => 'ppe',
        'Specialized Items' => 'other',
        'Blood'             => 'blood_products',
        'Blood Products'    => 'blood_products',
        'Food'              => 'food',
        'Water'             => 'water',
        'Fuel'              => 'fuel',
        'Oxygen'            => 'oxygen',
        'PPE'               => 'ppe',
        'Medical Gas'       => 'medical_gases_other',
    ];

    /**
     * Default daily-usage rates per resilience category (in resource units).
     * These are intentionally conservative starting points;
     * the ML pipeline will learn the real rate from stock_movements.
     */
    private const USAGE_DEFAULTS = [
        'medicines_critical'   => ['daily' => 8.0,  'unit' => 'bottles/day',  'surge' => 2.00],
        'ppe'                  => ['daily' => 5.0,  'unit' => 'pieces/day',   'surge' => 1.75],
        'blood_products'       => ['daily' => 4.0,  'unit' => 'units/day',    'surge' => 2.50],
        'food'                 => ['daily' => 20.0, 'unit' => 'servings/day', 'surge' => 2.00],
        'water'                => ['daily' => 50.0, 'unit' => 'liters/day',   'surge' => 2.00],
        'fuel'                 => ['daily' => 30.0, 'unit' => 'liters/day',   'surge' => 1.50],
        'oxygen'               => ['daily' => 12.0, 'unit' => 'tanks/day',    'surge' => 2.50],
        'medical_gases_other'  => ['daily' => 6.0,  'unit' => 'tanks/day',    'surge' => 2.00],
        'other'                => ['daily' => 3.0,  'unit' => 'units/day',    'surge' => 1.50],
    ];

    public function run(): void
    {
        ResourceResilienceConfig::truncate();

        $resources = Resource::with('hospital')->get();

        foreach ($resources as $resource) {
            if (!$resource->hospital_id) {
                continue;
            }

            $resilienceCategory = self::CATEGORY_MAP[$resource->category] ?? 'other';
            $defaults = self::USAGE_DEFAULTS[$resilienceCategory];

            // Add ±20 % jitter so the data isn't perfectly uniform
            $jitter = 0.8 + (mt_rand(0, 400) / 1000); // 0.80 – 1.20
            $dailyUsage = round($defaults['daily'] * $jitter, 2);
            $surgeMultiplier = $defaults['surge'];

            $isHsiCritical = ResourceResilienceConfig::isHsiCriticalCategory($resilienceCategory);
            $hsiMinHours = ResourceResilienceConfig::getHsiThreshold($resilienceCategory);

            $config = ResourceResilienceConfig::create([
                'resource_id'               => $resource->id,
                'hospital_id'               => $resource->hospital_id,
                'resilience_category'       => $resilienceCategory,
                'normal_daily_usage'        => $dailyUsage,
                'usage_unit'                => $defaults['unit'],
                'surge_multiplier'          => $surgeMultiplier,
                'max_surge_multiplier'      => min($surgeMultiplier + 1.0, 5.0),
                'critical_threshold_hours'  => $hsiMinHours,
                'warning_threshold_hours'   => $hsiMinHours * 1.5,
                'optimal_threshold_hours'   => $hsiMinHours * 2.0,
                'is_hsi_critical'           => $isHsiCritical,
                'hsi_minimum_hours'         => $isHsiCritical ? $hsiMinHours : null,
                'alerts_enabled'            => true,
                'auto_vendor_trigger_enabled' => false,
            ]);

            // Calculate and persist survival hours from current stock
            $config->recalculate($resource->quantity)->save();
        }

        $count = ResourceResilienceConfig::count();
        $this->command->info("Seeded {$count} resource resilience configs.");
    }
}
