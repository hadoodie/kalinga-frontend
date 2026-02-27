<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $table = 'notification_logs';

    protected $fillable = [
        'type',
        'recipient_id',
        'notifiable_type',
        'notifiable_id',
        'message',
        'channel',
        'status',
        'sent_at',
        'read_at',
        'meta',
    ];

    protected $casts = [
        'sent_at'  => 'datetime',
        'read_at'  => 'datetime',
        'meta'     => 'array',
    ];

    public function notifiable()
    {
        return $this->morphTo();
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}