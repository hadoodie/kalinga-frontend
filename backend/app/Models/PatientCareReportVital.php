<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientCareReportVital extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_care_report_id',
        'sort_order',
        'recorded_time',
        'blood_pressure',
        'temperature',
        'respiratory_rate',
        'spo2',
        'pulse',
        'gcs_eyes',
        'gcs_verbal',
        'gcs_motor',
        'gcs_total',
        'source',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(PatientCareReport::class, 'patient_care_report_id');
    }
}
