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
        // Add this line to prevent duplicate notifications
        Notification::truncate();

        // --- 1. Find the Patient User ---
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
        } else {
            $this->command->info('Patient user not found. Skipping patient notifications.');
        }

        // --- 2. Find the Logistics User ---
        $logisticsUser = User::where('email', 'logistics_verified@kalinga.com')->first();

        if ($logisticsUser) {
            // 1. New Incoming Request
            Notification::create([
                'user_id' => $logisticsUser->id,
                'title' => 'New Incoming Request',
                'description' => 'St. Luke\'s Medical Center has submitted a critical request for O-Negative Blood.',
                'created_at' => Carbon::now()->subMinutes(5),
            ]);

            // 2. Outgoing Request Approved
            Notification::create([
                'user_id' => $logisticsUser->id,
                'title' => 'Request Approved',
                'description' => 'Your request (S-502) for a Heart (O-) to Central General Hospital has been approved.',
                'created_at' => Carbon::now()->subHours(2),
            ]);

            // 3. Outgoing Request Rejected
            Notification::create([
                'user_id' => $logisticsUser->id,
                'title' => 'Request Cancelled',
                'description' => 'Your request (S-505) for Sterile Gowns to Central General has been cancelled.',
                'created_at' => Carbon::now()->subDays(1),
            ]);

            // 4. Shipment Delivered
            Notification::create([
                'user_id' => $logisticsUser->id,
                'title' => 'Shipment Delivered',
                'description' => 'Your shipment (S-504) of O-Negative Blood to St. Luke\'s has been successfully delivered.',
                'created_at' => Carbon::now()->subDays(2),
            ]);
            
            // 5. Low Stock Warning
            Notification::create([
                'user_id' => $logisticsUser->id,
                'title' => 'Inventory Alert',
                'description' => 'N95 Masks (Stock: 5000) has fallen below the critical threshold.',
                'created_at' => Carbon::now()->subDays(3),
            ]);
        } else {
             $this->command->info('Logistics user not found. Skipping logistics notifications.');
        }
    }
}