<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'details',
        'before',
        'after',
        'meta',
        'auditable_type',
        'auditable_id',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'before' => 'array',  
        'after' => 'array',
        'meta' => 'array',
    ];

    
    public function auditable()
    {
        return $this->morphTo();
    }

   
    public function user()
    {
        return $this->belongsTo(User::class);
    }

   
    public static function record($action, $auditable, $details = null, $before = null, $after = null, $meta = null)
    {
        return self::create([
            'user_id'       => auth()->id(),
            'action'        => $action,
            'details'       => $details,
            'before'        => $before,
            'after'         => $after,
            'meta'          => $meta,
            'auditable_type'=> get_class($auditable),
            'auditable_id'  => $auditable->id,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->header('User-Agent'),
        ]);
    }
}
