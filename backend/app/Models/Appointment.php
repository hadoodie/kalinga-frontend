<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'hospital',           
        'service',            
        'patient_name',       
        'complaint',          
        'provider_name',
        'provider_specialty',
        'appointment_at',
        'reason',
        'location',
        'contact_phone',
        'contact_email',
        'instructions',
        'status',
    ];

    /**
     * Get the user that owns the appointment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}