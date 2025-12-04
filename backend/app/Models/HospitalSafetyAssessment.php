<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalSafetyAssessment extends Model
{
    /**
     * Hospital Safety Index Assessment Model
     * Based on Philippine DOH/WHO Hospital Safety Index (December 2016)
     * 
     * Scoring Weights:
     * - Module 2 (Structural): 50%
     * - Module 3 (Non-Structural): 30%
     * - Module 4 (Emergency Management): 20%
     * 
     * Safety Categories:
     * - A: Safe (66-100) - Hospital likely to remain functional
     * - B: Intervention needed (36-65) - Lives not at immediate risk, may be damaged
     * - C: Urgent action required (0-35) - High probability of not functioning
     */

    protected $fillable = [
        'hospital_id',
        'assessor_id',
        
        // General Information (Form 1)
        'routine_bed_capacity',
        'maximum_bed_capacity',
        'routine_staff_count',
        'maximum_staff_count',
        'catchment_facilities',
        
        // Module 1: Hazards
        'hazards_geological',
        'hazards_hydrometeorological',
        'hazards_biological',
        'hazards_societal',
        
        // Module 2: Structural Safety
        'structural_score',
        'has_prior_damage',
        'meets_current_standards',
        'has_soft_floors',
        'has_short_columns',
        'structural_details',
        
        // Module 3: Non-Structural Safety
        'non_structural_score',
        'generator_starts_within_10s',
        'generator_coverage_percent',
        'fuel_reserve_hours',
        'water_reserve_liters',
        'water_consumption_per_bed_day',
        'water_reserve_hours',
        'oxygen_reserve_days',
        'oxygen_meets_15day_requirement',
        'heavy_equipment_anchored',
        'non_structural_details',
        
        // Module 4: Emergency Management
        'emergency_mgmt_score',
        'has_disaster_committee',
        'has_eoc',
        'has_backup_communications',
        'has_vendor_mous',
        'has_staff_contact_list',
        'emergency_mgmt_details',
        
        // Overall
        'overall_safety_index',
        'safety_category',
        'assessment_date',
        'next_assessment_due',
        'status',
        'notes',
    ];

    protected $casts = [
        'catchment_facilities' => 'array',
        'hazards_geological' => 'array',
        'hazards_hydrometeorological' => 'array',
        'hazards_biological' => 'array',
        'hazards_societal' => 'array',
        'structural_details' => 'array',
        'non_structural_details' => 'array',
        'emergency_mgmt_details' => 'array',
        'has_prior_damage' => 'boolean',
        'meets_current_standards' => 'boolean',
        'has_soft_floors' => 'boolean',
        'has_short_columns' => 'boolean',
        'generator_starts_within_10s' => 'boolean',
        'oxygen_meets_15day_requirement' => 'boolean',
        'heavy_equipment_anchored' => 'boolean',
        'has_disaster_committee' => 'boolean',
        'has_eoc' => 'boolean',
        'has_backup_communications' => 'boolean',
        'has_vendor_mous' => 'boolean',
        'has_staff_contact_list' => 'boolean',
        'structural_score' => 'decimal:2',
        'non_structural_score' => 'decimal:2',
        'emergency_mgmt_score' => 'decimal:2',
        'overall_safety_index' => 'decimal:2',
        'fuel_reserve_hours' => 'decimal:2',
        'water_reserve_liters' => 'decimal:2',
        'water_consumption_per_bed_day' => 'decimal:2',
        'water_reserve_hours' => 'decimal:2',
        'oxygen_reserve_days' => 'decimal:2',
        'assessment_date' => 'date',
        'next_assessment_due' => 'date',
    ];

    // Weight constants for WHO scoring model
    public const STRUCTURAL_WEIGHT = 0.50;
    public const NON_STRUCTURAL_WEIGHT = 0.30;
    public const EMERGENCY_MGMT_WEIGHT = 0.20;

    // Safety category thresholds
    public const CATEGORY_A_MIN = 66;
    public const CATEGORY_B_MIN = 36;

    // HSI Module 3 Requirements
    public const FUEL_MINIMUM_HOURS = 72;
    public const WATER_MINIMUM_HOURS = 72;
    public const WATER_LITERS_PER_BED_DAY = 300;
    public const OXYGEN_MINIMUM_DAYS = 15;

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessor_id');
    }

    /**
     * Calculate the overall safety index using WHO weighted model
     */
    public function calculateOverallIndex(): float
    {
        $weighted = 
            ($this->structural_score * self::STRUCTURAL_WEIGHT) +
            ($this->non_structural_score * self::NON_STRUCTURAL_WEIGHT) +
            ($this->emergency_mgmt_score * self::EMERGENCY_MGMT_WEIGHT);
        
        return round($weighted, 2);
    }

    /**
     * Determine safety category based on overall index
     */
    public function determineSafetyCategory(): string
    {
        $index = $this->overall_safety_index;
        
        if ($index >= self::CATEGORY_A_MIN) {
            return 'A';
        } elseif ($index >= self::CATEGORY_B_MIN) {
            return 'B';
        }
        return 'C';
    }

    /**
     * Calculate water reserve hours based on capacity
     */
    public function calculateWaterReserveHours(): float
    {
        $dailyUsage = $this->maximum_bed_capacity * $this->water_consumption_per_bed_day;
        
        if ($dailyUsage <= 0) {
            return 0;
        }
        
        $hourlyUsage = $dailyUsage / 24;
        return round($this->water_reserve_liters / $hourlyUsage, 2);
    }

    /**
     * Check if all HSI Module 3 requirements are met
     */
    public function meetsModule3Requirements(): bool
    {
        return $this->fuel_reserve_hours >= self::FUEL_MINIMUM_HOURS
            && $this->water_reserve_hours >= self::WATER_MINIMUM_HOURS
            && $this->oxygen_reserve_days >= self::OXYGEN_MINIMUM_DAYS
            && $this->generator_starts_within_10s
            && $this->generator_coverage_percent >= 100;
    }

    /**
     * Get compliance status for each critical system
     */
    public function getComplianceStatus(): array
    {
        return [
            'fuel' => [
                'current_hours' => $this->fuel_reserve_hours,
                'required_hours' => self::FUEL_MINIMUM_HOURS,
                'compliant' => $this->fuel_reserve_hours >= self::FUEL_MINIMUM_HOURS,
                'deficit_hours' => max(0, self::FUEL_MINIMUM_HOURS - $this->fuel_reserve_hours),
            ],
            'water' => [
                'current_hours' => $this->water_reserve_hours,
                'required_hours' => self::WATER_MINIMUM_HOURS,
                'compliant' => $this->water_reserve_hours >= self::WATER_MINIMUM_HOURS,
                'deficit_hours' => max(0, self::WATER_MINIMUM_HOURS - $this->water_reserve_hours),
            ],
            'oxygen' => [
                'current_days' => $this->oxygen_reserve_days,
                'required_days' => self::OXYGEN_MINIMUM_DAYS,
                'compliant' => $this->oxygen_reserve_days >= self::OXYGEN_MINIMUM_DAYS,
                'deficit_days' => max(0, self::OXYGEN_MINIMUM_DAYS - $this->oxygen_reserve_days),
            ],
            'generator' => [
                'starts_in_10s' => $this->generator_starts_within_10s,
                'coverage_percent' => $this->generator_coverage_percent,
                'compliant' => $this->generator_starts_within_10s && $this->generator_coverage_percent >= 100,
            ],
        ];
    }

    /**
     * Recalculate and save all computed fields
     */
    public function recalculateScores(): self
    {
        $this->water_reserve_hours = $this->calculateWaterReserveHours();
        $this->oxygen_meets_15day_requirement = $this->oxygen_reserve_days >= self::OXYGEN_MINIMUM_DAYS;
        $this->overall_safety_index = $this->calculateOverallIndex();
        $this->safety_category = $this->determineSafetyCategory();
        
        return $this;
    }

    /**
     * Scope for assessments needing review
     */
    public function scopeNeedsReview($query)
    {
        return $query->where('next_assessment_due', '<=', now())
                     ->orWhere('safety_category', 'C');
    }

    /**
     * Scope for critical hospitals (Category C)
     */
    public function scopeCritical($query)
    {
        return $query->where('safety_category', 'C');
    }

    /**
     * Scope for completed assessments
     */
    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['completed', 'approved']);
    }
}
