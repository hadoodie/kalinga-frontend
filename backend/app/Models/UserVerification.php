<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'id_type', 'id_number', 
        'first_name', 'middle_name', 'last_name', 
        'date_of_birth', 'address',
        'front_image_path', 'back_image_path', 'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}