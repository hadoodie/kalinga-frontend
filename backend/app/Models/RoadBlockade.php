<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class RoadBlockade extends Model
{
    protected $fillable = [
        'title',
        'description',
        'start_lat',
        'start_lng',
        'end_lat',
        'end_lng',
        'road_name',
        'severity',
        'status',
        'reported_by',
        'reported_at',
        'resolved_at',
        'affected_coordinates'
    ];

    protected $casts = [
        'start_lat' => 'decimal:8',
        'start_lng' => 'decimal:8',
        'end_lat' => 'decimal:8',
        'end_lng' => 'decimal:8',
        'reported_at' => 'datetime',
        'resolved_at' => 'datetime',
        'affected_coordinates' => 'array'
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function resolve()
    {
        $this->update([
            'status' => 'resolved',
            'resolved_at' => Carbon::now()
        ]);
    }

    public function getCoordinatesAttribute()
    {
        return [
            'start' => ['lat' => $this->start_lat, 'lng' => $this->start_lng],
            'end' => $this->end_lat && $this->end_lng ? ['lat' => $this->end_lat, 'lng' => $this->end_lng] : null
        ];
    }

    // Get blockades that might affect a route between two points
    public static function getBlockadesForRoute($startLat, $startLng, $endLat, $endLng, $bufferKm = 2)
    {
        // Simple bounding box check with buffer
        $latBuffer = $bufferKm / 111; // Rough conversion km to degrees lat
        $lngBuffer = $bufferKm / (111 * cos(deg2rad(($startLat + $endLat) / 2))); // Adjust for longitude

        $minLat = min($startLat, $endLat) - $latBuffer;
        $maxLat = max($startLat, $endLat) + $latBuffer;
        $minLng = min($startLng, $endLng) - $lngBuffer;
        $maxLng = max($startLng, $endLng) + $lngBuffer;

        return self::where('status', 'active')
            ->where('start_lat', '>=', $minLat)
            ->where('start_lat', '<=', $maxLat)
            ->where('start_lng', '>=', $minLng)
            ->where('start_lng', '<=', $maxLng)
            ->get();
    }
}
