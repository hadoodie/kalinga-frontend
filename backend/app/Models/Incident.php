<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Incident extends Model
{
    public const STATUS_REPORTED = 'reported';
    public const STATUS_ACKNOWLEDGED = 'acknowledged';
    public const STATUS_EN_ROUTE = 'en_route';
    public const STATUS_ON_SCENE = 'on_scene';
    public const STATUS_NEEDS_SUPPORT = 'needs_support';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @return array<int, string>
     */
    public static function allowedStatuses(): array
    {
        return [
            self::STATUS_REPORTED,
            self::STATUS_ACKNOWLEDGED,
            self::STATUS_EN_ROUTE,
            self::STATUS_ON_SCENE,
            self::STATUS_NEEDS_SUPPORT,
            self::STATUS_RESOLVED,
            self::STATUS_CANCELLED,
        ];
    }

    protected $fillable = [
        'type',
        'location',
        'latlng',
        'description',
        'user_id',
        'status',
        'assigned_responder_id',
        'assigned_at',
        'completed_at',
        'responders_required',
        'metadata',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedResponder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_responder_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(IncidentResponderAssignment::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->assignments()->whereNotIn('status', [
            IncidentResponderAssignment::STATUS_COMPLETED,
            IncidentResponderAssignment::STATUS_CANCELLED,
        ]);
    }

    public function statusUpdates(): HasMany
    {
        return $this->hasMany(IncidentStatusUpdate::class)->orderByDesc('created_at');
    }

    public function latestStatusUpdate(): HasOne
    {
        return $this->hasOne(IncidentStatusUpdate::class)->latestOfMany();
    }

    public function getRespondersAssignedCountAttribute(): int
    {
        return $this->assignments()->count();
    }

    public function getIsFulfilledAttribute(): bool
    {
        if ($this->responders_required <= 0) {
            return false;
        }

        $assignments = $this->relationLoaded('assignments')
            ? $this->assignments
            : $this->assignments()->get();

        return $assignments
            ->where('status', '!=', IncidentResponderAssignment::STATUS_CANCELLED)
            ->count() >= $this->responders_required;
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_REPORTED;
    }

    public function assignToResponder(int $responderId): IncidentResponderAssignment
    {
        $assignment = IncidentResponderAssignment::updateOrCreate(
            [
                'incident_id' => $this->id,
                'responder_id' => $responderId,
            ],
            [
                'status' => IncidentResponderAssignment::STATUS_ASSIGNED,
                'assigned_at' => now(),
            ]
        );

        if ($this->status === self::STATUS_REPORTED) {
            $this->forceFill([
                'status' => self::STATUS_ACKNOWLEDGED,
                'assigned_responder_id' => $responderId,
                'assigned_at' => now(),
            ])->save();
        }

        return $assignment->fresh(['responder']);
    }

    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_RESOLVED,
            'completed_at' => now(),
        ]);
    }
}
