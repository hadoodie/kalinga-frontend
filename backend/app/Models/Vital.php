<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vital extends Model
{
    use HasFactory;

    protected $table = 'vitals';

    protected $fillable = [
        'user_uuid',
        'heart_rate',
        'blood_pressure',
        'temperature',
        'respiratory_rate',
        'oxygen_saturation',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }
}
