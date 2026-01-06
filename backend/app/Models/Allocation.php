<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough; 
class Allocation extends Model
{
    protected $fillable = [
        'request_id',
        'source_hospital_id',
        'destination_hospital_id',
        'resource_type',
        'quantity',
        'handling_class',
        'status',
        'responder_id',
        'created_by',
        'confirmed_by',
        'assigned_by',
        'confirmed_at',
        'assigned_at',
        'dispatched_at',
        'delivered_at',
        'verified_at',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'confirmed_at' => 'datetime',
        'assigned_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Request::class, 'request_id');
    }

    public function sourceHospital(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital::class, 'source_hospital_id');
    }

    public function destinationHospital(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Hospital::class, 'destination_hospital_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function allocationVehicles(): HasMany
    {
        return $this->hasMany(\App\Models\AllocationVehicle::class);
    }


    public function asset(): HasOneThrough
    {
        return $this->hasOneThrough(
            \App\Models\Asset::class,
            \App\Models\AllocationVehicle::class,
            'allocation_id', // Foreign key on AllocationVehicle table
            'id',            // Foreign key on Asset table
            'id',            // Local key on Allocation table
            'asset_id'       // Local key on AllocationVehicle table
        );
    }


    public function responder(): HasOneThrough
    {
        return $this->hasOneThrough(
            \App\Models\Responder::class,
            \App\Models\AllocationVehicle::class,
            'allocation_id',  // Foreign key on AllocationVehicle table
            'id',             // Foreign key on Responder table
            'id',             // Local key on Allocation table
            'responder_id'    // Local key on AllocationVehicle table
        );
    }
}