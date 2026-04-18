<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentWebsocketMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'incident_id',
        'user_id',
        'event_name',
        'client_received_at_ms',
        'incident_reported_at_ms',
        'propagation_delay_ms',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
