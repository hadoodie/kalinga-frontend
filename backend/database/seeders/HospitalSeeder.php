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
                'capacity' => 120,
                'type' => 'Field',
                'latitude' => 14.6011,
                'longitude' => 120.9861,
            ],
            [
                'name' => "St. Luke's Medical Center",
                'address' => '32nd Street corner 5th Avenue, Bonifacio Global City, Taguig',
                'contact_number' => '+63-2-8789-7700',
                'email' => 'customer.bgc@stlukes.com.ph',
                'capacity' => 400,
                'type' => 'Specialty',
                'latitude' => 14.5547,
                'longitude' => 121.0486,
            ],
            [
                'name' => 'Pasig City Medical Center',
                'address' => 'Eusebio Ave., Pasig City',
                'contact_number' => '09178889999',
                'email' => 'pasigmed@example.com',
                'capacity' => 250,
                'type' => 'General',
                'latitude' => 14.5707,
                'longitude' => 121.0843,
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::create($hospital);
        }
    }
}
