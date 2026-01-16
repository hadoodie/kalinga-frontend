<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Request;

class RequestSeeder extends Seeder
{
    public function run(): void
    {
        // Optional: Clear old test data (uncomment only if needed)
        // Request::truncate();

        $requests = [
            // 1. General - N95 Masks
            [
                'hospital_id'     => 1,
                'resource_id'     => null,
                'resource_name'   => 'N95 Masks',
                'quantity'        => 200,
                'urgency_level'   => 'High',
                'handling_class'  => 'General',
                'reason'          => 'ICU stock refill needed',
                'status'          => 'pending',
                'created_by'      => 1,
                'meta'            => ['note' => 'Auto-seeded sample request'],
            ],

            // 2. General - IV Fluids
            [
                'hospital_id'     => 1,
                'resource_id'     => null,
                'resource_name'   => 'IV Fluids (D5LRS 1L)',
                'quantity'        => 500,
                'urgency_level'   => 'High',
                'handling_class'  => 'General',
                'reason'          => 'Regular replenishment',
                'status'          => 'pending',
                'created_by'      => 1,
                'meta'            => ['batch' => '2025-A1'],
            ],

            // 3. High-Value Equipment
            [
                'hospital_id'     => 1,
                'resource_id'     => null,
                'resource_name'   => 'Portable Ventilator',
                'quantity'        => 4,
                'urgency_level'   => 'Critical',
                'handling_class'  => 'HighValue',
                'reason'          => 'Emergency case surge',
                'status'          => 'pending',
                'created_by'      => 1,
                'meta'            => ['priority' => 'ER'],
            ],

            // 4. Cold Chain - Vaccine
            [
                'hospital_id'     => 2,
                'resource_id'     => null,
                'resource_name'   => 'Pfizer COVID-19 Vaccine',
                'quantity'        => 300,
                'urgency_level'   => 'High',
                'handling_class'  => 'ColdChain',   // ← Correct enum value
                'reason'          => 'Vaccination drive tomorrow',
                'status'          => 'pending',
                'created_by'      => 1,
            ],

            // 5. Narcotics
            [
                'hospital_id'     => 1,
                'resource_id'     => null,
                'resource_name'   => 'Fentanyl 100mcg/ml',
                'quantity'        => 50,
                'urgency_level'   => 'Medium',
                'handling_class'  => 'Narcotics',
                'reason'          => 'OR stock low',
                'status'          => 'pending',
                'created_by'      => 1,
            ],
        ];

        foreach ($requests as $req) {
            Request::create($req);
        }

        $this->command->info('RequestSeeder completed — 5 realistic pending requests created!');
    }
}