<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Appointment;
use Carbon\Carbon; // <-- Import Carbon

class AppointmentsSeeder extends Seeder
{
    public function run(): void
    {
        $patient = User::where('email', 'patient_verified@kalinga.com')->first();
        if (!$patient) { return; }

        // --- UPCOMING ---
        // I changed this date to be in the future
        Appointment::create([
            'user_id' => $patient->id, 
            'provider_name' => 'Dr. Kiandra Karingal', 
            'provider_specialty' => 'Internal Medicine', 
            'appointment_at' => Carbon::parse('2025-11-10 10:30:00'), // <-- FUTURE DATE
            'reason' => 'Routine Annual Checkup', 
            'location' => 'Main Clinic, Room 302', 
            'contact_phone' => '(555) 123-4567', 
            'contact_email' => 'e.reed@clinic.com', 
            'instructions' => 'Please fast for 12 hours prior to your visit. Arrive 15 minutes early.', 
            'status' => 'upcoming'
        ]);

        // --- PAST ---
        Appointment::create([
            'user_id' => $patient->id, 
            'provider_name' => 'Nurse Jayvee Moral', 
            'provider_specialty' => 'Vaccination Clinic', 
            'appointment_at' => Carbon::parse('2025-10-17 09:00:00'), // <-- Past date
            'reason' => 'Flu Shot', 
            'location' => 'Walk-in Center', 
            'contact_phone' => '(555) 111-2222', 
            'contact_email' => 's.lee@clinic.com', 
            'instructions' => 'Wear a short-sleeved shirt.', 
            'status' => 'past'
        ]);
        Appointment::create([
            'user_id' => $patient->id, 
            'provider_name' => 'Dr. Gian Urie Asentista', 
            'provider_specialty' => 'Cardiology', 
            'appointment_at' => Carbon::parse('2025-10-05 14:00:00'), // <-- Past date
            'reason' => 'Follow-up on blood pressure medication', 
            'location' => 'Cardiology Unit, Suite 101', 
            'contact_phone' => '(555) 987-6543', 
            'contact_email' => 'a.chen@clinic.com', 
            'instructions' => '', 
            'status' => 'past'
        ]);
    }
}