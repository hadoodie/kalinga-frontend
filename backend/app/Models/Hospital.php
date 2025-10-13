<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'contact_number',
        'email',
        'capacity',
        'type',
        'latitude',
        'longitude',
    ];

    // Relationships
    public function resources()
    {
        return $this->hasMany(Resource::class);
    }
}
