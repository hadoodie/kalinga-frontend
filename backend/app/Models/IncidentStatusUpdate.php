<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentStatusUpdate extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'incident_id',
        'user_id',
        'status',
        'notes',
    ];

    /**
     * The incident that owns the status update.
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    /**
     * The user who recorded the status update.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
