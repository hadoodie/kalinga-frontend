<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'phone' => '09171234567',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);

        // Logistics User
        User::create([
            'name' => 'Logistics Unverified',
            'email' => 'logistics_unverified@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'logistics',
            'phone' => '09171234568',
            'is_active' => true,
            'verification_status' => null,
        ]);

        User::create([
            'name' => 'Logistics Verified',
            'email' => 'logistics_verified@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'logistics',
            'phone' => '09171234568',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);

        // Responder User
        User::create([
            'name' => 'Responder Unverified',
            'email' => 'responder_unverified@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'responder',
            'phone' => '09171234569',
            'is_active' => true,
            'verification_status' => null,
        ]);

                User::create([
            'name' => 'Responder Verified',
            'email' => 'responder_verified@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'responder',
            'phone' => '09171234569',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);


        // Patient User
        User::create([
            'name' => 'Patient Unverified',
            'email' => 'patient_unverified@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'patient', 
            'phone' => '09171234570',
            'is_active' => true,
            'verification_status' => null,
        ]);

        User::create([
            'name' => 'Patient Verified',
            'email' => 'patient_verified@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'patient',
            'phone' => '09171234571',
            'is_active' => true,
            'verification_status' => 'verified',
            // --- PATIENT DATA ADDED HERE ---
            'patientId' => 'HN-0012345',
            'dob' => '1985-10-15', 
            'bloodType' => 'O+',
            'address' => '456 Rizal St., Valenzuela, Metro Manila',
            'admitted' => '2025-10-20', 
            'emergencyContactName' => 'Juan Dela Cruz',
            'emergencyContactPhone' => '0918-555-4321',
        ]);
    }
}
