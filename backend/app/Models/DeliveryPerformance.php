<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryPerformance extends Model
{
    protected $table = 'delivery_performance';

    protected $fillable = [
        'allocation_id',
        'asset_id',
        'responder_id',
        'dispatched_at',
        'arrived_at',
        'verified_at',
        'planned_duration_minutes',
        'actual_duration_minutes',
        'distance_km',
        'on_time',
        'cold_chain_compliant',
        'temperature_violations',
        'seal_breaches',
        'issues',
        'meta',
    ];

    protected $casts = [
        'dispatched_at'           => 'datetime',
        'arrived_at'              => 'datetime',
        'verified_at'             => 'datetime',
        'planned_duration_minutes' => 'integer',
        'actual_duration_minutes'  => 'integer',
        'distance_km'             => 'decimal:2',
        'on_time'                 => 'boolean',
        'cold_chain_compliant'    => 'boolean',
        'temperature_violations'  => 'integer',
        'seal_breaches'           => 'integer',
        'meta'                    => 'array',
    ];

    // ── Relationships ───────────────────────────────

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(Allocation::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(Responder::class);
    }

    // ── Scopes ──────────────────────────────────────

    public function scopeOnTime($query)
    {
        return $query->where('on_time', true);
    }

    public function scopeLate($query)
    {
        return $query->where('on_time', false);
    }

    public function scopeColdChainViolations($query)
    {
        return $query->where('cold_chain_compliant', false);
    }

    // ── Accessors ───────────────────────────────────

    public function getDelayMinutesAttribute(): int
    {
        if (!$this->planned_duration_minutes || !$this->actual_duration_minutes) {
            return 0;
        }
        return max(0, $this->actual_duration_minutes - $this->planned_duration_minutes);
    }
}
