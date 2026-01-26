<?php
// app/Models/MaintenanceLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceLog extends Model
{
    use HasFactory;

    protected $table = 'maintenance_logs';

    protected $fillable = [
        'asset_id',
        'scheduled_date',
        'completed_date',
        'description',
        'status',        // scheduled, overdue, completed
        'priority',      // low, medium, high
        'technician',
        'cost',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'scheduled_date'  => 'date',
        'completed_date'  => 'date',
        'cost'            => 'decimal:2',
        'status'          => 'string',
        'priority'        => 'string',
    ];

    // ──────────────────────────────────────────────────────────────
    // RELATIONSHIPS (Exactly what your frontend uses)
    // ──────────────────────────────────────────────────────────────
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ──────────────────────────────────────────────────────────────
    // SCOPES (Used heavily in calendar + dashboard)
    // ──────────────────────────────────────────────────────────────
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue')
                     ->where('scheduled_date', '<', today());
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeUpcoming($query, $days = 30)
    {
        return $query->where('status', '!=', 'completed')
                     ->whereBetween('scheduled_date', [today(), today()->addDays($days)]);
    }

    // ──────────────────────────────────────────────────────────────
    // ACCESSORS (Used in Calendar transformation)
    // ──────────────────────────────────────────────────────────────
    public function getIsOverdueAttribute(): bool
    {
        return $this->status !== 'completed' && 
               $this->scheduled_date < today();
    }

    public function getAssetNameAttribute(): string
    {
        return $this->asset?->type ?? 'Unknown Asset';
    }

    public function getAssetLocationAttribute(): ?string
    {
        return $this->asset?->location;
    }

    public function getAssetCategoryAttribute(): ?string
    {
        return $this->asset?->category;
    }
}