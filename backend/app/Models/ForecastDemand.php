<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForecastDemand extends Model
{
    protected $table = 'forecast_demand_hourly';

    protected $fillable = [
        'hospital_id',
        'resource_id',
        'forecast_time',
        'horizon_h',
        'yhat',
        'yhat_lower',
        'yhat_upper',
        'feature_snapshot',
        'model_version',
        'generated_at',
    ];

    protected $casts = [
        'forecast_time'    => 'datetime',
        'generated_at'     => 'datetime',
        'yhat'             => 'decimal:4',
        'yhat_lower'       => 'decimal:4',
        'yhat_upper'       => 'decimal:4',
        'feature_snapshot'  => 'array',
        'horizon_h'        => 'integer',
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

    /**
     * Latest generation only (discard stale runs).
     * Uses a subquery to avoid a separate MAX() call (was N+1).
     */
    public function scopeLatestRun($query)
    {
        return $query->where('generated_at', function ($sub) {
            $sub->selectRaw('MAX(generated_at)')->from($this->getTable());
        });
    }

    /**
     * Filter to a specific generation run timestamp.
     * Use this when you've already resolved the latest run to avoid redundant subqueries.
     */
    public function scopeForRun($query, $generatedAt)
    {
        return $query->where('generated_at', $generatedAt);
    }

    /**
     * Filter by hospital.
     */
    public function scopeForHospital($query, int $hospitalId)
    {
        return $query->where('hospital_id', $hospitalId);
    }

    /**
     * Filter by resource.
     */
    public function scopeForResource($query, int $resourceId)
    {
        return $query->where('resource_id', $resourceId);
    }

    /**
     * Next N hours from now.
     */
    public function scopeNextHours($query, int $hours = 48)
    {
        return $query->where('forecast_time', '>=', now())
                     ->where('forecast_time', '<=', now()->addHours($hours));
    }
}
