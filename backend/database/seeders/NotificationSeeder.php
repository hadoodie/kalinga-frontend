<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Find the patient user
        $patient = User::where('email', 'patient_verified@kalinga.com')->first();

        if ($patient) {
            // Sample 1: Lab Result Ready (10 minutes ago)
            Notification::create([
                'user_id' => $patient->id,
                'title' => 'Lab Result Ready',
                'description' => 'Your Comprehensive Metabolic Panel (CMP) results from ' . Carbon::now()->subDays(1)->format('M d, Y') . ' are now available.',
                'created_at' => Carbon::now()->subMinutes(10),
            ]);

            // Sample 2: Appointment Cancelled (1 day ago)
            Notification::create([
                'user_id' => $patient->id,
                'title' => 'Appointment Cancelled',
                'description' => 'Your upcoming appointment with Dr. Gian Urie Asentista on ' . Carbon::now()->addDays(5)->format('M d, Y') . ' has been cancelled by the provider.',
                'created_at' => Carbon::now()->subDays(1),
            ]);

            // Sample 3: Appointment Confirmed (2 days ago)
            Notification::create([
                'user_id' => $patient->id,
                'title' => 'Appointment Confirmed',
                'description' => 'Your request for a \'Routine Annual Checkup\' with Dr. Kiandra Karingal on ' . Carbon::now()->addDays(10)->format('M d, Y') . ' has been confirmed.',
                'created_at' => Carbon::now()->subDays(2),
            ]);

            // Sample 4: Prescription Refill Ready (4 days ago)
            Notification::create([
                'user_id' => $patient->id,
                'title' => 'Prescription Refill Ready',
                'description' => 'Your refill request for Lisinopril (10 mg) has been approved and is ready for pickup.',
                'created_at' => Carbon::now()->subDays(4),
            ]);

            // Sample 5: General Health Alert (1 week ago)
            Notification::create([
                'user_id' => $patient->id,
                'title' => 'Health Alert: Flu Season',
                'description' => 'It\'s flu season! Don\'t forget to schedule your annual flu shot from the \'Appointments\' page.',
                'created_at' => Carbon::now()->subWeeks(1),
            ]);
        }
    }
}