<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestResult extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'name',
        'ordered_by',
        'ordered_at',
        'type',
        'overall_status',
    ];

    /**
     * Get all of the details for the TestResult.
     * This is the function your seeder needs.
     */
    public function details(): HasMany
    {
        return $this->hasMany(TestResultDetail::class);
    }
}