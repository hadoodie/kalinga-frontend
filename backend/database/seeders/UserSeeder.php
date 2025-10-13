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
            'name' => 'Logistics Manager',
            'email' => 'logistics@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'logistics',
            'phone' => '09171234568',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);

        // Responder User
        User::create([
            'name' => 'Emergency Responder',
            'email' => 'responder@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'responder',
            'phone' => '09171234569',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);

        // Resident User (using patient role as closest match)
        User::create([
            'name' => 'Resident User',
            'email' => 'resident@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'patient', // Using patient as resident equivalent
            'phone' => '09171234570',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);

        // Patient User (from existing migration)
        User::create([
            'name' => 'Patient User',
            'email' => 'patient@kalinga.com',
            'password' => Hash::make('password123'),
            'role' => 'patient',
            'phone' => '09171234571',
            'is_active' => true,
            'verification_status' => 'verified',
        ]);
    }
}
