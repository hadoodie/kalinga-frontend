<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TankLevelHistory extends Model
{
    protected $table = 'tank_level_history';

    protected $fillable = [
        'tank_id',
        'level_liters',
        'level_percent',
        'change_type',
        'change_amount_liters',
        'recorded_by',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'level_liters' => 'decimal:2',
        'level_percent' => 'decimal:2',
        'change_amount_liters' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    // Change types
    public const TYPE_READING = 'reading';
    public const TYPE_REFILL = 'refill';
    public const TYPE_CONSUMPTION = 'consumption';
    public const TYPE_ADJUSTMENT = 'adjustment';
    public const TYPE_SIMULATION = 'simulation';

    public function tank(): BelongsTo
    {
        return $this->belongsTo(TankTelemetry::class, 'tank_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Get change type label
     */
    public static function getChangeTypeLabel(string $type): string
    {
        return match($type) {
            self::TYPE_READING => 'Level Reading',
            self::TYPE_REFILL => 'Refill',
            self::TYPE_CONSUMPTION => 'Consumption',
            self::TYPE_ADJUSTMENT => 'Manual Adjustment',
            self::TYPE_SIMULATION => 'Simulation Entry',
            default => 'Unknown',
        };
    }
}
