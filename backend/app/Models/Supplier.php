<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'average_delivery_days',
        'reliability_score',
        'total_orders',
        'on_time_deliveries',
        'is_active',
        'capabilities',
        'meta',
    ];

    protected $casts = [
        'average_delivery_days' => 'decimal:1',
        'reliability_score'     => 'decimal:2',
        'total_orders'          => 'integer',
        'on_time_deliveries'    => 'integer',
        'is_active'             => 'boolean',
        'capabilities'          => 'array',
        'meta'                  => 'array',
    ];

    // ── Relationships ───────────────────────────────

    public function supplyOrders(): HasMany
    {
        return $this->hasMany(SupplyOrder::class);
    }

    // ── Scopes ──────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeReliable($query, float $minScore = 0.8)
    {
        return $query->where('reliability_score', '>=', $minScore);
    }

    // ── Methods ─────────────────────────────────────

    /**
     * Recalculate reliability score from order history.
     */
    public function recalculateReliability(): self
    {
        if ($this->total_orders > 0) {
            $this->reliability_score = round($this->on_time_deliveries / $this->total_orders, 2);
            $this->save();
        }
        return $this;
    }
}
