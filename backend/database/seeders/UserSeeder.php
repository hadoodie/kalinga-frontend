<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password123');

        // Admin users
        $this->seedUsers([
            [
                'name' => 'Admin User',
                'email' => 'admin@kalinga.com',
                'role' => 'admin',
                'phone' => '09170000001',
                'password' => $password,
                'is_active' => 'true',
                'verification_status' => 'verified',
            ],
        ]);

        // Logistics users
        $this->seedUsers([
            [
                'name' => 'Logistics One',
                'email' => 'logistics1@kalinga.com',
                'role' => 'logistics',
                'phone' => '09170000011',
                'password' => $password,
                'is_active' => 'true',
                'verification_status' => 'verified',
            ],
            [
                'name' => 'Logistics Two',
                'email' => 'logistics2@kalinga.com',
                'role' => 'logistics',
                'phone' => '09170000012',
                'password' => $password,
                'is_active' => 'true',
                'verification_status' => 'verified',
            ],
        ]);

        // Responder users (20)
        $responderUsers = [];
        for ($i = 1; $i <= 20; $i++) {
            $responderUsers[] = [
                'name' => 'Responder ' . $this->numberWord($i),
                'email' => "responder{$i}@kalinga.com",
                'role' => 'responder',
                'phone' => sprintf('091700001%02d', $i),
                'password' => $password,
                'is_active' => 'true',
                'verification_status' => 'verified',
            ];
        }
        $this->seedUsers($responderUsers);

        // Patient users (50)
        $patientUsers = [];
        for ($i = 1; $i <= 50; $i++) {
            $patientUsers[] = [
                'name' => 'Patient ' . $this->numberWord($i),
                'email' => "patient{$i}@kalinga.com",
                'role' => 'patient',
                'phone' => sprintf('091700002%02d', $i),
                'password' => $password,
                'is_active' => 'true',
                'verification_status' => 'verified',
            ];
        }
        $this->seedUsers($patientUsers);
    }

    private function seedUsers(array $users): void
    {
        foreach ($users as $user) {
            $userModel = User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => $user['password'],
                    'role' => $user['role'],
                    'phone' => $user['phone'],
                    // String 'true' avoids casting mismatch with current Supabase pooler setup.
                    'is_active' => $user['is_active'],
                    'verification_status' => $user['verification_status'],
                ]
            );

            // Ensure Logistics users are assigned to a hospital so they don't get 403 errors on their Forecast API scopes.
            if ($userModel->role === 'logistics' && $userModel->hospitals()->count() === 0) {
                // Attach to the first hospital if it exists, otherwise leave until hospitals exist
                $hospital = \App\Models\Hospital::first();
                if ($hospital) {
                    $userModel->hospitals()->attach($hospital->id);
                }
            }
        }
    }

    private function numberWord(int $number): string
    {
        return match ($number) {
            1 => 'One',
            2 => 'Two',
            3 => 'Three',
            4 => 'Four',
            5 => 'Five',
            6 => 'Six',
            7 => 'Seven',
            8 => 'Eight',
            9 => 'Nine',
            10 => 'Ten',
            default => (string) $number,
        };
    }
}
