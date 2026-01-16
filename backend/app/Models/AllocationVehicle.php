<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AllocationVehicle extends Model
{
    protected $table = 'allocation_vehicles';

    protected $fillable = [
        'allocation_id',
        'asset_id',
        'responder_id',
        'assigned_by',
        'assigned_at',
        'notes',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];



    public function allocation(): BelongsTo
    {
        return $this->belongsTo(Allocation::class, 'allocation_id');
    }


    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

 
    public function responder(): BelongsTo
    {
        return $this->belongsTo(Responder::class, 'responder_id');
    }


    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_by');
    }


    public function scopeActive($query)
    {
        return $query->whereHas('allocation', function ($q) {
            $q->whereIn('status', ['logistics_assigned', 'in_transit']);
        });
    }

    public function scopeWithVehicle($query)
    {
        return $query->with('asset');
    }

    public function scopeWithResponder($query)
    {
        return $query->with('responder');
    }
}