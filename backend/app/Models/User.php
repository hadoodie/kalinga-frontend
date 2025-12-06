<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\AllocationRequest; // <-- ADDED THIS IMPORT
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'profile_image',
        'address',
        'barangay',
        'city',
        'zip_code',
        'id_type',
        'id_image_path',
        'verification_status',
        'is_active',
        'language', 
        'theme',      
        'availability', 
        'visibility', 
        'patientId',  
        'dob',  
        'bloodType',  
        'admitted',  
        'emergencyContactName',  
        'emergencyContactPhone',  
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_users');
    }

    /**
     * Get all of the appointments for the User.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get all of the notifications for the User.
     */
    public function notifications(): HasMany 
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get all of the allocation requests made by the User.
     */
    public function outgoingAllocationRequests(): HasMany 
    {
        return $this->hasMany(AllocationRequest::class, 'requester_user_id');
    }

    public function responderAssignments(): HasMany
    {
        return $this->hasMany(IncidentResponderAssignment::class, 'responder_id');
    }

    public function incidentStatusUpdates(): HasMany
    {
        return $this->hasMany(IncidentStatusUpdate::class);
    }

    /**
     * Boot the model and generate uuid for new users.
     */
    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
        });
    }
}