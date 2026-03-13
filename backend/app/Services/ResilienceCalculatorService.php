<?php

namespace App\Services;

use App\Models\Hospital;
use App\Models\HospitalSafetyAssessment;
use App\Models\ResourceResilienceConfig;
use App\Models\TankTelemetry;
use App\Models\VendorAgreement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ResilienceCalculatorService
{
    /**
     * Hospital Safety Index Resilience Calculator Service
     * 
     * Implements:
     * - Survival Hours Formula: SurvivalHours = CurrentStock / (NormalDailyUsage × SurgeMultiplier)
     * - HSI Critical Thresholds: Fuel/Water 72h, Oxygen 360h (15 days)
     * - Automatic vendor mobilization triggers
     * - Email notifications via Laravel Mail
     */

    /**
     * Calculate survival hours for a resource
     */
    public function calculateSurvivalHours(
        float $currentStock,
        float $normalDailyUsage,
        float $surgeMultiplier = 1.0
    ): float {
        if ($normalDailyUsage <= 0) {
            return 999999; // Effectively infinite
        }

        $effectiveDailyUsage = $normalDailyUsage * $surgeMultiplier;
        $hourlyUsage = $effectiveDailyUsage / 24;

        return round($currentStock / $hourlyUsage, 2);
    }

    /**
     * Calculate overall safety index using WHO weighted model
     */
    public function calculateOverallSafetyIndex(
        float $structuralScore,
        float $nonStructuralScore,
        float $emergencyMgmtScore
    ): float {
        return round(
            ($structuralScore * HospitalSafetyAssessment::STRUCTURAL_WEIGHT) +
            ($nonStructuralScore * HospitalSafetyAssessment::NON_STRUCTURAL_WEIGHT) +
            ($emergencyMgmtScore * HospitalSafetyAssessment::EMERGENCY_MGMT_WEIGHT),
            2
        );
    }

    /**
     * Determine safety category from index
     */
    public function determineSafetyCategory(float $overallIndex): string
    {
        if ($overallIndex >= HospitalSafetyAssessment::CATEGORY_A_MIN) {
            return 'A';
        }
        if ($overallIndex >= HospitalSafetyAssessment::CATEGORY_B_MIN) {
            return 'B';
        }
        return 'C';
    }

    /**
     * Recalculate all resilience configs for a hospital
     */
    public function recalculateHospitalResilience(Hospital $hospital): array
    {
        $results = [
            'configs_updated' => 0,
            'tanks_updated' => 0,
            'critical_alerts' => [],
            'warning_alerts' => [],
            'vendors_triggered' => [],
        ];

        $surgeMultiplier = $hospital->disaster_mode_active 
            ? ($hospital->current_surge_multiplier ?? 1.5) 
            : 1.0;

        // Recalculate resource resilience configs
        $hospital->resilienceConfigs()->each(function ($config) use ($surgeMultiplier, &$results) {
            $config->surge_multiplier = $surgeMultiplier;
            $config->recalculate()->save();
            $results['configs_updated']++;

            // Check thresholds
            if ($config->resilience_status === ResourceResilienceConfig::STATUS_CRITICAL) {
                $results['critical_alerts'][] = [
                    'type' => 'resource',
                    'resource_id' => $config->resource_id,
                    'category' => $config->resilience_category,
                    'survival_hours' => $config->current_survival_hours,
                    'surge_hours' => $config->surge_survival_hours,
                ];

                // Check for vendor trigger
                if ($config->shouldTriggerVendor() && $config->primaryVendor) {
                    $results['vendors_triggered'][] = $config->primary_vendor_id;
                }
            } elseif ($config->resilience_status === ResourceResilienceConfig::STATUS_WARNING) {
                $results['warning_alerts'][] = [
                    'type' => 'resource',
                    'resource_id' => $config->resource_id,
                    'category' => $config->resilience_category,
                    'survival_hours' => $config->current_survival_hours,
                ];
            }
        });

        // Recalculate tank telemetry
        $hospital->activeTanks()->each(function ($tank) use (&$results) {
            $tank->recalculateMetrics()->save();
            $results['tanks_updated']++;

            if ($tank->alert_status === TankTelemetry::ALERT_CRITICAL) {
                $results['critical_alerts'][] = [
                    'type' => 'tank',
                    'tank_id' => $tank->id,
                    'tank_type' => $tank->tank_type,
                    'current_level_percent' => $tank->current_level_percent,
                    'hours_remaining' => $tank->estimated_hours_remaining,
                ];
            } elseif ($tank->alert_status === TankTelemetry::ALERT_WARNING) {
                $results['warning_alerts'][] = [
                    'type' => 'tank',
                    'tank_id' => $tank->id,
                    'tank_type' => $tank->tank_type,
                    'current_level_percent' => $tank->current_level_percent,
                ];
            }
        });

        return $results;
    }

    /**
     * Get HSI compliance report for a hospital
     */
    public function getHsiComplianceReport(Hospital $hospital): array
    {
        $assessment = $hospital->latestSafetyAssessment;
        $tanks = $hospital->activeTanks;
        $resilienceConfigs = $hospital->resilienceConfigs()->hsiCritical()->get();

        // Calculate water requirement
        $maxBeds = $hospital->maximum_bed_capacity ?? $hospital->capacity;
        $waterRequiredDaily = $maxBeds * TankTelemetry::HSI_WATER_PER_BED_PER_DAY;
        $waterRequired72h = $waterRequiredDaily * 3;

        // Aggregate tank status
        $waterTanks = $tanks->filter(fn($t) => $t->tank_type === TankTelemetry::TYPE_WATER);
        $fuelTanks = $tanks->filter(fn($t) => str_starts_with($t->tank_type, 'fuel_'));

        $totalWater = $waterTanks->sum('current_level_liters');
        $totalFuelCapacityUsed = $fuelTanks->sum('current_level_liters');

        // Calculate hours
        $waterHours = $this->calculateSurvivalHours($totalWater, $waterRequiredDaily);
        
        // Get fuel consumption from configs
        $fuelConfig = $resilienceConfigs->firstWhere('resilience_category', ResourceResilienceConfig::CATEGORY_FUEL);
        $fuelDailyUsage = $fuelConfig?->normal_daily_usage ?? 0;
        $fuelHours = $fuelDailyUsage > 0 
            ? $this->calculateSurvivalHours($totalFuelCapacityUsed, $fuelDailyUsage) 
            : null;

        // Get oxygen status
        $oxygenConfig = $resilienceConfigs->firstWhere('resilience_category', ResourceResilienceConfig::CATEGORY_OXYGEN);

        return [
            'hospital_id' => $hospital->id,
            'hospital_name' => $hospital->name,
            'assessment' => $assessment ? [
                'date' => $assessment->assessment_date,
                'overall_index' => $assessment->overall_safety_index,
                'category' => $assessment->safety_category,
                'structural_score' => $assessment->structural_score,
                'non_structural_score' => $assessment->non_structural_score,
                'emergency_mgmt_score' => $assessment->emergency_mgmt_score,
            ] : null,
            'capacity' => [
                'routine_beds' => $hospital->routine_bed_capacity ?? $hospital->capacity,
                'maximum_beds' => $hospital->maximum_bed_capacity ?? $hospital->capacity,
                'disaster_mode_active' => $hospital->disaster_mode_active,
            ],
            'water' => [
                'tank_count' => $waterTanks->count(),
                'total_liters' => round($totalWater, 2),
                'required_72h_liters' => round($waterRequired72h, 2),
                'daily_usage_liters' => round($waterRequiredDaily, 2),
                'survival_hours' => $waterHours,
                'meets_hsi' => $waterHours >= TankTelemetry::HSI_MINIMUM_HOURS,
                'hsi_required_hours' => TankTelemetry::HSI_MINIMUM_HOURS,
            ],
            'fuel' => [
                'tank_count' => $fuelTanks->count(),
                'total_liters' => round($totalFuelCapacityUsed, 2),
                'daily_usage_liters' => $fuelDailyUsage,
                'survival_hours' => $fuelHours,
                'meets_hsi' => $fuelHours === null ? null : $fuelHours >= ResourceResilienceConfig::HSI_FUEL_HOURS,
                'hsi_required_hours' => ResourceResilienceConfig::HSI_FUEL_HOURS,
            ],
            'oxygen' => $oxygenConfig ? [
                'survival_hours' => $oxygenConfig->current_survival_hours,
                'survival_days' => round($oxygenConfig->current_survival_hours / 24, 1),
                'meets_hsi' => $oxygenConfig->meetsHsiRequirement(),
                'hsi_required_hours' => ResourceResilienceConfig::HSI_OXYGEN_HOURS,
                'hsi_required_days' => ResourceResilienceConfig::HSI_OXYGEN_HOURS / 24,
            ] : null,
            'generator' => $assessment ? [
                'starts_within_10s' => $assessment->generator_starts_within_10s,
                'coverage_percent' => $assessment->generator_coverage_percent,
                'fuel_reserve_hours' => $assessment->fuel_reserve_hours,
            ] : null,
            'vendor_agreements' => [
                'total' => $hospital->vendorAgreements()->count(),
                'active' => $hospital->activeVendorAgreements()->count(),
                'auto_trigger_enabled' => $hospital->activeVendorAgreements()
                    ->where('auto_trigger_enabled', true)->count(),
            ],
        ];
    }

    /**
     * Trigger vendor notification for critical resource shortage
     */
    public function triggerVendorNotification(
        VendorAgreement $vendor, 
        ResourceResilienceConfig $config,
        Hospital $hospital,
        array $context = []
    ): bool {
        if (!$vendor->isValid()) {
            Log::warning('Vendor agreement not valid for trigger', [
                'vendor_id' => $vendor->id,
                'hospital_id' => $hospital->id,
            ]);
            return false;
        }

        try {
            // Send email notification
            Mail::send('emails.vendor-alert', [
                'vendor' => $vendor,
                'hospital' => $hospital,
                'config' => $config,
                'survivalHours' => $config->surge_survival_hours ?? $config->current_survival_hours,
                'resourceCategory' => VendorAgreement::getCategoryLabel($vendor->resource_category),
                'autoOrderQuantity' => $vendor->auto_order_quantity,
                'autoOrderUnit' => $vendor->auto_order_unit,
                'urgency' => $config->resilience_status === ResourceResilienceConfig::STATUS_CRITICAL 
                    ? 'CRITICAL' : 'WARNING',
                'context' => $context,
            ], function ($message) use ($vendor, $hospital) {
                $message->to($vendor->contact_email, $vendor->contact_person)
                        ->subject("[URGENT] Emergency Supply Request from {$hospital->name}");
            });

            // Record the trigger
            $vendor->recordTrigger('auto_threshold_breach', [
                'config_id' => $config->id,
                'survival_hours' => $config->surge_survival_hours,
                'threshold_hours' => $config->hsi_minimum_hours,
            ]);
            $vendor->save();

            Log::info('Vendor notification triggered', [
                'vendor_id' => $vendor->id,
                'hospital_id' => $hospital->id,
                'resource_category' => $config->resilience_category,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send vendor notification', [
                'vendor_id' => $vendor->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Process all auto-triggers for a hospital
     */
    public function processAutoTriggers(Hospital $hospital): array
    {
        $triggered = [];
        
        $criticalConfigs = $hospital->resilienceConfigs()
            ->where('auto_vendor_trigger_enabled', true)
            ->whereNotNull('primary_vendor_id')
            ->get();

        foreach ($criticalConfigs as $config) {
            if ($config->shouldTriggerVendor()) {
                $vendor = $config->primaryVendor;
                
                if ($vendor && $this->triggerVendorNotification($vendor, $config, $hospital)) {
                    $triggered[] = [
                        'vendor_id' => $vendor->id,
                        'vendor_name' => $vendor->vendor_name,
                        'resource_category' => $config->resilience_category,
                        'survival_hours' => $config->surge_survival_hours,
                    ];

                    // Update config alert timestamp
                    $config->last_alert_sent_at = now();
                    $config->alerts_sent_count = ($config->alerts_sent_count ?? 0) + 1;
                    $config->save();
                }
            }
        }

        return $triggered;
    }

    /**
     * Send hospital administrator alert for critical resources
     */
    public function sendAdminAlert(Hospital $hospital, array $criticalAlerts): bool
    {
        if (empty($criticalAlerts) || !$hospital->email) {
            return false;
        }

        try {
            Mail::send('emails.hospital-critical-alert', [
                'hospital' => $hospital,
                'alerts' => $criticalAlerts,
                'timestamp' => now(),
            ], function ($message) use ($hospital) {
                $message->to($hospital->email)
                        ->subject("[HSI CRITICAL] Resource Levels Dangerously Low");
            });

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send admin alert', [
                'hospital_id' => $hospital->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get system-wide resilience dashboard data
     */
    public function getSystemResilience(): array
    {
        $hospitals = Hospital::with([
            'latestSafetyAssessment',
            'resilienceConfigs' => fn($q) => $q->hsiCritical(),
            'activeTanks',
        ])->get();

        $safetyCategories = [
            'A' => $hospitals->where('safety_category', 'A')->count(),
            'B' => $hospitals->where('safety_category', 'B')->count(),
            'C' => $hospitals->where('safety_category', 'C')->count(),
            'unassessed' => $hospitals->whereNull('safety_category')->count(),
        ];

        $criticalResources = ResourceResilienceConfig::critical()
            ->hsiCritical()
            ->with('hospital')
            ->get()
            ->groupBy('resilience_category');

        $criticalTanks = TankTelemetry::active()
            ->inAlert()
            ->with('hospital')
            ->get()
            ->groupBy('tank_type');

        return [
            'total_hospitals' => $hospitals->count(),
            'safety_categories' => $safetyCategories,
            'hospitals_in_disaster_mode' => $hospitals->where('disaster_mode_active', true)->count(),
            'critical_resources' => $criticalResources->map(fn($items) => [
                'count' => $items->count(),
                'hospitals' => $items->pluck('hospital.name')->unique()->values(),
            ]),
            'critical_tanks' => $criticalTanks->map(fn($items) => [
                'count' => $items->count(),
                'hospitals' => $items->pluck('hospital.name')->unique()->values(),
            ]),
            'total_critical_alerts' => $criticalResources->flatten()->count() + $criticalTanks->flatten()->count(),
        ];
    }

    /**
     * Simulate disaster scenario for planning
     */
    public function simulateDisaster(Hospital $hospital, float $surgeMultiplier = 1.5, int $durationHours = 72): array
    {
        $simulation = [
            'hospital_id' => $hospital->id,
            'surge_multiplier' => $surgeMultiplier,
            'duration_hours' => $durationHours,
            'resources' => [],
            'tanks' => [],
            'will_deplete' => [],
        ];

        // Simulate resource depletion
        foreach ($hospital->resilienceConfigs as $config) {
            $normalHours = $this->calculateSurvivalHours(
                $config->resource?->quantity ?? 0,
                $config->normal_daily_usage,
                1.0
            );
            
            $surgeHours = $this->calculateSurvivalHours(
                $config->resource?->quantity ?? 0,
                $config->normal_daily_usage,
                $surgeMultiplier
            );

            $depletes = $surgeHours < $durationHours;

            $simulation['resources'][] = [
                'category' => $config->resilience_category,
                'normal_hours' => $normalHours,
                'surge_hours' => $surgeHours,
                'will_deplete' => $depletes,
                'depletion_hour' => $depletes ? $surgeHours : null,
            ];

            if ($depletes) {
                $simulation['will_deplete'][] = [
                    'type' => 'resource',
                    'category' => $config->resilience_category,
                    'hours_until_depletion' => $surgeHours,
                ];
            }
        }

        // Simulate tank depletion
        foreach ($hospital->activeTanks as $tank) {
            $surgeConsumption = ($tank->surge_daily_consumption ?? $tank->normal_daily_consumption) * $surgeMultiplier;
            $hourlyConsumption = $surgeConsumption / 24;
            $surgeHours = $hourlyConsumption > 0 
                ? round($tank->current_level_liters / $hourlyConsumption, 2)
                : 999999;
            
            $depletes = $surgeHours < $durationHours;

            $simulation['tanks'][] = [
                'tank_id' => $tank->id,
                'tank_type' => $tank->tank_type,
                'current_liters' => $tank->current_level_liters,
                'surge_hours' => $surgeHours,
                'will_deplete' => $depletes,
                'depletion_hour' => $depletes ? $surgeHours : null,
            ];

            if ($depletes) {
                $simulation['will_deplete'][] = [
                    'type' => 'tank',
                    'tank_type' => $tank->tank_type,
                    'hours_until_depletion' => $surgeHours,
                ];
            }
        }

        // Sort depletions by time
        usort($simulation['will_deplete'], fn($a, $b) => $a['hours_until_depletion'] <=> $b['hours_until_depletion']);

        return $simulation;
    }
}
