<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\LabResult;
use Carbon\Carbon;

class LabResultSeeder extends Seeder
{
    public function run(): void
    {
        // Find the specific patient user you want to assign these results to
        $patient = User::where('email', 'patient_verified@kalinga.com')->first();

        // If the patient doesn't exist, stop the seeder
        if (!$patient) {
            $this->command->info('Patient with email patient_verified@kalinga.com not found. Skipping LabResultSeeder.');
            return;
        }

        // Define the lab results data
        $results = [
            [
                'lab_no' => '2599019773',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2025-06-06'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'X-RAY',
            ],
            [
                'lab_no' => '2599019618',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2025-06-05'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019774',
                'branch' => 'S.M. NORTH EDSA',
                'order_date' => Carbon::parse('2025-05-15'),
                'patient_id_text' => 'RM023272',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
        ];

        // Create a record for each item in the array
        foreach ($results as $result) {
            LabResult::create([
                'user_id' => $patient->id, 
                'lab_no' => $result['lab_no'],
                'branch' => $result['branch'],
                'order_date' => $result['order_date'],
                'patient_id_text' => $result['patient_id_text'],
                'account' => $result['account'],
                'gender' => $result['gender'],
                'age' => $result['age'],
                'type' => $result['type'],
            ]);
        }
    }
}