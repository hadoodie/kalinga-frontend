<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiSnapshot extends Model
{
    protected $fillable = [
        'snapshot_date',
        'total_requests',
        'fulfilled_requests',
        'avg_response_time_minutes',
        'avg_delivery_time_minutes',
        'cold_chain_compliance_rate',
        'on_time_delivery_rate',
        'buffer_utilization_count',
        'external_procurement_count',
        'active_allocations',
        'temperature_violations',
        'seal_breaches',
        'meta',
    ];

    protected $casts = [
        'snapshot_date'              => 'date',
        'total_requests'             => 'integer',
        'fulfilled_requests'         => 'integer',
        'avg_response_time_minutes'  => 'integer',
        'avg_delivery_time_minutes'  => 'integer',
        'cold_chain_compliance_rate' => 'decimal:2',
        'on_time_delivery_rate'      => 'decimal:2',
        'buffer_utilization_count'   => 'integer',
        'external_procurement_count' => 'integer',
        'active_allocations'         => 'integer',
        'temperature_violations'     => 'integer',
        'seal_breaches'              => 'integer',
        'meta'                       => 'array',
    ];

    // ── Scopes ──────────────────────────────────────

    public function scopeForDate($query, string $date)
    {
        return $query->where('snapshot_date', $date);
    }

    public function scopeLastNDays($query, int $days = 30)
    {
        return $query->where('snapshot_date', '>=', now()->subDays($days)->toDateString());
    }

    // ── Accessors ───────────────────────────────────

    public function getFulfillmentRateAttribute(): float
    {
        if ($this->total_requests === 0) return 0;
        return round(($this->fulfilled_requests / $this->total_requests) * 100, 1);
    }
}
