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
        User::updateOrCreate(
            ['email' => 'admin@kalinga.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '09171234567',
                'is_active' => true,
                'verification_status' => 'verified',
            ]
        );

        // Logistics User
        User::updateOrCreate(
            ['email' => 'logistics_unverified@kalinga.com'],
            [
                'name' => 'Logistics Unverified',
                'password' => Hash::make('password123'),
                'role' => 'logistics',
                'phone' => '09171234568',
                'is_active' => true,
                'verification_status' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'logistics_verified@kalinga.com'],
            [
                'name' => 'Logistics Verified',
                'password' => Hash::make('password123'),
                'role' => 'logistics',
                'phone' => '09171234568',
                'is_active' => true,
                'verification_status' => 'verified',
            ]
        );

        // Responder User
        User::updateOrCreate(
            ['email' => 'responder_unverified@kalinga.com'],
            [
                'name' => 'Responder Unverified',
                'password' => Hash::make('password123'),
                'role' => 'responder',
                'phone' => '09171234569',
                'is_active' => true,
                'verification_status' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'responder_verified@kalinga.com'],
            [
                'name' => 'Responder Verified',
                'password' => Hash::make('password123'),
                'role' => 'responder',
                'phone' => '09171234569',
                'is_active' => true,
                'verification_status' => 'verified',
            ]
        );

        // Additional Verified Responders
        User::updateOrCreate(
            ['email' => 'jane.doe@kalinga.com'],
            [
                'name' => 'Jane Doe',
                'password' => Hash::make('password123'),
                'role' => 'responder',
                'phone' => '09271112233',
                'is_active' => true,
                'verification_status' => 'verified',
            ]
        );

        User::updateOrCreate(
            ['email' => 'john.smith@kalinga.com'],
            [
                'name' => 'John Smith',
                'password' => Hash::make('password123'),
                'role' => 'responder',
                'phone' => '09282223344',
                'is_active' => true,
                'verification_status' => 'verified',
            ]
        );

        User::updateOrCreate(
            ['email' => 'maria.clara@kalinga.com'],
            [
                'name' => 'Maria Clara',
                'password' => Hash::make('password123'),
                'role' => 'responder',
                'phone' => '09293334455',
                'is_active' => true,
                'verification_status' => 'verified',
            ]
        );


        // Patient User
        User::updateOrCreate(
            ['email' => 'patient_unverified@kalinga.com'],
            [
                'name' => 'Patient Unverified',
                'password' => Hash::make('password123'),
                'role' => 'patient',
                'phone' => '09171234570',
                'is_active' => true,
                'verification_status' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'patient_verified@kalinga.com'],
            [
                'name' => 'Patient Verified',
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
            ]
        );
    }
}
