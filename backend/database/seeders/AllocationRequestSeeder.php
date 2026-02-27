<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Hospital;
use App\Models\AllocationRequest;
use Carbon\Carbon;

class AllocationRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the logistics user who will handle/create requests
        $logisticsUser = User::where('email', 'logistics_verified@kalinga.com')->first();
        
        // Get the hospitals from the 'hospitals' table
        $stLukes = Hospital::where('name', 'St. Luke\'s Medical Center')->first();
        $centralGeneral = Hospital::where('name', 'Central General Hospital')->first();
        $fieldHospital = Hospital::where('name', 'Emergency Field Hospital')->first();

        // Stop if users/hospitals are missing
        if (!$logisticsUser || !$stLukes || !$centralGeneral || !$fieldHospital) {
            $this->command->error('Could not find required User or Hospital models. Please run UserSeeder and HospitalSeeder first.');
            return;
        }

        // --- 10 INCOMING REQUESTS (from Hospitals) ---
        // These are "Pending" and will show up in the "Incoming Requests" tab
        AllocationRequest::create([
            'request_id' => 'R-1001',
            'requester_hospital_id' => $stLukes->id, 
            'handler_id' => $logisticsUser->id,
            'source_location' => $stLukes->name, 
            'urgency' => 'Critical',
            'request_type' => 'Blood',
            'status' => 'Pending',
            'item_name' => 'O-Negative Blood Bags',
            'item_quantity' => 50,
            'contact_info' => $stLukes->contact_number,
            'justification' => 'Multiple trauma patients in ER, urgent need.',
            'created_at' => Carbon::now()->subHours(1),
        ]);

        AllocationRequest::create([
            'request_id' => 'R-1002',
            'requester_hospital_id' => $centralGeneral->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $centralGeneral->name,
            'urgency' => 'High',
            'request_type' => 'Resources',
            'status' => 'Pending',
            'item_name' => 'N95 Masks',
            'item_quantity' => 5000,
            'contact_info' => $centralGeneral->contact_number,
            'justification' => 'Stock running low for ICU staff.',
            'created_at' => Carbon::now()->subHours(2),
        ]);

        AllocationRequest::create([
            'request_id' => 'R-1003',
            'requester_hospital_id' => $fieldHospital->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $fieldHospital->name,
            'urgency' => 'Medium',
            'request_type' => 'Ambulance',
            'status' => 'Pending',
            'item_name' => 'Basic Life Support Ambulance',
            'item_quantity' => 1,
            'contact_info' => $fieldHospital->contact_number,
            'justification' => 'Patient transfer for non-critical procedure.',
            'created_at' => Carbon::now()->subHours(4),
        ]);

        AllocationRequest::create([
            'request_id' => 'R-1004',
            'requester_hospital_id' => $stLukes->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $stLukes->name,
            'urgency' => 'High',
            'request_type' => 'Organs',
            'status' => 'Pending',
            'item_name' => 'Kidney (A+)',
            'item_quantity' => 1,
            'contact_info' => $stLukes->contact_number,
            'justification' => 'Patient in renal failure, match found.',
            'created_at' => Carbon::now()->subDay(),
        ]);
        
        AllocationRequest::create([
            'request_id' => 'R-1005',
            'requester_hospital_id' => $centralGeneral->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $centralGeneral->name,
            'urgency' => 'Medium',
            'request_type' => 'Resources',
            'status' => 'Pending',
            'item_name' => 'Saline Solution (1L bags)',
            'item_quantity' => 200,
            'contact_info' => $centralGeneral->contact_number,
            'justification' => 'Replenishing stock after high patient influx.',
            'created_at' => Carbon::now()->subDays(2),
        ]);

        AllocationRequest::create([
            'request_id' => 'R-1006',
            'requester_hospital_id' => $stLukes->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $stLukes->name,
            'urgency' => 'Low',
            'request_type' => 'Resources',
            'status' => 'Pending',
            'item_name' => 'Gauze and Bandages',
            'item_quantity' => 1000,
            'contact_info' => $stLukes->contact_number,
            'justification' => 'Routine inventory refill.',
            'created_at' => Carbon::now()->subDays(3),
        ]);

        AllocationRequest::create([
            'request_id' => 'R-1007',
            'requester_hospital_id' => $centralGeneral->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $centralGeneral->name,
            'urgency' => 'High',
            'request_type' => 'Resources',
            'status' => 'Pending',
            'item_name' => 'Ventilator',
            'item_quantity' => 2,
            'contact_info' => $centralGeneral->contact_number,
            'justification' => 'New COVID-19 wing opening.',
            'created_at' => Carbon::now()->subDays(4),
        ]);
        
        AllocationRequest::create([
            'request_id' => 'R-1008',
            'requester_hospital_id' => $fieldHospital->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $fieldHospital->name,
            'urgency' => 'Critical',
            'request_type' => 'Ambulance',
            'status' => 'Pending',
            'item_name' => 'Advanced Life Support Ambulance',
            'item_quantity' => 1,
            'contact_info' => $fieldHospital->contact_number,
            'justification' => 'Critical patient transport.',
            'created_at' => Carbon::now()->subHours(6),
        ]);

        AllocationRequest::create([
            'request_id' => 'R-1009',
            'requester_hospital_id' => $stLukes->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $stLukes->name,
            'urgency' => 'High',
            'request_type' => 'Blood',
            'status' => 'Pending',
            'item_name' => 'AB+ Blood Bags',
            'item_quantity' => 10,
            'contact_info' => $stLukes->contact_number,
            'justification' => 'Surgery patient.',
            'created_at' => Carbon::now()->subDays(5),
        ]);
        
        AllocationRequest::create([
            'request_id' => 'R-1010',
            'requester_hospital_id' => $centralGeneral->id,
            'handler_id' => $logisticsUser->id,
            'source_location' => $centralGeneral->name,
            'urgency' => 'Low',
            'request_type' => 'Resources',
            'status' => 'Pending',
            'item_name' => 'Surgical Gowns',
            'item_quantity' => 500,
            'contact_info' => $centralGeneral->contact_number,
            'justification' => 'Stock need miscalculated by department.',
            'created_at' => Carbon::now()->subDays(6),
        ]);


        // --- 5 OUTGOING REQUESTS (from Logistics) ---
        // These will show up in the "Track My Requests" tab
        
        AllocationRequest::create([
            'request_id' => 'S-501',
            'requester_user_id' => $logisticsUser->id,
            'destination_hospital' => $stLukes->name,
            'source_location' => 'Logistics HQ',
            'urgency' => 'High',
            'request_type' => 'Ambulance',
            'status' => 'Shipped', // Use 'Shipped' or 'On-the-Way'
            'item_name' => 'Ambulance Transfer',
            'item_quantity' => 1,
            'justification' => 'Routing patient from HQ clinic to St. Luke\'s.',
            'tracking_history' => [
                ['status' => 'Pending', 'time' => Carbon::now()->subDay(), 'details' => 'Submitted to St. Luke\'s.'],
                ['status' => 'Approved', 'time' => Carbon::now()->subDay()->addHours(2), 'details' => 'Approved by dispatch.'],
                ['status' => 'Shipped', 'time' => Carbon::now()->subHours(2), 'details' => 'Driver: J. Reyes, Plate: ABC 123, ETA: 2:00 PM'],
            ],
            'created_at' => Carbon::now()->subDay(),
            'eta' => Carbon::now()->addHours(3), 
            'current_location_label' => 'On C5-Libis', 
            'current_location_lat' => 14.6045, 
            'current_location_lng' => 121.0660, 
        ]);
        
        AllocationRequest::create([
            'request_id' => 'S-502',
            'requester_user_id' => $logisticsUser->id,
            'destination_hospital' => $centralGeneral->name,
            'source_location' => 'Logistics HQ',
            'urgency' => 'Critical',
            'request_type' => 'Organs',
            'status' => 'On-the-Way', 
            'item_name' => 'Heart (O-)',
            'item_quantity' => 1,
            'justification' => 'Urgent transplant match.',
            'tracking_history' => [
                ['status' => 'Pending', 'time' => Carbon::now()->subDays(2), 'details' => 'Urgent request sent.'],
                ['status' => 'Approved', 'time' => Carbon::now()->subDays(2)->addHours(4), 'details' => 'Awaiting transport team assignment.'],
            ],
            'created_at' => Carbon::now()->subDays(2),
            'eta' => Carbon::now()->addMinutes(45), 
            'current_location_label' => 'Roxas Blvd', 
            'current_location_lat' => 14.5720, 
            'current_location_lng' => 120.9820, 
        ]);

        AllocationRequest::create([
            'request_id' => 'S-503',
            'requester_user_id' => $logisticsUser->id,
            'destination_hospital' => $fieldHospital->name,
            'source_location' => 'Logistics HQ',
            'urgency' => 'Medium',
            'request_type' => 'Resources',
            'status' => 'Packed', 
            'item_name' => 'Ventilators',
            'item_quantity' => 5,
            'justification' => 'Requesting surplus from field inventory.',
            'tracking_history' => [
                ['status' => 'Pending', 'time' => Carbon::now()->subHours(1), 'details' => 'Submitted to field hospital inventory.'],
            ],
            'created_at' => Carbon::now()->subHours(1),
        ]);

        AllocationRequest::create([
            'request_id' => 'S-504',
            'requester_user_id' => $logisticsUser->id,
            'destination_hospital' => $stLukes->name,
            'source_location' => 'Logistics HQ',
            'urgency' => 'High',
            'request_type' => 'Blood',
            'status' => 'Delivered',
            'item_name' => 'O-Negative Blood',
            'item_quantity' => 20,
            'justification' => 'Cross-matching for emergency stock.',
            'tracking_history' => [
                ['status' => 'Pending', 'time' => Carbon::now()->subDays(4), 'details' => 'Submitted request.'],
                ['status' => 'Approved', 'time' => Carbon::now()->subDays(4)->addHours(1), 'details' => 'Approved by blood bank.'],
                ['status' => 'Shipped', 'time' => Carbon::now()->subDays(4)->addHours(2), 'details' => 'Out for delivery.'],
                ['status' => 'Delivered', 'time' => Carbon::now()->subDays(4)->addHours(3), 'details' => 'Received by St. Luke\'s ER.'],
            ],
            'created_at' => Carbon::now()->subDays(4),
            'eta' => Carbon::now()->subDays(4)->addHours(3), 
        ]);
        
        AllocationRequest::create([
            'request_id' => 'S-505',
            'requester_user_id' => $logisticsUser->id,
            'destination_hospital' => $centralGeneral->name,
            'source_location' => 'Logistics HQ',
            'urgency' => 'Low',
            'request_type' => 'Resources',
            'status' => 'Cancelled', 
            'item_name' => 'Gowns, Sterile',
            'item_quantity' => 500,
            'justification' => 'Routine stock transfer request.',
            'rejection_reason' => 'Request cancelled by our team.',
            'tracking_history' => [
                ['status' => 'Pending', 'time' => Carbon::now()->subDays(3), 'details' => 'Request submitted.'],
                ['status' => 'Cancelled', 'time' => Carbon::now()->subDays(2), 'details' => 'Request cancelled by our team.'],
            ],
            'created_at' => Carbon::now()->subDays(3),
        ]);
    }
}