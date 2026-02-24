<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BufferStock extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'category',
        'unit',
        'handling_class',
        'quantity',
        'minimum_level',
        'critical_level',
        'requires_refrigeration',
        'expiry_date',
        'batch_number',
        'manufacturer',
        'meta',
    ];

    protected $casts = [
        'quantity'               => 'decimal:4',
        'minimum_level'          => 'decimal:4',
        'critical_level'         => 'decimal:4',
        'requires_refrigeration' => 'boolean',
        'expiry_date'            => 'date',
        'meta'                   => 'array',
    ];

    // ── Relationships ───────────────────────────────

    public function withdrawals(): HasMany
    {
        return $this->hasMany(BufferWithdrawal::class);
    }

    // ── Scopes ──────────────────────────────────────

    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity', '<=', 'minimum_level')
                     ->where('quantity', '>', 0);
    }

    public function scopeCritical($query)
    {
        return $query->whereColumn('quantity', '<=', 'critical_level');
    }

    public function scopeByHandlingClass($query, string $class)
    {
        return $query->where('handling_class', $class);
    }
}
