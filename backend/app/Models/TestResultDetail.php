<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TestResultDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_result_id',
        'name',
        'value',
        'reference_range',
        'status',
        'explanation',
    ];

    public function testResult()
    {
        return $this->belongsTo(TestResult::class, 'test_result_id');
    }
}
