<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StorePatientCareReportRequest;
use App\Http\Controllers\Controller;
use App\Models\PatientCareReport;
use App\Services\PatientCareReportPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PatientCareReportController extends Controller
{
    public function __construct(
        private PatientCareReportPdfService $pdfService
    ) {
    }

    public function index(Request $request)
    {
        $reports = PatientCareReport::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($reports);
    }

    public function show(Request $request, PatientCareReport $patientCareReport)
    {
        if ((int) $patientCareReport->user_id !== (int) $request->user()->id && $request->user()->role !== 'admin') {
            abort(403, 'You are not authorized to view this report.');
        }

        $patientCareReport->load(['vitals', 'waiver', 'incident', 'patientUser']);

        return response()->json([
            'data' => $patientCareReport,
        ]);
    }

    public function store(StorePatientCareReportRequest $request)
    {
        $isDraft = $request->boolean('is_draft', false);
        $validated = $request->validated();
        Log::info('PCR store validated payload', [
            'user_id' => $request->user()->id,
            'is_draft' => $isDraft,
            'validated_keys' => array_keys($validated),
        ]);
        $clientSubmissionId = $validated['client_submission_id'] ?? null;

        $report = null;
        if ($clientSubmissionId) {
            $report = PatientCareReport::query()
                ->where('user_id', $request->user()->id)
                ->where('client_submission_id', $clientSubmissionId)
                ->first();
        }

        if (!$report) {
            $report = new PatientCareReport();
            $report->user_id = $request->user()->id;
        }

        if ($report->exists && !empty($validated['client_updated_at'])) {
            $incomingUpdatedAt = Carbon::parse($validated['client_updated_at']);
            if ($report->client_updated_at && $report->client_updated_at->gt($incomingUpdatedAt)) {
                return response()->json([
                    'message' => 'A newer draft already exists on the server.',
                    'data' => $report->load(['vitals', 'waiver']),
                ], 409);
            }
        }

        $report->fill([
            'incident_id' => $validated['incident_id'] ?? null,
            'patient_user_id' => $validated['patient_user_id'] ?? null,
            'client_submission_id' => $clientSubmissionId,
            'client_updated_at' => $validated['client_updated_at'] ?? now(),
            'case_no' => $validated['case_no'] ?? null,
            'mobile_unit' => $validated['mobile_unit'] ?? null,
            'dispatch_date' => $validated['dispatch_date'] ?? null,
            'response_times' => $validated['response_times'] ?? [],
            'noi_moi' => $validated['noi_moi'] ?? [],
            'patient_details' => $validated['patient_details'] ?? [],
            'physiological_status' => $validated['physiological_status'] ?? [],
            'vitals_entries' => $validated['vitals_entries'] ?? [],
            'gcs_entries' => $validated['gcs_entries'] ?? [],
            'management_transport' => $validated['management_transport'] ?? [],
            'waivers' => $validated['waivers'] ?? [],
            'edge_ingest_meta' => $validated['edge_ingest_meta'] ?? [],
            'status' => $isDraft ? 'draft' : 'submitted',
            'submitted_at' => $isDraft ? null : now(),
        ]);

        $report->save();

        $this->syncVitals($report, $validated['vitals_entries'] ?? []);
        $this->syncWaiver($report, $validated['waivers'] ?? []);

        if (!$isDraft) {
            $path = $this->pdfService->generate($report, $request->user()->name);
            $report->soft_copy_path = $path;
            $report->save();
        }

        $report->load(['vitals', 'waiver']);
        Log::info('PCR saved', [
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'status' => $report->status,
        ]);

        return response()->json([
            'message' => $isDraft ? 'PCR draft saved.' : 'PCR submitted successfully.',
            'data' => $report,
        ], $report->wasRecentlyCreated ? 201 : 200);
    }

    public function generateSoftCopy(Request $request, PatientCareReport $patientCareReport)
    {
        if ((int) $patientCareReport->user_id !== (int) $request->user()->id && $request->user()->role !== 'admin') {
            abort(403, 'You are not authorized to generate this report soft copy.');
        }

        $path = $this->pdfService->generate($patientCareReport, $request->user()->name);
        $patientCareReport->soft_copy_path = $path;
        $patientCareReport->save();

        return response()->json([
            'message' => 'Soft copy generated.',
            'data' => [
                'soft_copy_path' => $path,
            ],
        ]);
    }

    public function downloadSoftCopy(Request $request, PatientCareReport $patientCareReport)
    {
        if ((int) $patientCareReport->user_id !== (int) $request->user()->id && $request->user()->role !== 'admin') {
            abort(403, 'You are not authorized to download this report soft copy.');
        }

        if (!$patientCareReport->soft_copy_path || !Storage::disk('public')->exists($patientCareReport->soft_copy_path)) {
            return response()->json(['message' => 'Soft copy not found.'], 404);
        }

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($patientCareReport->soft_copy_path),
                'soft_copy_path' => $patientCareReport->soft_copy_path,
            ],
        ]);
    }

    private function syncVitals(PatientCareReport $report, array $vitalsEntries): void
    {
        $report->vitals()->delete();

        foreach ($vitalsEntries as $index => $row) {
            $eyes = data_get($row, 'gcs.eyes');
            $verbal = data_get($row, 'gcs.verbal');
            $motor = data_get($row, 'gcs.motor');

            $report->vitals()->create([
                'sort_order' => $index,
                'recorded_time' => $row['time'] ?? null,
                'blood_pressure' => $row['bp'] ?? null,
                'temperature' => $row['temp'] ?? null,
                'respiratory_rate' => $row['rr'] ?? null,
                'spo2' => $row['spo2'] ?? null,
                'pulse' => $row['pulse'] ?? null,
                'gcs_eyes' => $eyes,
                'gcs_verbal' => $verbal,
                'gcs_motor' => $motor,
                'gcs_total' => ($eyes && $verbal && $motor) ? ((int) $eyes + (int) $verbal + (int) $motor) : null,
                'source' => $row['source'] ?? 'manual',
            ]);
        }
    }

    private function syncWaiver(PatientCareReport $report, array $waiver): void
    {
        $report->waiver()->updateOrCreate(
            ['patient_care_report_id' => $report->id],
            [
                'consent_for_treatment' => (bool) ($waiver['consentForTreatment'] ?? false),
                'refusal_of_treatment' => (bool) ($waiver['refusalOfTreatment'] ?? false),
                'equipment_liability_agreement' => (bool) ($waiver['equipmentLiabilityAgreement'] ?? false),
                'signer_name' => $waiver['consentSignerName']
                    ?? $waiver['equipmentBorrowerName']
                    ?? $waiver['signerName']
                    ?? null,
                // Stored as data URL placeholder for now; can later be replaced by uploaded file path.
                'consent_signature_path' => $waiver['consentSignatureData'] ?? null,
                'refusal_signature_path' => $waiver['refusalSignatureData'] ?? null,
                'equipment_signature_path' => $waiver['equipmentSignatureData'] ?? null,
            ]
        );
    }
}
