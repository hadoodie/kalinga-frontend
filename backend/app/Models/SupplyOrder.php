<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplyOrder extends Model
{
    protected $fillable = [
        'supplier_id',
        'resource_name',
        'resource_sku',
        'quantity_ordered',
        'quantity_received',
        'unit_price',
        'status',
        'expected_delivery_date',
        'actual_delivery_date',
        'created_by',
        'received_by',
        'notes',
        'meta',
    ];

    protected $casts = [
        'quantity_ordered'       => 'decimal:4',
        'quantity_received'      => 'decimal:4',
        'unit_price'             => 'decimal:4',
        'expected_delivery_date' => 'date',
        'actual_delivery_date'   => 'date',
        'meta'                   => 'array',
    ];

    // ── Relationships ───────────────────────────────

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // ── Scopes ──────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', 'received')
                     ->where('status', '!=', 'cancelled')
                     ->where('expected_delivery_date', '<', now());
    }

    // ── Accessors ───────────────────────────────────

    public function getTotalCostAttribute(): float
    {
        return round($this->quantity_received * ($this->unit_price ?? 0), 4);
    }

    public function getIsOverdueAttribute(): bool
    {
        if (in_array($this->status, ['received', 'cancelled'])) return false;
        return $this->expected_delivery_date && $this->expected_delivery_date->isPast();
    }
}
