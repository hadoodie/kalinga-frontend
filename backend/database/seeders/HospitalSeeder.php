<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Hospital;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        Hospital::truncate();

        $hospitals = [
            [
                'id'                    => 1,
                'name'                  => 'Central General Hospital',
                'code'                  => 'HOSP-NCR-001',
                'short_name'            => 'Central General',
                'region'                => 'NCR',
                'province'              => 'Metro Manila',
                'city_municipality'     => 'Quezon City',
                'address'               => '123 Main St, City Center',
                'phone'                 => '09171234567',
                'email'                 => 'centralhospital@example.com',
                'director_name'         => 'Dr. Juan dela Cruz',
                'bed_capacity'          => 500,
                'icu_capacity'          => 50,
                'negative_pressure_rooms' => 10,
                'level'                 => 'Level 3',
                'ownership'             => 'government',
                'latitude'              => 14.5995,
                'longitude'             => 120.9842,
                'is_active'             => true,
                'is_cold_chain_capable' => true,
                'capabilities'          => json_encode([
                    'cold_storage'     => true,
                    'blood_bank'       => true,
                    'pharmacy_24hr'    => true,
                    'operating_theater'=> true,
                ]),
            ],
            [
                'id'                    => 2,
                'name'                  => 'Emergency Field Hospital',
                'code'                  => 'FIELD-NCR-001',
                'short_name'            => 'Field Hospital',
                'region'                => 'NCR',
                'province'              => 'Metro Manila',
                'city_municipality'     => 'Manila',
                'address'               => 'Evacuation Site, Barangay 5',
                'phone'                 => '09179876543',
                'email'                 => 'fieldhospital@example.com',
                'bed_capacity'          => 100,
                'icu_capacity'          => 0,
                'level'                 => 'Level 1',
                'ownership'             => 'government',
                'latitude'              => 14.6000,
                'longitude'             => 120.9850,
                'is_active'             => true,
                'is_cold_chain_capable' => false,
            ],
            [
                'id'                    => 3,
                'name'                  => "St. Luke's Medical Center - Global City",
                'code'                  => 'PRIVATE-NCR-001',
                'short_name'            => 'St. Luke\'s BGC',
                'region'                => 'NCR',
                'province'              => 'Metro Manila',
                'city_municipality'     => 'Taguig',
                'address'               => '32nd Street corner 5th Avenue, Bonifacio Global City',
                'phone'                 => '+63287897700',
                'email'                 => 'customer.bgc@stlukes.com.ph',
                'bed_capacity'          => 600,
                'icu_capacity'          => 100,
                'level'                 => 'Level 3',
                'ownership'             => 'private',
                'latitude'              => 14.5550,
                'longitude'             => 121.0500,
                'is_active'             => true,
                'is_cold_chain_capable' => true,
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::create($hospital);
        }
    }
}