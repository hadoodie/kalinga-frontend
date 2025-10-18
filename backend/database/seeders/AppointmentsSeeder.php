<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Appointment;

class AppointmentsSeeder extends Seeder
{
    public function run(): void
    {
        $patient = User::where('email', 'patient_verified@kalinga.com')->first();
        if (!$patient) { return; }

        // Upcoming
        Appointment::create(['user_id' => $patient->id, 'provider_name' => 'Dr. Kiandra Karingal', 'provider_specialty' => 'Internal Medicine', 'appointment_at' => '2025-10-20 10:30:00', 'reason' => 'Routine Annual Checkup', 'location' => 'Main Clinic, Room 302', 'contact_phone' => '(555) 123-4567', 'contact_email' => 'e.reed@clinic.com', 'instructions' => 'Please fast for 12 hours prior to your visit. Arrive 15 minutes early to complete updated consent forms.', 'status' => 'upcoming']);
        Appointment::create(['user_id' => $patient->id, 'provider_name' => 'Nurse Jayvee Moral', 'provider_specialty' => 'Vaccination Clinic', 'appointment_at' => '2025-10-17 09:00:00', 'reason' => 'Flu Shot', 'location' => 'Walk-in Center', 'contact_phone' => '(555) 111-2222', 'contact_email' => 's.lee@clinic.com', 'instructions' => 'Wear a short-sleeved shirt. No specific preparation needed.', 'status' => 'upcoming']);

        // Past
        Appointment::create(['user_id' => $patient->id, 'provider_name' => 'Dr. Gian Urie Asentista', 'provider_specialty' => 'Cardiology', 'appointment_at' => '2025-10-05 14:00:00', 'reason' => 'Follow-up on blood pressure medication', 'location' => 'Cardiology Unit, Suite 101', 'contact_phone' => '(555) 987-6543', 'contact_email' => 'a.chen@clinic.com', 'instructions' => '', 'status' => 'past']);
    }
}