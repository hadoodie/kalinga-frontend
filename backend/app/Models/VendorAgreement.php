<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorAgreement extends Model
{
    /**
     * Vendor Agreement (MOU) Model
     * Supports automatic vendor mobilization during emergencies
     * Referenced from HSI Module 4, Item 134
     */

    protected $fillable = [
        'hospital_id',
        
        // Vendor Information
        'vendor_name',
        'vendor_code',
        'contact_person',
        'contact_email',
        'contact_phone',
        'contact_phone_alt',
        'address',
        
        // Agreement Details
        'mou_reference_number',
        'agreement_start_date',
        'agreement_end_date',
        'is_active',
        
        // Resource Categories
        'resource_category',
        'resource_subcategory',
        
        // Priority & Response Terms
        'priority_level',
        'guaranteed_response_hours',
        'minimum_order_quantity',
        'minimum_order_unit',
        'maximum_supply_capacity',
        'maximum_supply_unit',
        
        // Pricing Terms
        'unit_price',
        'price_unit',
        'emergency_pricing_applies',
        'emergency_price_multiplier',
        
        // Auto-Trigger Settings
        'auto_trigger_enabled',
        'auto_trigger_threshold_hours',
        'auto_order_quantity',
        'auto_order_unit',
        
        // Notification History
        'last_triggered_at',
        'total_triggers',
        'trigger_history',
        
        // Documents
        'mou_document_path',
        'terms_summary',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'emergency_pricing_applies' => 'boolean',
        'auto_trigger_enabled' => 'boolean',
        'trigger_history' => 'array',
        'agreement_start_date' => 'date',
        'agreement_end_date' => 'date',
        'last_triggered_at' => 'datetime',
        'priority_level' => 'integer',
        'guaranteed_response_hours' => 'integer',
        'minimum_order_quantity' => 'decimal:2',
        'maximum_supply_capacity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'emergency_price_multiplier' => 'decimal:2',
        'auto_trigger_threshold_hours' => 'decimal:2',
        'auto_order_quantity' => 'integer',
        'total_triggers' => 'integer',
    ];

    // Resource categories matching HSI Module 3 critical supplies
    public const CATEGORY_FUEL = 'fuel';
    public const CATEGORY_WATER = 'water';
    public const CATEGORY_MEDICAL_GASES = 'medical_gases';
    public const CATEGORY_MEDICINES = 'medicines';
    public const CATEGORY_FOOD = 'food';
    public const CATEGORY_MEDICAL_SUPPLIES = 'medical_supplies';
    public const CATEGORY_BLOOD_PRODUCTS = 'blood_products';
    public const CATEGORY_PPE = 'ppe';
    public const CATEGORY_OTHER = 'other';

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function resilienceConfigs(): HasMany
    {
        return $this->hasMany(ResourceResilienceConfig::class, 'primary_vendor_id');
    }

    public function backupResilienceConfigs(): HasMany
    {
        return $this->hasMany(ResourceResilienceConfig::class, 'backup_vendor_id');
    }

    /**
     * Check if agreement is currently valid
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();
        
        if ($this->agreement_start_date && $now->lt($this->agreement_start_date)) {
            return false;
        }
        
        if ($this->agreement_end_date && $now->gt($this->agreement_end_date)) {
            return false;
        }
        
        return true;
    }

    /**
     * Record a trigger event
     */
    public function recordTrigger(string $reason, array $details = []): self
    {
        $history = $this->trigger_history ?? [];
        
        $history[] = [
            'triggered_at' => now()->toIso8601String(),
            'reason' => $reason,
            'details' => $details,
        ];

        // Keep last 100 entries
        if (count($history) > 100) {
            $history = array_slice($history, -100);
        }

        $this->trigger_history = $history;
        $this->last_triggered_at = now();
        $this->total_triggers = ($this->total_triggers ?? 0) + 1;
        
        return $this;
    }

    /**
     * Calculate emergency pricing if applicable
     */
    public function getEmergencyPrice(): ?float
    {
        if (!$this->unit_price) {
            return null;
        }
        
        if ($this->emergency_pricing_applies) {
            return round($this->unit_price * $this->emergency_price_multiplier, 2);
        }
        
        return $this->unit_price;
    }

    /**
     * Scope for active and valid agreements
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where(function ($q) {
                         $q->whereNull('agreement_end_date')
                           ->orWhere('agreement_end_date', '>=', now());
                     });
    }

    /**
     * Scope for auto-trigger enabled agreements
     */
    public function scopeAutoTriggerEnabled($query)
    {
        return $query->where('auto_trigger_enabled', true);
    }

    /**
     * Scope by resource category
     */
    public function scopeForCategory($query, string $category)
    {
        return $query->where('resource_category', $category);
    }

    /**
     * Scope ordered by priority
     */
    public function scopeByPriority($query)
    {
        return $query->orderBy('priority_level', 'asc');
    }

    /**
     * Get display name for category
     */
    public static function getCategoryLabel(string $category): string
    {
        return match($category) {
            self::CATEGORY_FUEL => 'Fuel (Diesel/Gasoline)',
            self::CATEGORY_WATER => 'Water',
            self::CATEGORY_MEDICAL_GASES => 'Medical Gases (O2, etc.)',
            self::CATEGORY_MEDICINES => 'Medicines',
            self::CATEGORY_FOOD => 'Food',
            self::CATEGORY_MEDICAL_SUPPLIES => 'Medical Supplies',
            self::CATEGORY_BLOOD_PRODUCTS => 'Blood Products',
            self::CATEGORY_PPE => 'PPE',
            default => 'Other',
        };
    }
}
