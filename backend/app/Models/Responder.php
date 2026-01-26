<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Responder extends Model
{
    protected $table = 'responders';

    protected $fillable = [
        'responder_code', 'user_id', 'full_name', 'contact_number',
        'license_number', 'certifications', 'handling_capabilities',
        'current_asset_id', 'status', 'created_by'
    ];

    protected $casts = [
        'handling_capabilities' => 'array',
        'certifications' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function currentAsset()
    {
        return $this->belongsTo(Asset::class, 'current_asset_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}