<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'lab_no',
        'branch',
        'order_date',
        'patient_id_text',
        'account',
        'gender',
        'age',
        'type',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
