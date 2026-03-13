<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceResilienceConfig extends Model
{
    /**
     * Resource Resilience Configuration Model
     * Calculates "Survival Hours" per HSI Module 3 requirements
     * 
     * Formula: SurvivalHours = CurrentStock / (NormalDailyUsage × SurgeMultiplier)
     * 
     * Critical Thresholds (from HSI):
     * - Fuel: 72 hours minimum
     * - Water: 72 hours minimum
     * - Oxygen: 15 days (360 hours) minimum
     */

    protected $fillable = [
        'resource_id',
        'hospital_id',
        'resilience_category',
        
        // Consumption Rates
        'normal_daily_usage',
        'usage_unit',
        'usage_per_bed',
        'usage_per_patient',
        
        // Surge Configuration
        'surge_multiplier',
        'max_surge_multiplier',
        
        // Thresholds
        'critical_threshold_hours',
        'warning_threshold_hours',
        'optimal_threshold_hours',
        
        // HSI Requirements
        'is_hsi_critical',
        'hsi_minimum_hours',
        'hsi_requirement_notes',
        
        // Calculated Status
        'current_survival_hours',
        'surge_survival_hours',
        'resilience_status',
        'last_calculated_at',
        
        // Alert Configuration
        'alerts_enabled',
        'auto_vendor_trigger_enabled',
        'primary_vendor_id',
        'backup_vendor_id',
        
        // Alert History
        'last_alert_sent_at',
        'alerts_sent_count',
        
        'notes',
    ];

    protected $casts = [
        'normal_daily_usage' => 'decimal:2',
        'usage_per_bed' => 'decimal:4',
        'usage_per_patient' => 'decimal:4',
        'surge_multiplier' => 'decimal:2',
        'max_surge_multiplier' => 'decimal:2',
        'critical_threshold_hours' => 'decimal:2',
        'warning_threshold_hours' => 'decimal:2',
        'optimal_threshold_hours' => 'decimal:2',
        'is_hsi_critical' => 'boolean',
        'hsi_minimum_hours' => 'decimal:2',
        'current_survival_hours' => 'decimal:2',
        'surge_survival_hours' => 'decimal:2',
        'alerts_enabled' => 'boolean',
        'auto_vendor_trigger_enabled' => 'boolean',
        'last_calculated_at' => 'datetime',
        'last_alert_sent_at' => 'datetime',
        'alerts_sent_count' => 'integer',
    ];

    // Resilience categories
    public const CATEGORY_FUEL = 'fuel';
    public const CATEGORY_WATER = 'water';
    public const CATEGORY_OXYGEN = 'oxygen';
    public const CATEGORY_MEDICAL_GASES_OTHER = 'medical_gases_other';
    public const CATEGORY_MEDICINES_CRITICAL = 'medicines_critical';
    public const CATEGORY_BLOOD_PRODUCTS = 'blood_products';
    public const CATEGORY_FOOD = 'food';
    public const CATEGORY_PPE = 'ppe';
    public const CATEGORY_OTHER = 'other';

    // Status levels
    public const STATUS_CRITICAL = 'critical';
    public const STATUS_WARNING = 'warning';
    public const STATUS_ADEQUATE = 'adequate';
    public const STATUS_OPTIMAL = 'optimal';

    // HSI Default thresholds
    public const HSI_FUEL_HOURS = 72;
    public const HSI_WATER_HOURS = 72;
    public const HSI_OXYGEN_HOURS = 360; // 15 days

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function primaryVendor(): BelongsTo
    {
        return $this->belongsTo(VendorAgreement::class, 'primary_vendor_id');
    }

    public function backupVendor(): BelongsTo
    {
        return $this->belongsTo(VendorAgreement::class, 'backup_vendor_id');
    }

    /**
     * Calculate survival hours at normal consumption rate
     */
    public function calculateSurvivalHours(?float $currentStock = null): float
    {
        $stock = $currentStock ?? $this->resource?->quantity ?? 0;
        
        if ($this->normal_daily_usage <= 0) {
            return 999999; // Infinite if no consumption
        }
        
        $hourlyUsage = $this->normal_daily_usage / 24;
        return round($stock / $hourlyUsage, 2);
    }

    /**
     * Calculate survival hours during surge/disaster mode
     */
    public function calculateSurgeSurvivalHours(?float $currentStock = null, ?float $surgeMultiplier = null): float
    {
        $stock = $currentStock ?? $this->resource?->quantity ?? 0;
        $multiplier = $surgeMultiplier ?? $this->surge_multiplier ?? 1.5;
        
        if ($this->normal_daily_usage <= 0) {
            return 999999;
        }
        
        $hourlyUsage = ($this->normal_daily_usage * $multiplier) / 24;
        return round($stock / $hourlyUsage, 2);
    }

    /**
     * Determine resilience status based on thresholds
     */
    public function determineStatus(?float $survivalHours = null): string
    {
        $hours = $survivalHours ?? $this->current_survival_hours ?? 0;
        
        if ($hours <= $this->critical_threshold_hours) {
            return self::STATUS_CRITICAL;
        }
        
        if ($hours <= $this->warning_threshold_hours) {
            return self::STATUS_WARNING;
        }
        
        if ($hours >= $this->optimal_threshold_hours) {
            return self::STATUS_OPTIMAL;
        }
        
        return self::STATUS_ADEQUATE;
    }

    /**
     * Check if meets HSI minimum requirements
     */
    public function meetsHsiRequirement(): bool
    {
        if (!$this->is_hsi_critical || !$this->hsi_minimum_hours) {
            return true;
        }
        
        return ($this->current_survival_hours ?? 0) >= $this->hsi_minimum_hours;
    }

    /**
     * Recalculate and save current status
     */
    public function recalculate(?float $currentStock = null): self
    {
        $this->current_survival_hours = $this->calculateSurvivalHours($currentStock);
        $this->surge_survival_hours = $this->calculateSurgeSurvivalHours($currentStock);
        $this->resilience_status = $this->determineStatus();
        $this->last_calculated_at = now();
        
        return $this;
    }

    /**
     * Check if auto-trigger threshold is breached
     */
    public function shouldTriggerVendor(): bool
    {
        if (!$this->auto_vendor_trigger_enabled) {
            return false;
        }
        
        if (!$this->primary_vendor_id) {
            return false;
        }
        
        // Use surge survival hours for trigger decision (worst case)
        $hours = $this->surge_survival_hours ?? $this->current_survival_hours ?? 0;
        $threshold = $this->hsi_minimum_hours ?? $this->critical_threshold_hours ?? 72;
        
        return $hours <= $threshold;
    }

    /**
     * Get default HSI threshold for category
     */
    public static function getHsiThreshold(string $category): float
    {
        return match($category) {
            self::CATEGORY_FUEL => self::HSI_FUEL_HOURS,
            self::CATEGORY_WATER => self::HSI_WATER_HOURS,
            self::CATEGORY_OXYGEN => self::HSI_OXYGEN_HOURS,
            default => 72,
        };
    }

    /**
     * Check if this is an HSI-tracked critical resource
     */
    public static function isHsiCriticalCategory(string $category): bool
    {
        return in_array($category, [
            self::CATEGORY_FUEL,
            self::CATEGORY_WATER,
            self::CATEGORY_OXYGEN,
        ]);
    }

    /**
     * Scope for critical status resources
     */
    public function scopeCritical($query)
    {
        return $query->where('resilience_status', self::STATUS_CRITICAL);
    }

    /**
     * Scope for warning or critical status
     */
    public function scopeNeedsAttention($query)
    {
        return $query->whereIn('resilience_status', [self::STATUS_CRITICAL, self::STATUS_WARNING]);
    }

    /**
     * Scope for HSI-critical resources
     */
    public function scopeHsiCritical($query)
    {
        return $query->where('is_hsi_critical', true);
    }

    /**
     * Scope by hospital
     */
    public function scopeForHospital($query, int $hospitalId)
    {
        return $query->where('hospital_id', $hospitalId);
    }

    /**
     * Get status label
     */
    public static function getStatusLabel(string $status): string
    {
        return match($status) {
            self::STATUS_CRITICAL => 'Critical - Immediate Action Required',
            self::STATUS_WARNING => 'Warning - Below Safe Levels',
            self::STATUS_ADEQUATE => 'Adequate - Within Safe Range',
            self::STATUS_OPTIMAL => 'Optimal - Exceeds Requirements',
            default => 'Unknown',
        };
    }

    /**
     * Get status color for UI
     */
    public static function getStatusColor(string $status): string
    {
        return match($status) {
            self::STATUS_CRITICAL => 'red',
            self::STATUS_WARNING => 'yellow',
            self::STATUS_ADEQUATE => 'blue',
            self::STATUS_OPTIMAL => 'green',
            default => 'gray',
        };
    }
}
