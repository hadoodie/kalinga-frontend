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
                'name' => 'Philippine General Hospital',
                'address' => 'Taft Ave, Ermita, Manila, 1000 Metro Manila',
                'contact_number' => '+63-2-8554-8400',
                'email' => 'info@pgh.gov.ph',
                'capacity' => 1500,
                'type' => 'General',
                'latitude' => 14.5794,
                'longitude' => 120.9832,
            ],
            [
                'name' => 'East Avenue Medical Center',
                'address' => 'East Ave, Diliman, Quezon City, 1100 Metro Manila',
                'contact_number' => '+63-2-8928-0611',
                'email' => 'info@eamc.doh.gov.ph',
                'capacity' => 600,
                'type' => 'General',
                'latitude' => 14.6466,
                'longitude' => 121.0450,
            ],
            [
                'name' => 'Jose R. Reyes Memorial Medical Center',
                'address' => 'Rizal Ave, Santa Cruz, Manila, 1003 Metro Manila',
                'contact_number' => '+63-2-8711-9491',
                'email' => 'info@jrrmmc.gov.ph',
                'capacity' => 600,
                'type' => 'General',
                'latitude' => 14.6137,
                'longitude' => 120.9832,
            ],
            [
                'name' => 'Lung Center of the Philippines',
                'address' => 'Quezon Ave, Diliman, Quezon City, 1100 Metro Manila',
                'contact_number' => '+63-2-8924-6101',
                'email' => 'info@lcp.gov.ph',
                'capacity' => 210,
                'type' => 'Specialty',
                'latitude' => 14.6461,
                'longitude' => 121.0426,
            ],
            [
                'name' => 'National Kidney and Transplant Institute',
                'address' => 'East Ave, Diliman, Quezon City, 1100 Metro Manila',
                'contact_number' => '+63-2-8929-3601',
                'email' => 'info@nksti.gov.ph',
                'capacity' => 400,
                'type' => 'Specialty',
                'latitude' => 14.6467,
                'longitude' => 121.0452,
            ],
            [
                'name' => 'San Lazaro Hospital',
                'address' => 'Quiricada St, Santa Cruz, Manila, 1003 Metro Manila',
                'contact_number' => '+63-2-8731-3121',
                'email' => 'info@slh.doh.gov.ph',
                'capacity' => 500,
                'type' => 'General',
                'latitude' => 14.6146,
                'longitude' => 120.9772,
            ],
            [
                'name' => 'Research Institute for Tropical Medicine',
                'address' => '9002 Research Dr, Alabang, Muntinlupa, 1781 Metro Manila',
                'contact_number' => '+63-2-8807-2631',
                'email' => 'info@ritm.gov.ph',
                'capacity' => 250,
                'type' => 'Specialty',
                'latitude' => 14.4132,
                'longitude' => 121.0457,
            ],
            [
                'name' => 'Tondo Medical Center',
                'address' => 'Balut, Tondo, Manila, 1012 Metro Manila',
                'contact_number' => '+63-2-8254-1111',
                'email' => 'info@tmc.doh.gov.ph',
                'capacity' => 300,
                'type' => 'General',
                'latitude' => 14.6246,
                'longitude' => 120.9626,
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::create($hospital);
        }
    }
}
