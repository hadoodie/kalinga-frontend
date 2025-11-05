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
            [
                'lab_no' => '2599019885',
                'branch' => 'TRINOMA',
                'order_date' => Carbon::parse('2025-05-01'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'CBC',
            ],
            [
                'lab_no' => '2599019901',
                'branch' => 'S.M. NORTH EDSA',
                'order_date' => Carbon::parse('2025-04-20'),
                'patient_id_text' => 'RM023272',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019915',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2025-04-18'),
                'patient_id_text' => 'RM023271',
                'account' => 'PE',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'PE',
            ],
            [
                'lab_no' => '2599019920',
                'branch' => 'AYALA MALLS VERTIS',
                'order_date' => Carbon::parse('2025-03-30'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019933',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2025-03-22'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'X-RAY',
            ],
            [
                'lab_no' => '2599019945',
                'branch' => 'S.M. NORTH EDSA',
                'order_date' => Carbon::parse('2025-02-15'),
                'patient_id_text' => 'RM023272',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019950',
                'branch' => 'TRINOMA',
                'order_date' => Carbon::parse('2025-02-01'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019967',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2025-01-10'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019978',
                'branch' => 'AYALA MALLS VERTIS',
                'order_date' => Carbon::parse('2024-12-20'),
                'patient_id_text' => 'RM023271',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'CBC',
            ],
            [
                'lab_no' => '2599019989',
                'branch' => 'S.M. NORTH EDSA',
                'order_date' => Carbon::parse('2024-12-15'),
                'patient_id_text' => 'RM023272',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2599019999',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2024-11-30'),
                'patient_id_text' => 'RM023271',
                'account' => 'PE',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'PE',
            ],
            [
                'lab_no' => '2600000001',
                'branch' => 'TRINOMA',
                'order_date' => Carbon::parse('2024-11-11'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2600000012',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2024-10-25'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'X-RAY',
            ],
            [
                'lab_no' => '2600000023',
                'branch' => 'S.M. NORTH EDSA',
                'order_date' => Carbon::parse('2024-10-15'),
                'patient_id_text' => 'RM023272',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2600000034',
                'branch' => 'AYALA MALLS VERTIS',
                'order_date' => Carbon::parse('2024-09-01'),
                'patient_id_text' => 'RM023271',
                'account' => 'HMO',
                'gender' => 'FEMALE',
                'age' => 21,
                'type' => 'LAB',
            ],
            [
                'lab_no' => '2600000045',
                'branch' => 'ROBINSONS MAGNOLIA',
                'order_date' => Carbon::parse('2024-08-15'),
                'patient_id_text' => 'RM023271',
                'account' => 'REFERRAL',
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
