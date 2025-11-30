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
            'user_id'            => $patient->id,
            'hospital'           => 'Philippine Heart Center', 
            'provider_name'      => 'Pharmacist On-Duty',
            'provider_specialty' => 'Clinical Pharmacy', 
            'service'            => 'Pharmacy 4F (Pay)', 
            'appointment_at'     => Carbon::parse('2025-12-17 15:00:00'), 
            'complaint'          => 'Routine Medication Refill',
            'location'           => 'Pharmacy 4F', 
            'contact_phone'      => '09957563050', 
            'contact_email'      => 'cacheorgenryv@gmail.com', 
            'instructions'       => 'Please bring valid ID for verification. If email address is not available please SCREENSHOT the summary form.', 
            'status'             => 'upcoming',
            'patient_name'       => $patient->name 
        ]);

        // --- PAST APPOINTMENTS ---

        Appointment::create([
            'user_id'            => $patient->id,
            'hospital'           => 'San Lazaro Hospital', 
            'provider_name'      => 'Dr. Emily Reed',
            'provider_specialty' => 'Internal Medicine', 
            'service'            => 'OPD - Internal Medicine', 
            'appointment_at'     => Carbon::parse('2025-10-16 10:30:00'), 
            'complaint'          => 'Routine Annual Checkup', 
            'location'           => 'Main Clinic, Room 302', 
            'contact_phone'      => '(555) 123-4567', 
            'contact_email'      => 'e.reed@clinic.com', 
            'instructions'       => 'Please fast for 12 hours prior to your visit.', 
            'status'             => 'past',
            'patient_name'       => $patient->name 
        ]);

        Appointment::create([
            'user_id'            => $patient->id,
            'hospital'           => 'Jose R. Reyes Memorial Medical Center', 
            'provider_name'      => 'Dr. Carlos Mendoza',
            'provider_specialty' => 'Cardiology', 
            'service'            => 'OPD - Cardiology', 
            'appointment_at'     => Carbon::parse('2025-08-05 14:00:00'),
            'complaint'          => 'Chest pain and palpitations', 
            'location'           => 'Cardiology Unit, Suite 101', 
            'contact_phone'      => '(555) 987-6543', 
            'contact_email'      => 'admin@jrmmc.gov.ph', 
            'instructions'       => 'Bring previous ECG results.', 
            'status'             => 'past',
            'patient_name'       => $patient->name
        ]);
    }
}