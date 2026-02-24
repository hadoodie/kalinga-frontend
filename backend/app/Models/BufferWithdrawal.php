<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BufferWithdrawal extends Model
{
    protected $fillable = [
        'buffer_stock_id',
        'request_id',
        'allocation_id',
        'hospital_id',
        'quantity',
        'requested_by',
        'approved_by',
        'requested_at',
        'approved_at',
        'status',
        'reason',
        'approval_notes',
        'meta',
    ];

    protected $casts = [
        'quantity'     => 'decimal:4',
        'requested_at' => 'datetime',
        'approved_at'  => 'datetime',
        'meta'         => 'array',
    ];

    // ── Relationships ───────────────────────────────

    public function bufferStock(): BelongsTo
    {
        return $this->belongsTo(BufferStock::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(Allocation::class);
    }

    public function hospital(): BelongsTo
    {
        return $this->belongsTo(Hospital::class);
    }

    public function requestedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ── Scopes ──────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
