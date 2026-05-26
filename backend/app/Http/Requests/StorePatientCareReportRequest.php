<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientCareReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $isDraft = $this->boolean('is_draft', false);

        return [
            'is_draft' => ['nullable', 'boolean'],
            'incident_id' => ['nullable', 'integer', 'exists:incidents,id'],
            'patient_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'client_submission_id' => ['nullable', 'string', 'max:120'],
            'client_updated_at' => ['nullable', 'date'],

            'case_no' => [$isDraft ? 'nullable' : 'required', 'string', 'max:100'],
            'mobile_unit' => [$isDraft ? 'nullable' : 'required', 'string', 'max:120'],
            'dispatch_date' => ['nullable', 'date'],

            'response_times' => ['nullable', 'array'],
            'response_times.dispatch' => ['nullable', 'string', 'max:50'],
            'response_times.arrival' => ['nullable', 'string', 'max:50'],
            'response_times.back_to_base' => ['nullable', 'string', 'max:50'],

            'noi_moi' => ['nullable', 'array'],
            'noi_moi.*' => ['string', 'max:120'],

            'patient_details' => ['nullable', 'array'],
            'patient_details.name' => [$isDraft ? 'nullable' : 'required', 'string', 'max:255'],
            'patient_details.age' => ['nullable', 'string', 'max:20'],
            'patient_details.gender' => ['nullable', 'string', 'max:50'],
            'patient_details.address' => ['nullable', 'string', 'max:500'],
            'patient_details.emergencyContact' => ['nullable', 'string', 'max:120'],

            'physiological_status' => ['nullable', 'array'],
            'physiological_status.levelOfConsciousness' => ['nullable', 'string', 'max:80'],
            'physiological_status.chiefComplaint' => [$isDraft ? 'nullable' : 'required', 'string', 'max:500'],
            'physiological_status.painLocation' => ['nullable', 'string', 'max:255'],
            'physiological_status.pmh' => ['nullable', 'array'],
            'physiological_status.pmh.*' => ['string', 'max:120'],

            'vitals_entries' => ['nullable', 'array'],
            'vitals_entries.*.time' => ['nullable', 'string', 'max:80'],
            'vitals_entries.*.bp' => ['nullable', 'string', 'max:20'],
            'vitals_entries.*.temp' => ['nullable', 'numeric', 'between:30,45'],
            'vitals_entries.*.rr' => ['nullable', 'numeric', 'between:5,60'],
            'vitals_entries.*.spo2' => ['nullable', 'numeric', 'between:50,100'],
            'vitals_entries.*.pulse' => ['nullable', 'numeric', 'between:20,250'],
            'vitals_entries.*.source' => ['nullable', 'in:manual,edge'],
            'vitals_entries.*.gcs' => ['nullable', 'array'],
            'vitals_entries.*.gcs.eyes' => ['nullable', 'numeric', 'between:1,4'],
            'vitals_entries.*.gcs.verbal' => ['nullable', 'numeric', 'between:1,5'],
            'vitals_entries.*.gcs.motor' => ['nullable', 'numeric', 'between:1,6'],

            'gcs_entries' => ['nullable', 'array'],
            'gcs_entries.*.eyes' => ['nullable', 'integer', 'min:1', 'max:4'],
            'gcs_entries.*.verbal' => ['nullable', 'integer', 'min:1', 'max:5'],
            'gcs_entries.*.motor' => ['nullable', 'integer', 'min:1', 'max:6'],
            'gcs_entries.*.total' => ['nullable', 'integer', 'min:3', 'max:15'],

            'management_transport' => ['nullable', 'array'],
            'management_transport.treatmentNarrative' => ['nullable', 'string', 'max:5000'],
            'management_transport.transportedTo' => [$isDraft ? 'nullable' : 'required', 'string', 'max:255'],
            'management_transport.admittingDoctor' => ['nullable', 'string', 'max:255'],
            'management_transport.personnelOnScene' => ['nullable', 'string', 'max:255'],

            'waivers' => ['nullable', 'array'],

            // Legacy flat waiver fields (currently used by frontend payload)
            'waivers.consentForTreatment' => ['nullable', 'boolean'],
            'waivers.refusalOfTreatment' => ['nullable', 'boolean'],
            'waivers.equipmentLiabilityAgreement' => ['nullable', 'boolean'],
            'waivers.signerName' => ['nullable', 'string', 'max:255'],
            'waivers.consentSignerName' => ['nullable', 'string', 'max:255'],
            'waivers.consentPatientName' => ['nullable', 'string', 'max:255'],
            'waivers.consentRelation' => ['nullable', 'string', 'max:255'],
            'waivers.consentSignatureData' => ['nullable', 'string'],
            'waivers.refusalSignatureData' => ['nullable', 'string'],
            'waivers.refusalWitnesses' => ['nullable', 'string', 'max:500'],
            'waivers.equipmentBorrowerName' => ['nullable', 'string', 'max:255'],
            'waivers.equipmentSignatureData' => ['nullable', 'string'],
            'waivers.equipmentContactNumber' => ['nullable', 'string', 'max:120'],

            // New nested waiver shape support
            'waivers.*.is_signed' => ['nullable', 'boolean'],
            'waivers.*.signed_at' => ['nullable', 'date'],
            'waivers.*.signature_base64' => ['nullable', 'string'],
            'waivers.*.signer_name' => ['nullable', 'string', 'max:255'],
            'waivers.*.patient_name' => ['nullable', 'string', 'max:255'],
            'waivers.*.relation' => ['nullable', 'string', 'max:255'],
            'waivers.*.witness_name' => ['nullable', 'string', 'max:255'],
            'waivers.*.contact_number' => ['nullable', 'string', 'max:120'],

            'edge_ingest_meta' => ['nullable', 'array'],
            'edge_ingest_meta.source' => ['nullable', 'string', 'max:50'],
            'edge_ingest_meta.last_ingested_at' => ['nullable'],
            'edge_ingest_meta.sensor' => ['nullable', 'string', 'max:120'],
            'edge_ingest_meta.node_event_id' => ['nullable', 'string', 'max:120'],
        ];
    }
}
