<?php

namespace App\Services;

use App\Models\PatientCareReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PatientCareReportPdfService
{
    public function generate(PatientCareReport $report, string $generatedBy = null): string
    {
        $report->loadMissing(['vitals', 'waiver', 'incident', 'patientUser']);

        $pdf = Pdf::loadView('pdf.patient-care-report', [
            'report' => $report,
            'generatedBy' => $generatedBy,
        ])->setPaper('a4', 'portrait');

        $path = sprintf(
            'pcr-soft-copies/%d/%s-%s.pdf',
            $report->id,
            $report->case_no ?: 'case',
            now()->format('Ymd_His')
        );

        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }
}
