<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Request extends Model
{
    use HasFactory;
    const STATUS_PENDING      = 'pending';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_MATCHED      = 'matched';
    const STATUS_ALLOCATED    = 'allocated';
    const STATUS_IN_TRANSIT   = 'in_transit';
    const STATUS_DELIVERED    = 'delivered';
    const STATUS_VERIFIED     = 'verified';
    const STATUS_REJECTED     = 'rejected';
    const STATUS_FAILED       = 'failed';

    protected $fillable = [
        'hospital_id',
        'resource_id',
        'resource_name',
        'quantity',
        'urgency_level',
        'handling_class',
        'reason',
        'status',
        'rejection_reason',
        'created_by',
        'meta'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    public static function canTransitionFromTo($from, $to): bool
    {
        $allowed = [
            self::STATUS_PENDING      => [self::STATUS_UNDER_REVIEW, self::STATUS_REJECTED],
            self::STATUS_UNDER_REVIEW => [self::STATUS_MATCHED, self::STATUS_REJECTED, self::STATUS_FAILED],
            self::STATUS_MATCHED      => [self::STATUS_ALLOCATED, self::STATUS_FAILED],
            self::STATUS_ALLOCATED    => [self::STATUS_IN_TRANSIT],
            self::STATUS_IN_TRANSIT   => [self::STATUS_DELIVERED],
            self::STATUS_DELIVERED    => [self::STATUS_VERIFIED],
        ];

        return in_array($to, $allowed[$from] ?? []);
    }

    // Relationships
    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeMyHospital($query)
    {
        return $query->where('hospital_id', auth()->user()->hospital_id);
    }

    public function scopeCritical($query)
    {
        return $query->where('urgency_level', 'Critical');
    }
}