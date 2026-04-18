<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientCareReportWaiver extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_care_report_id',
        'consent_for_treatment',
        'refusal_of_treatment',
        'equipment_liability_agreement',
        'signer_name',
        'consent_signature_path',
        'refusal_signature_path',
        'equipment_signature_path',
    ];

    protected $casts = [
        'consent_for_treatment' => 'boolean',
        'refusal_of_treatment' => 'boolean',
        'equipment_liability_agreement' => 'boolean',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(PatientCareReport::class, 'patient_care_report_id');
    }
}
