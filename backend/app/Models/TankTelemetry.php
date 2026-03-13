<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TankTelemetry extends Model
{
    /**
     * Tank Telemetry Model
     * Tracks water and fuel tank levels for HSI Module 3 compliance
     * Supports manual entry with IoT-ready schema
     * 
     * HSI Requirements:
     * - Water: 300L/bed/day × 72 hours
     * - Fuel: 72 hours at maximum capacity demand
     */

    protected $table = 'tank_telemetry';

    protected $fillable = [
        'hospital_id',
        
        // Tank Identification
        'tank_name',
        'tank_code',
        'tank_type',
        'location_description',
        
        // Specifications
        'total_capacity_liters',
        'usable_capacity_liters',
        'minimum_safe_level_liters',
        
        // Current Levels
        'current_level_liters',
        'current_level_percent',
        'level_recorded_at',
        'recorded_by_user_id',
        'entry_method',
        
        // Consumption
        'normal_daily_consumption',
        'surge_daily_consumption',
        'estimated_hours_remaining',
        'surge_hours_remaining',
        
        // HSI Compliance
        'hsi_required_capacity_liters',
        'meets_hsi_requirement',
        'hsi_compliance_percent',
        
        // Simulation
        'simulation_mode_active',
        'simulation_cutoff_time',
        'simulation_consumption_rate',
        
        // Alerts
        'critical_level_percent',
        'warning_level_percent',
        'refill_level_percent',
        'alert_status',
        'last_alert_at',
        
        // IoT
        'sensor_id',
        'sensor_type',
        'last_sensor_reading_at',
        'sensor_online',
        
        // Refill
        'last_refill_at',
        'last_refill_amount_liters',
        
        'is_active',
        'notes',
    ];

    protected $casts = [
        'total_capacity_liters' => 'decimal:2',
        'usable_capacity_liters' => 'decimal:2',
        'minimum_safe_level_liters' => 'decimal:2',
        'current_level_liters' => 'decimal:2',
        'current_level_percent' => 'decimal:2',
        'normal_daily_consumption' => 'decimal:2',
        'surge_daily_consumption' => 'decimal:2',
        'estimated_hours_remaining' => 'decimal:2',
        'surge_hours_remaining' => 'decimal:2',
        'hsi_required_capacity_liters' => 'decimal:2',
        'hsi_compliance_percent' => 'decimal:2',
        'simulation_consumption_rate' => 'decimal:2',
        'critical_level_percent' => 'decimal:2',
        'warning_level_percent' => 'decimal:2',
        'refill_level_percent' => 'decimal:2',
        'last_refill_amount_liters' => 'decimal:2',
        'meets_hsi_requirement' => 'boolean',
        'simulation_mode_active' => 'boolean',
        'sensor_online' => 'boolean',
        'is_active' => 'boolean',
        'level_recorded_at' => 'datetime',
        'simulation_cutoff_time' => 'datetime',
        'last_sensor_reading_at' => 'datetime',
        'last_alert_at' => 'datetime',
        'last_refill_at' => 'datetime',
    ];

    // Tank types
    public const TYPE_WATER = 'water';
    public const TYPE_FUEL_DIESEL = 'fuel_diesel';
    public const TYPE_FUEL_GASOLINE = 'fuel_gasoline';
    public const TYPE_LPG = 'lpg';
    public const TYPE_OXYGEN = 'oxygen';
    public const TYPE_OTHER = 'other';

    // Alert statuses
    public const ALERT_NORMAL = 'normal';
    public const ALERT_WARNING = 'warning';
    public const ALERT_CRITICAL = 'critical';
    public const ALERT_EMPTY = 'empty';

    // Entry methods
    public const ENTRY_MANUAL = 'manual';
    public const ENTRY_SENSOR = 'sensor';
    public const ENTRY_CALCULATED = 'calculated';

    // HSI constants
    public const HSI_WATER_PER_BED_PER_DAY = 300; // liters
    public const HSI_MINIMUM_HOURS = 72;

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }

    public function levelHistory(): HasMany
    {
        return $this->hasMany(TankLevelHistory::class, 'tank_id');
    }

    /**
     * Update tank level with history tracking
     */
    public function updateLevel(float $newLevelLiters, ?int $userId = null, string $changeType = 'reading', ?string $notes = null): self
    {
        $previousLevel = $this->current_level_liters;
        
        // Calculate percentage
        $capacity = $this->usable_capacity_liters ?? $this->total_capacity_liters;
        $percent = $capacity > 0 ? round(($newLevelLiters / $capacity) * 100, 2) : 0;
        
        // Update current values
        $this->current_level_liters = $newLevelLiters;
        $this->current_level_percent = $percent;
        $this->level_recorded_at = now();
        $this->recorded_by_user_id = $userId;
        $this->entry_method = self::ENTRY_MANUAL;
        
        // Recalculate derived values
        $this->recalculateMetrics();
        
        // Record in history
        $this->levelHistory()->create([
            'level_liters' => $newLevelLiters,
            'level_percent' => $percent,
            'change_type' => $changeType,
            'change_amount_liters' => $newLevelLiters - $previousLevel,
            'recorded_by' => $userId,
            'notes' => $notes,
            'recorded_at' => now(),
        ]);
        
        return $this;
    }

    /**
     * Record a refill
     */
    public function recordRefill(float $amountLiters, ?int $userId = null, ?string $notes = null): self
    {
        $newLevel = min(
            $this->current_level_liters + $amountLiters,
            $this->usable_capacity_liters ?? $this->total_capacity_liters
        );
        
        $this->last_refill_at = now();
        $this->last_refill_amount_liters = $amountLiters;
        
        return $this->updateLevel($newLevel, $userId, 'refill', $notes);
    }

    /**
     * Recalculate all derived metrics
     */
    public function recalculateMetrics(): self
    {
        // Calculate hours remaining at normal consumption
        if ($this->normal_daily_consumption > 0) {
            $hourlyConsumption = $this->normal_daily_consumption / 24;
            $this->estimated_hours_remaining = round($this->current_level_liters / $hourlyConsumption, 2);
        }
        
        // Calculate hours remaining at surge consumption
        if ($this->surge_daily_consumption > 0) {
            $hourlyConsumption = $this->surge_daily_consumption / 24;
            $this->surge_hours_remaining = round($this->current_level_liters / $hourlyConsumption, 2);
        }
        
        // Calculate HSI compliance
        if ($this->hsi_required_capacity_liters > 0) {
            $this->hsi_compliance_percent = round(
                ($this->current_level_liters / $this->hsi_required_capacity_liters) * 100,
                2
            );
            $this->meets_hsi_requirement = $this->current_level_liters >= $this->hsi_required_capacity_liters;
        }
        
        // Determine alert status
        $this->alert_status = $this->determineAlertStatus();
        
        return $this;
    }

    /**
     * Determine alert status based on level percentage
     */
    public function determineAlertStatus(): string
    {
        $percent = $this->current_level_percent;
        
        if ($percent <= 0) {
            return self::ALERT_EMPTY;
        }
        
        if ($percent <= $this->critical_level_percent) {
            return self::ALERT_CRITICAL;
        }
        
        if ($percent <= $this->warning_level_percent) {
            return self::ALERT_WARNING;
        }
        
        return self::ALERT_NORMAL;
    }

    /**
     * Calculate HSI required capacity based on bed count
     */
    public function calculateHsiRequiredCapacity(int $maxBedCapacity): float
    {
        if ($this->tank_type === self::TYPE_WATER) {
            // 300L/bed/day × 72 hours = 300 × 3 = 900L per bed
            return $maxBedCapacity * self::HSI_WATER_PER_BED_PER_DAY * (self::HSI_MINIMUM_HOURS / 24);
        }
        
        // For fuel, use surge daily consumption × 72 hours
        if (str_starts_with($this->tank_type, 'fuel_')) {
            return ($this->surge_daily_consumption ?? $this->normal_daily_consumption ?? 0) * (self::HSI_MINIMUM_HOURS / 24);
        }
        
        return 0;
    }

    /**
     * Start disaster simulation mode
     */
    public function startSimulation(?float $consumptionRate = null): self
    {
        $this->simulation_mode_active = true;
        $this->simulation_cutoff_time = now();
        $this->simulation_consumption_rate = $consumptionRate ?? $this->surge_daily_consumption;
        
        return $this;
    }

    /**
     * Stop disaster simulation mode
     */
    public function stopSimulation(): self
    {
        $this->simulation_mode_active = false;
        $this->simulation_cutoff_time = null;
        $this->simulation_consumption_rate = null;
        
        return $this;
    }

    /**
     * Get simulated current level (accounting for consumption since cutoff)
     */
    public function getSimulatedLevel(): ?float
    {
        if (!$this->simulation_mode_active || !$this->simulation_cutoff_time) {
            return null;
        }
        
        $hoursSinceCutoff = now()->diffInMinutes($this->simulation_cutoff_time) / 60;
        $hourlyConsumption = ($this->simulation_consumption_rate ?? $this->surge_daily_consumption ?? 0) / 24;
        $consumed = $hourlyConsumption * $hoursSinceCutoff;
        
        return max(0, $this->current_level_liters - $consumed);
    }

    /**
     * Get simulated hours until empty
     */
    public function getSimulatedHoursRemaining(): ?float
    {
        $simulatedLevel = $this->getSimulatedLevel();
        
        if ($simulatedLevel === null) {
            return null;
        }
        
        $hourlyConsumption = ($this->simulation_consumption_rate ?? $this->surge_daily_consumption ?? 0) / 24;
        
        if ($hourlyConsumption <= 0) {
            return 999999;
        }
        
        return round($simulatedLevel / $hourlyConsumption, 2);
    }

    /**
     * Scope for active tanks
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for tanks in alert state
     */
    public function scopeInAlert($query)
    {
        return $query->whereIn('alert_status', [self::ALERT_CRITICAL, self::ALERT_WARNING, self::ALERT_EMPTY]);
    }

    /**
     * Scope by tank type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('tank_type', $type);
    }

    /**
     * Scope for HSI non-compliant tanks
     */
    public function scopeHsiNonCompliant($query)
    {
        return $query->where('meets_hsi_requirement', false)
                     ->whereNotNull('hsi_required_capacity_liters');
    }

    /**
     * Get tank type label
     */
    public static function getTypeLabel(string $type): string
    {
        return match($type) {
            self::TYPE_WATER => 'Water',
            self::TYPE_FUEL_DIESEL => 'Diesel Fuel',
            self::TYPE_FUEL_GASOLINE => 'Gasoline',
            self::TYPE_LPG => 'LPG',
            self::TYPE_OXYGEN => 'Oxygen',
            default => 'Other',
        };
    }
}
