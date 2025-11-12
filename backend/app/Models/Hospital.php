<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'contact_number',
        'contact',
        'email',
        'capacity',
        'type',
        'latitude',
        'longitude',
        'emergency_services'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'emergency_services' => 'boolean'
    ];

    // Relationships
    public function resources()
    {
        return $this->hasMany(Resource::class);
    }

    // Incoming Allocation Requests
    public function incomingAllocationRequests()
    {
        return $this->hasMany(AllocationRequest::class, 'requester_hospital_id');
    }
}
