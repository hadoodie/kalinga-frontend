<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $fillable = [
        'type', 
        'location', 
        'latlng', 
        'description', 
        'user_id',
        'status',
        'assigned_responder_id',
        'assigned_at',
        'completed_at'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedResponder()
    {
        return $this->belongsTo(User::class, 'assigned_responder_id');
    }

    public function isAvailable()
    {
        return $this->status === 'available';
    }

    public function assignToResponder($responderId)
    {
        $this->update([
            'status' => 'assigned',
            'assigned_responder_id' => $responderId,
            'assigned_at' => now(),
        ]);
    }

    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }
}
