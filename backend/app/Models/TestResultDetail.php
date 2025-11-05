<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestResultDetail extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * We get these from your seeder's details()->create() call.
     */
    protected $fillable = [
        'name',
        'value',
        'reference_range',
        'status',
        'explanation',
        // 'test_result_id' is filled automatically by the relationship
    ];

    /**
     * Get the test result that this detail belongs to.
     */
    public function testResult(): BelongsTo
    {
        return $this->belongsTo(TestResult::class);
    }
}
