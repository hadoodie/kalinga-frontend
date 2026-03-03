<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentResponderAssignment extends Model
{
    use HasFactory;

    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_EN_ROUTE = 'en_route';
    public const STATUS_ON_SCENE = 'on_scene';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'incident_id',
        'responder_id',
        'status',
        'assigned_at',
        'acknowledged_at',
        'completed_at',
        'notes',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'assigned_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * The incident this assignment belongs to.
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    /**
     * The responder assigned to the incident.
     */
    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    /**
     * Determine if the assignment is still active.
     */
    public function isActive(): bool
    {
        return !in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED], true);
    }
}
