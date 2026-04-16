<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PatientCareReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'incident_id',
        'patient_user_id',
        'case_no',
        'mobile_unit',
        'dispatch_date',
        'response_times',
        'noi_moi',
        'patient_details',
        'physiological_status',
        'vitals_entries',
        'gcs_entries',
        'management_transport',
        'waivers',
        'edge_ingest_meta',
        'soft_copy_path',
        'status',
        'client_submission_id',
        'client_updated_at',
        'submitted_at',
    ];

    protected $casts = [
        'dispatch_date' => 'date',
        'response_times' => 'array',
        'noi_moi' => 'array',
        'patient_details' => 'array',
        'physiological_status' => 'array',
        'vitals_entries' => 'array',
        'gcs_entries' => 'array',
        'management_transport' => 'array',
        'waivers' => 'array',
        'edge_ingest_meta' => 'array',
        'client_updated_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function patientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_user_id');
    }

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function vitals(): HasMany
    {
        return $this->hasMany(PatientCareReportVital::class)->orderBy('sort_order');
    }

    public function waiver(): HasOne
    {
        return $this->hasOne(PatientCareReportWaiver::class);
    }
}
