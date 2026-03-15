<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Hospital;
use App\Models\Request as SupplyRequest;
use App\Models\Allocation;
use Carbon\Carbon;

/**
 * Seed realistic active supply-chain records using the current
 * Allocation + Request architecture (replaces the old AllocationRequest model).
 *
 * GPS coordinates are stored in Allocation.meta so the LiveTrackingMap
 * can render truck markers on the map.
 */
class AllocationRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $logisticsUser = User::where('email', 'logistics_verified@kalinga.com')->first();
        $stLukes       = Hospital::where('name', 'St. Luke\'s Medical Center - Global City')->first();
        $central       = Hospital::where('name', 'Central General Hospital')->first();
        $field         = Hospital::where('name', 'Emergency Field Hospital')->first();

        if (!$logisticsUser || !$stLukes || !$central || !$field) {
            $this->command->error(
                'Missing required User or Hospital records. Run UserSeeder and HospitalSeeder first.'
            );
            return;
        }

        // ──────────────────────────────────────────────────────────────────
        // Helper: create a linked Request + Allocation pair in one call
        // ──────────────────────────────────────────────────────────────────
        $make = function (array $reqData, array $allocData) {
            $req = SupplyRequest::create($reqData);
            Allocation::create(array_merge(['request_id' => $req->id], $allocData));
        };

        $uid = $logisticsUser->id;

        // ── 1. Critical: Ambulance Transfer – logistics_assigned (GPS: C5-Libis) ──
        $make(
            [
                'hospital_id'    => $stLukes->id,
                'resource_name'  => 'Ambulance Transfer',
                'quantity'       => 1,
                'urgency_level'  => 'Critical',
                'handling_class' => 'General',
                'reason'         => 'Critical patient transport to St. Luke\'s.',
                'status'         => 'in_transit',
                'created_by'     => $uid,
            ],
            [
                'source_hospital_id'      => $central->id,
                'destination_hospital_id' => $stLukes->id,
                'resource_type'           => 'Ambulance Transfer',
                'quantity'                => 1,
                'handling_class'          => 'General',
                'status'                  => 'logistics_assigned',
                'created_by'              => $uid,
                'assigned_at'             => Carbon::now()->subHours(2),
                'dispatched_at'           => Carbon::now()->subMinutes(90),
                'meta'                    => [
                    'current_location_lat'   => 14.6045,
                    'current_location_lng'   => 121.0660,
                    'current_location_label' => 'On C5-Libis',
                    'notes'                  => 'Driver: J. Reyes, Plate: ABC 123',
                ],
            ]
        );

        // ── 2. Critical: Heart Organ – logistics_assigned (GPS: Roxas Blvd) ──
        $make(
            [
                'hospital_id'    => $central->id,
                'resource_name'  => 'Heart (O-)',
                'quantity'       => 1,
                'urgency_level'  => 'Critical',
                'handling_class' => 'ColdChain',
                'reason'         => 'Urgent transplant match — time-critical.',
                'status'         => 'in_transit',
                'created_by'     => $uid,
            ],
            [
                'source_hospital_id'      => $stLukes->id,
                'destination_hospital_id' => $central->id,
                'resource_type'           => 'Organ: Heart (O-)',
                'quantity'                => 1,
                'handling_class'          => 'Cold Chain',
                'status'                  => 'logistics_assigned',
                'created_by'              => $uid,
                'assigned_at'             => Carbon::now()->subHours(4),
                'dispatched_at'           => Carbon::now()->subHour(),
                'meta'                    => [
                    'current_location_lat'   => 14.5720,
                    'current_location_lng'   => 120.9820,
                    'current_location_label' => 'Roxas Blvd',
                    'notes'                  => 'Cold chain temp: 4°C. Driver: M. Santos.',
                ],
            ]
        );

        // ── 3. High: Portable Ventilators – logistics_assigned (GPS: EDSA-Aurora) ──
        $make(
            [
                'hospital_id'    => $field->id,
                'resource_name'  => 'Portable Ventilators',
                'quantity'       => 5,
                'urgency_level'  => 'High',
                'handling_class' => 'HighValue',
                'reason'         => 'Emergency field hospital expansion.',
                'status'         => 'allocated',
                'created_by'     => $uid,
            ],
            [
                'source_hospital_id'      => $central->id,
                'destination_hospital_id' => $field->id,
                'resource_type'           => 'Portable Ventilators',
                'quantity'                => 5,
                'handling_class'          => 'High-Value',
                'status'                  => 'logistics_assigned',
                'created_by'              => $uid,
                'assigned_at'             => Carbon::now()->subHour(),
                'dispatched_at'           => Carbon::now()->subMinutes(20),
                'meta'                    => [
                    'current_location_lat'   => 14.6200,
                    'current_location_lng'   => 121.0500,
                    'current_location_label' => 'EDSA-Aurora Intersection',
                    'notes'                  => 'Fragile cargo, reduced speed.',
                ],
            ]
        );

        // ── 4. High: O-Negative Blood – confirmed/Packed (no GPS yet) ──
        $make(
            [
                'hospital_id'    => $stLukes->id,
                'resource_name'  => 'O-Negative Blood Bags',
                'quantity'       => 50,
                'urgency_level'  => 'High',
                'handling_class' => 'ColdChain',
                'reason'         => 'Multiple trauma patients in ER.',
                'status'         => 'allocated',
                'created_by'     => $uid,
            ],
            [
                'source_hospital_id'      => $field->id,
                'destination_hospital_id' => $stLukes->id,
                'resource_type'           => 'O-Negative Blood Bags',
                'quantity'                => 50,
                'handling_class'          => 'Cold Chain',
                'status'                  => 'confirmed',
                'created_by'              => $uid,
                'confirmed_by'            => $uid,
                'confirmed_at'            => Carbon::now()->subMinutes(30),
                'meta'                    => [
                    'current_location_lat'   => null,
                    'current_location_lng'   => null,
                    'current_location_label' => 'Awaiting dispatch',
                    'notes'                  => 'Packed and ready, driver pending.',
                ],
            ]
        );

        // ── 5. Medium: N95 Masks – delivered ──
        $make(
            [
                'hospital_id'    => $central->id,
                'resource_name'  => 'N95 Masks',
                'quantity'       => 5000,
                'urgency_level'  => 'Medium',
                'handling_class' => 'General',
                'reason'         => 'ICU staff PPE stock replenishment.',
                'status'         => 'delivered',
                'created_by'     => $uid,
            ],
            [
                'source_hospital_id'      => $stLukes->id,
                'destination_hospital_id' => $central->id,
                'resource_type'           => 'N95 Masks',
                'quantity'                => 5000,
                'handling_class'          => 'General',
                'status'                  => 'delivered',
                'created_by'              => $uid,
                'dispatched_at'           => Carbon::now()->subDay(),
                'delivered_at'            => Carbon::now()->subHours(6),
                'meta'                    => [
                    'current_location_lat'   => null,
                    'current_location_lng'   => null,
                    'current_location_label' => 'Delivered',
                ],
            ]
        );

        // ── 6. Critical: Saline IV Bags – logistics_assigned + overdue = Delayed (GPS: Quezon Ave) ──
        $make(
            [
                'hospital_id'    => $field->id,
                'resource_name'  => 'Saline Solution (1L bags)',
                'quantity'       => 200,
                'urgency_level'  => 'Critical',
                'handling_class' => 'General',
                'reason'         => 'High patient influx surge.',
                'status'         => 'in_transit',
                'created_by'     => $uid,
            ],
            [
                'source_hospital_id'      => $stLukes->id,
                'destination_hospital_id' => $field->id,
                'resource_type'           => 'Saline Solution (1L bags)',
                'quantity'                => 200,
                'handling_class'          => 'General',
                'status'                  => 'logistics_assigned',
                'created_by'              => $uid,
                'assigned_at'             => Carbon::now()->subHours(5),
                // dispatched 3h ago, ETA was 2h → now overdue → backend marks Delayed
                'dispatched_at'           => Carbon::now()->subHours(3),
                'meta'                    => [
                    'current_location_lat'   => 14.6400,
                    'current_location_lng'   => 121.0100,
                    'current_location_label' => 'Quezon Ave near GMA-Kamuning',
                    'notes'                  => 'Stuck in traffic. ETA updated +90 min.',
                ],
            ]
        );

        $this->command->info('AllocationRequestSeeder: 6 supply records seeded.');
    }
}
