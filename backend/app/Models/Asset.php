<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB; 

class Asset extends Model
{
    use HasFactory; 

    protected $table = 'assets';

    protected $fillable = [
        'asset_code', 'type', 'category', 'capacity', 'status', 'location',
        'current_personnel', 'last_maintenance', 'next_maintenance', 'condition',
        'manufacturer', 'model', 'year', 'plate_number', 'fuel_type',
        'mileage', 'fuellevel', 'operating_hours', 'power_source',
        'setup_time', 'flight_time', 'capabilities', 'value',
        'purchase_date', 'created_by', 'latitude', 'longitude'
    ];

    protected $casts = [
        'capabilities' => 'array',
        'last_maintenance' => 'date',
        'next_maintenance' => 'date',
        'purchase_date' => 'date',
        'value' => 'decimal:2',
        'current_fuel_level' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
    ];


    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function maintenanceLogs()
{
    return $this->hasMany(MaintenanceLog::class, 'asset_id');
}
}