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
                'patientId' => 'HN-0012345',
                'dob' => '1985-10-15',
                'bloodType' => 'O+',
                'address' => '456 Rizal St., Valenzuela, Metro Manila',
                'admitted' => '2025-10-20',
                'emergencyContactName' => 'Juan Dela Cruz',
                'emergencyContactPhone' => '0918-555-4321',
            ]
        );


            // Additional requested patients and logistics accounts
            User::updateOrCreate(
                ['email' => 'angelo.hermano.patient@kalinga.com'],
                [
                    'name' => 'Angelo Hermano',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000001',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1001',
                    'dob' => '1990-03-21',
                    'bloodType' => 'A+',
                ]
            );

            User::updateOrCreate(
                ['email' => 'angelo.hermano.logistics@kalinga.com'],
                [
                    'name' => 'Angelo Hermano',
                    'password' => Hash::make('password123'),
                    'role' => 'logistics',
                    'phone' => '09191000001',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'elisha.borromeo.patient@kalinga.com'],
                [
                    'name' => 'Elisha Borromeo',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000002',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1002',
                    'dob' => '1988-07-12',
                    'bloodType' => 'B+',
                ]
            );

            User::updateOrCreate(
                ['email' => 'elisha.borromeo.logistics@kalinga.com'],
                [
                    'name' => 'Elisha Borromeo',
                    'password' => Hash::make('password123'),
                    'role' => 'logistics',
                    'phone' => '09191000002',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'evan.christjohn.camba.patient@kalinga.com'],
                [
                    'name' => 'Evan Christ John Camba',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000003',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1003',
                    'dob' => '1995-01-30',
                    'bloodType' => 'O-',
                ]
            );

            User::updateOrCreate(
                ['email' => 'evan.christjohn.camba.responder@kalinga.com'],
                [
                    'name' => 'Evan Christ John Camba',
                    'password' => Hash::make('password123'),
                    'role' => 'responder',
                    'phone' => '09191000003',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'genryv.cachero.patient@kalinga.com'],
                [
                    'name' => 'Genryv Cachero',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000004',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1004',
                    'dob' => '1982-11-05',
                    'bloodType' => 'AB+',
                ]
            );

            User::updateOrCreate(
                ['email' => 'genryv.cachero.logistics@kalinga.com'],
                [
                    'name' => 'Genryv Cachero',
                    'password' => Hash::make('password123'),
                    'role' => 'logistics',
                    'phone' => '09191000004',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'jared.posada.patient@kalinga.com'],
                [
                    'name' => 'Jared Posada',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09191000005',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'jared.posada.logistics@kalinga.com'],
                [
                    'name' => 'Jared Posada',
                    'password' => Hash::make('password123'),
                    'role' => 'logistics',
                    'phone' => '09191000005',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'kayann.nicolette.dimalanta.patient@kalinga.com'],
                [
                    'name' => 'Kay-Ann Nicolette Dimalanta',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000006',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1006',
                    'dob' => '1992-05-18',
                    'bloodType' => 'A-',
                ]
            );

            User::updateOrCreate(
                ['email' => 'kayann.nicolette.dimalanta.responder@kalinga.com'],
                [
                    'name' => 'Kay-Ann Nicolette Dimalanta',
                    'password' => Hash::make('password123'),
                    'role' => 'responder',
                    'phone' => '09191000006',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'keenan.claude.mimis.patient@kalinga.com'],
                [
                    'name' => 'Keenan Claude Mimis',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000007',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1007',
                    'dob' => '1987-02-02',
                    'bloodType' => 'B-',
                ]
            );

            User::updateOrCreate(
                ['email' => 'keenan.claude.mimis.logistics@kalinga.com'],
                [
                    'name' => 'Keenan Claude Mimis',
                    'password' => Hash::make('password123'),
                    'role' => 'logistics',
                    'phone' => '09191000007',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'mikha.villaraza.patient@kalinga.com'],
                [
                    'name' => 'Mikha Villaraza',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000008',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1008',
                    'dob' => '1998-12-09',
                    'bloodType' => 'O+',
                ]
            );

            User::updateOrCreate(
                ['email' => 'mikha.villaraza.responder@kalinga.com'],
                [
                    'name' => 'Mikha Villaraza',
                    'password' => Hash::make('password123'),
                    'role' => 'responder',
                    'phone' => '09191000008',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );

            User::updateOrCreate(
                ['email' => 'precious.joy.lauresta.patient@kalinga.com'],
                [
                    'name' => 'Precious Joy Lauresta',
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => '09190000009',
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'patientId' => 'P-1009',
                    'dob' => '2000-08-25',
                    'bloodType' => 'AB-',
                ]
            );

            User::updateOrCreate(
                ['email' => 'precious.joy.lauresta.responder@kalinga.com'],
                [
                    'name' => 'Precious Joy Lauresta',
                    'password' => Hash::make('password123'),
                    'role' => 'responder',
                    'phone' => '09191000009',
                    'is_active' => true,
                    'verification_status' => 'verified',
                ]
            );
    }
}
