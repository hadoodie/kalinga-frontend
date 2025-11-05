<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TestResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'ordered_by',
        'ordered_at',
        'type',
        'overall_status',
    ];

    public function details()
    {
        return $this->hasMany(TestResultDetail::class, 'test_result_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
