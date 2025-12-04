<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Hospital extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'contact_number',
        'contact',
        'email',
        'capacity',
        'type',
        'latitude',
        'longitude',
        'emergency_services',
        
        // HSI Capacity Fields
        'routine_bed_capacity',
        'maximum_bed_capacity',
        'routine_staff_capacity',
        'maximum_staff_capacity',
        
        // HSI Status Fields
        'current_safety_index',
        'safety_category',
        'last_assessment_date',
        'disaster_mode_active',
        'current_surge_multiplier',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'emergency_services' => 'boolean',
        'disaster_mode_active' => 'boolean',
        'current_safety_index' => 'decimal:2',
        'current_surge_multiplier' => 'decimal:2',
        'last_assessment_date' => 'date',
    ];

    // Safety category constants
    public const SAFETY_CATEGORY_A = 'A';
    public const SAFETY_CATEGORY_B = 'B';
    public const SAFETY_CATEGORY_C = 'C';

    // Relationships
    public function resources(): HasMany
    {
        return $this->hasMany(Resource::class);
    }

    // Incoming Allocation Requests
    public function incomingAllocationRequests(): HasMany
    {
        return $this->hasMany(AllocationRequest::class, 'requester_hospital_id');
    }

    // HSI Relationships
    public function safetyAssessments(): HasMany
    {
        return $this->hasMany(HospitalSafetyAssessment::class);
    }

    public function latestSafetyAssessment(): HasOne
    {
        return $this->hasOne(HospitalSafetyAssessment::class)
                    ->whereIn('status', ['completed', 'approved'])
                    ->latest('assessment_date');
    }

    public function vendorAgreements(): HasMany
    {
        return $this->hasMany(VendorAgreement::class);
    }

    public function activeVendorAgreements(): HasMany
    {
        return $this->hasMany(VendorAgreement::class)
                    ->where('is_active', true)
                    ->where(function ($query) {
                        $query->whereNull('agreement_end_date')
                              ->orWhere('agreement_end_date', '>=', now());
                    });
    }

    public function resilienceConfigs(): HasMany
    {
        return $this->hasMany(ResourceResilienceConfig::class);
    }

    public function tanks(): HasMany
    {
        return $this->hasMany(TankTelemetry::class);
    }

    public function activeTanks(): HasMany
    {
        return $this->hasMany(TankTelemetry::class)
                    ->where('is_active', true);
    }

    /**
     * Activate disaster mode with surge multiplier
     */
    public function activateDisasterMode(float $surgeMultiplier = 1.5): self
    {
        $this->disaster_mode_active = true;
        $this->current_surge_multiplier = $surgeMultiplier;
        $this->save();

        // Recalculate all resilience configs
        $this->resilienceConfigs()->each(function ($config) use ($surgeMultiplier) {
            $config->surge_multiplier = $surgeMultiplier;
            $config->recalculate()->save();
        });

        return $this;
    }

    /**
     * Deactivate disaster mode
     */
    public function deactivateDisasterMode(): self
    {
        $this->disaster_mode_active = false;
        $this->current_surge_multiplier = 1.0;
        $this->save();

        return $this;
    }

    /**
     * Get current bed capacity based on mode
     */
    public function getCurrentBedCapacity(): int
    {
        return $this->disaster_mode_active 
            ? ($this->maximum_bed_capacity ?? $this->capacity)
            : ($this->routine_bed_capacity ?? $this->capacity);
    }

    /**
     * Get HSI compliance summary
     */
    public function getHsiComplianceSummary(): array
    {
        $tanks = $this->activeTanks()->get();
        $compliantTanks = $tanks->where('meets_hsi_requirement', true)->count();
        $totalTanks = $tanks->count();

        $resilienceConfigs = $this->resilienceConfigs()->hsiCritical()->get();
        $compliantConfigs = $resilienceConfigs->filter(fn($c) => $c->meetsHsiRequirement())->count();
        $totalConfigs = $resilienceConfigs->count();

        return [
            'tanks' => [
                'compliant' => $compliantTanks,
                'total' => $totalTanks,
                'percent' => $totalTanks > 0 ? round(($compliantTanks / $totalTanks) * 100, 1) : 0,
            ],
            'resources' => [
                'compliant' => $compliantConfigs,
                'total' => $totalConfigs,
                'percent' => $totalConfigs > 0 ? round(($compliantConfigs / $totalConfigs) * 100, 1) : 0,
            ],
            'safety_index' => $this->current_safety_index,
            'safety_category' => $this->safety_category,
            'disaster_mode' => $this->disaster_mode_active,
        ];
    }

    /**
     * Scope for hospitals in disaster mode
     */
    public function scopeInDisasterMode($query)
    {
        return $query->where('disaster_mode_active', true);
    }

    /**
     * Scope for hospitals by safety category
     */
    public function scopeBySafetyCategory($query, string $category)
    {
        return $query->where('safety_category', $category);
    }

    /**
     * Scope for hospitals needing HSI attention (Category B or C)
     */
    public function scopeNeedsHsiAttention($query)
    {
        return $query->whereIn('safety_category', [self::SAFETY_CATEGORY_B, self::SAFETY_CATEGORY_C]);
    }
}
