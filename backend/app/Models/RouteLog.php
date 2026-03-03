<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_identifier',
        'start_lat',
        'start_lng',
        'dest_lat',
        'dest_lng',
        'route_path',
        'deviations',
        'metadata',
        'distance',
        'duration',
        'deviation_count',
        'started_at',
        'last_recalculated_at',
    ];

    protected $casts = [
        'route_path' => 'array',
        'deviations' => 'array',
        'metadata' => 'array',
        'started_at' => 'datetime',
        'last_recalculated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
