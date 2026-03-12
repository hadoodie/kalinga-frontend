<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Appointment;
use Carbon\Carbon;

class AppointmentsSeeder extends Seeder
{
    public function run(): void
    {
        $patient = User::where('email', 'patient_verified@kalinga.com')->first();
        
        if (!$patient) { 
            $this->command->info('Skipping AppointmentsSeeder: patient_verified@kalinga.com not found.');
            return; 
        }

        // --- UPCOMING APPOINTMENTS ---
        
        Appointment::create([
            'user_id'          => $patient->id,
            'patient_name'     => $patient->name,
            'hospital'         => 'Philippine Heart Center', 
            'service'          => 'Clinical Pharmacy', 
            'appointment_date' => Carbon::parse('2025-12-17 15:00:00'), 
            'complaint'        => 'Routine Medication Refill',
            'status'           => 'upcoming',
        ]);

        // --- PAST APPOINTMENTS ---

        Appointment::create([
            'user_id'          => $patient->id,
            'patient_name'     => $patient->name,
            'hospital'         => 'San Lazaro Hospital', 
            'service'          => 'Internal Medicine', 
            'appointment_date' => Carbon::parse('2025-10-16 10:30:00'), 
            'complaint'        => 'Routine Annual Checkup', 
            'status'           => 'past',
        ]);

        Appointment::create([
            'user_id'          => $patient->id,
            'patient_name'     => $patient->name,
            'hospital'         => 'Jose R. Reyes Memorial Medical Center', 
            'service'          => 'Cardiology', 
            'appointment_date' => Carbon::parse('2025-08-05 14:00:00'),
            'complaint'        => 'Chest pain and palpitations', 
            'status'           => 'past',
        ]);
    }
}