<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForecastRisk extends Model
{
    protected $table = 'forecast_risk_hourly';

    protected $fillable = [
        'hospital_id',
        'resource_id',
        'forecast_time',
        'horizon_h',
        'risk_prob',
        'projected_stock',
        'days_until_stockout',
        'risk_level',
        'risk_factors',
        'model_version',
        'generated_at',
    ];

    protected $casts = [
        'forecast_time'        => 'datetime',
        'generated_at'         => 'datetime',
        'risk_prob'            => 'decimal:4',
        'projected_stock'      => 'decimal:4',
        'days_until_stockout'  => 'decimal:2',
        'risk_factors'         => 'array',
        'horizon_h'            => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeLatestRun($query)
    {
        $latest = static::max('generated_at');
        return $query->where('generated_at', $latest);
    }

    public function scopeForHospital($query, int $hospitalId)
    {
        return $query->where('hospital_id', $hospitalId);
    }

    public function scopeForResource($query, int $resourceId)
    {
        return $query->where('resource_id', $resourceId);
    }

    public function scopeNextHours($query, int $hours = 48)
    {
        return $query->where('forecast_time', '>=', now())
                     ->where('forecast_time', '<=', now()->addHours($hours));
    }

    /**
     * Only high / critical items.
     */
    public function scopeHighRisk($query)
    {
        return $query->whereIn('risk_level', ['high', 'critical']);
    }

    /**
     * Items at risk within N hours.
     */
    public function scopeAtRiskWithin($query, int $hours = 24)
    {
        return $query->where('risk_prob', '>=', 0.6)
                     ->where('forecast_time', '<=', now()->addHours($hours));
    }

    // ── Helpers ────────────────────────────────────────────────

    /**
     * Derive risk_level from risk_prob.
     */
    public static function levelFromProbability(float $prob): string
    {
        return match (true) {
            $prob >= 0.85 => 'critical',
            $prob >= 0.65 => 'high',
            $prob >= 0.35 => 'medium',
            default       => 'low',
        };
    }
}
