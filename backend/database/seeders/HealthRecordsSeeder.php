<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Allergy;
use App\Models\Diagnosis;
use App\Models\Immunization;
use App\Models\Medication;
use App\Models\TestResult;
use Carbon\Carbon;

class HealthRecordsSeeder extends Seeder
{
    public function run(): void
    {
        $patient = User::where('email', 'patient_verified@kalinga.com')->first();
        if (!$patient) { return; }

        // --- Allergies ---
        Allergy::create(['user_id' => $patient->id, 'name' => 'Penicillin', 'reaction' => 'Hives, Anaphylaxis Risk', 'severity_details' => 'Severe']);
        Allergy::create(['user_id' => $patient->id, 'name' => 'Latex', 'reaction' => 'Mild Skin Rash', 'severity_details' => 'Mild']);

        // --- Diagnoses ---
        Diagnosis::create(['user_id' => $patient->id, 'name' => 'Essential Hypertension', 'status' => 'active', 'diagnosed_on' => '2023-05-10']);
        Diagnosis::create(['user_id' => $patient->id, 'name' => 'Seasonal Allergies', 'status' => 'active', 'diagnosed_on' => '2022-03-15']);
        Diagnosis::create(['user_id' => $patient->id, 'name' => 'Tonsillitis', 'status' => 'inactive', 'diagnosed_on' => '2020-11-01']);

        // --- Immunizations ---
        Immunization::create(['user_id' => $patient->id, 'name' => 'COVID-19 (Booster)', 'administered_on' => '2024-09-10']);
        Immunization::create(['user_id' => $patient->id, 'name' => 'Influenza (Flu Shot)', 'administered_on' => '2024-10-05']);
        Immunization::create(['user_id' => $patient->id, 'name' => 'Tetanus/Diphtheria (Tdap)', 'administered_on' => '2021-04-12']);

        // --- Medications ---
        Medication::create(['user_id' => $patient->id, 'name' => 'Lisinopril', 'dosage' => '10 mg', 'frequency' => 'Once daily', 'prescribed_by' => 'Dr. Leda Vance', 'status' => 'active']);
        Medication::create(['user_id' => $patient->id, 'name' => 'Ibuprofen', 'dosage' => '200 mg', 'frequency' => 'As needed (Max 3 daily)', 'prescribed_by' => 'Dr. Alex Chen', 'status' => 'active']);
        Medication::create(['user_id' => $patient->id, 'name' => 'Amoxicillin (500 mg)', 'dosage' => '500 mg', 'frequency' => '', 'prescribed_by' => '', 'status' => 'inactive']);

        // --- Test Results (with Details) ---
        $cmp = TestResult::create(['user_id' => $patient->id, 'name' => 'Comprehensive Metabolic Panel (CMP)', 'ordered_by' => 'Dr. Kiandra Karingal', 'ordered_at' => '2024-09-15 08:00:00', 'type' => 'Lab Result', 'overall_status' => 'review']);
        $cmp->details()->create(['name' => 'Glucose', 'value' => '105 mg/dL', 'reference_range' => '70-99', 'status' => 'high', 'explanation' => 'Slightly elevated fasting glucose. May indicate pre-diabetes or temporary stress. Follow-up is recommended.']);
        $cmp->details()->create(['name' => 'Potassium', 'value' => '4 mEq/L', 'reference_range' => '3.5-5.1', 'status' => 'normal', 'explanation' => 'Potassium levels are within the expected range.']);
        
        $xray = TestResult::create(['user_id' => $patient->id, 'name' => 'Chest X-Ray', 'ordered_by' => 'Dr. Gian Asentista', 'ordered_at' => '2024-07-20 08:00:00', 'type' => 'Imaging', 'overall_status' => 'normal']);
        $xray->details()->create(['name' => 'Impression', 'value' => 'No acute findings. Lungs are clear.', 'reference_range' => 'N/A', 'status' => 'normal', 'explanation' => 'The image shows no immediate health concerns.']);
        
        $chol = TestResult::create(['user_id' => $patient->id, 'name' => 'Cholesterol Panel', 'ordered_by' => 'Dr. Jayvee Moral', 'ordered_at' => '2024-03-01 08:00:00', 'type' => 'Lab Result', 'overall_status' => 'high']);
        $chol->details()->create(['name' => 'Total Cholesterol', 'value' => '220 mg/dL', 'reference_range' => '0-200', 'status' => 'high', 'explanation' => 'Total cholesterol is above the healthy range. Discuss lifestyle changes with your doctor.']);
    }
}