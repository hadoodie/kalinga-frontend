<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Hospital;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $hospitals = [
            [
                'name' => 'Central General Hospital',
                'address' => '123 Main St, City Center',
                'contact_number' => '09171234567',
                'email' => 'centralhospital@example.com',
                'capacity' => 500,
                'type' => 'General',
                'latitude' => 14.5995,
                'longitude' => 120.9842,
            ],
            [
                'name' => 'Emergency Field Hospital',
                'address' => 'Evacuation Site, Barangay 5',
                'contact_number' => '09179876543',
                'email' => 'fieldhospital@example.com',
                'capacity' => 100,
                'type' => 'Field',
                'latitude' => 14.6000,
                'longitude' => 120.9850,
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::create($hospital);
        }
    }
}
