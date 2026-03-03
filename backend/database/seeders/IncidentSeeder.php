<?php

namespace Database\Seeders;

use App\Models\Incident;
use App\Models\IncidentResponderAssignment;
use App\Models\IncidentStatusUpdate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class IncidentSeeder extends Seeder
{
    public function run(): void
    {
        IncidentResponderAssignment::truncate();
        IncidentStatusUpdate::truncate();
        Incident::truncate();

        $patientPrimary = User::where('email', 'patient_verified@kalinga.com')->first();
        $patientSecondary = User::where('email', 'patient_unverified@kalinga.com')->first() ?? $patientPrimary;
        $responderLead = User::where('email', 'responder_verified@kalinga.com')->first();
        $responderMedic = User::where('email', 'jane.doe@kalinga.com')->first();
        $responderDriver = User::where('email', 'john.smith@kalinga.com')->first();

        if (!$patientPrimary || !$responderLead || !$responderMedic) {
            $this->command?->warn('IncidentSeeder skipped because required seed users were not found.');
            return;
        }

        $now = Carbon::now();
        $patientSecondaryId = $patientSecondary ? $patientSecondary->id : $patientPrimary->id;
        $responderDriverId = $responderDriver ? $responderDriver->id : $responderLead->id;

        $incidentDefinitions = [
            [
                'payload' => [
                    'type' => 'Residential Fire',
                    'location' => 'Blk 3, Alley 7, Barangay 17, Quezon City',
                    'latlng' => '14.676200,121.043400',
                    'description' => 'Barangay hotline received reports of thick smoke in a residential compound. Initial responders contained the blaze but require medical standby.',
                    'user_id' => $patientPrimary->id,
                    'status' => Incident::STATUS_ON_SCENE,
                    'responders_required' => 2,
                    'assigned_responder_id' => $responderLead->id,
                    'assigned_at' => $now->copy()->subMinutes(42),
                    'metadata' => [
                        'lat' => 14.6762,
                        'lng' => 121.0434,
                        'hazards' => ['Live electrical lines', 'Low visibility'],
                        'lockdown' => false,
                    ],
                ],
                'history' => [
                    ['status' => Incident::STATUS_REPORTED, 'user_id' => $patientPrimary->id, 'minutes_ago' => 55, 'notes' => 'Emergency hotline call from barangay watch.'],
                    ['status' => Incident::STATUS_ACKNOWLEDGED, 'user_id' => $responderLead->id, 'minutes_ago' => 48, 'notes' => 'Alpha team dispatched from station.'],
                    ['status' => Incident::STATUS_ON_SCENE, 'user_id' => $responderLead->id, 'minutes_ago' => 30, 'notes' => 'Fire contained to kitchen area, monitoring hotspots.'],
                ],
                'assignments' => [
                    [
                        'responder_id' => $responderLead->id,
                        'status' => IncidentResponderAssignment::STATUS_ON_SCENE,
                        'assigned_minutes_ago' => 48,
                        'ack_minutes_ago' => 45,
                        'notes' => 'Primary lead responder',
                    ],
                    [
                        'responder_id' => $responderMedic->id,
                        'status' => IncidentResponderAssignment::STATUS_EN_ROUTE,
                        'assigned_minutes_ago' => 35,
                        'ack_minutes_ago' => 33,
                        'notes' => 'Support medic with ALS kit',
                    ],
                ],
            ],
            [
                'payload' => [
                    'type' => 'Flash Flood Evacuation',
                    'location' => 'Riverside Compound, Marikina',
                    'latlng' => '14.650800,121.102800',
                    'description' => 'Heavy rains triggered localized flooding. Residents need assistance evacuating bedridden patient.',
                    'user_id' => $patientSecondaryId,
                    'status' => Incident::STATUS_EN_ROUTE,
                    'responders_required' => 3,
                    'assigned_responder_id' => $responderMedic->id,
                    'assigned_at' => $now->copy()->subMinutes(20),
                    'metadata' => [
                        'lat' => 14.6508,
                        'lng' => 121.1028,
                        'hazards' => ['Road flooding', 'Limited visibility'],
                    ],
                ],
                'history' => [
                    ['status' => Incident::STATUS_REPORTED, 'user_id' => $patientSecondaryId, 'minutes_ago' => 28, 'notes' => 'Family reported rising water inside home.'],
                    ['status' => Incident::STATUS_ACKNOWLEDGED, 'user_id' => $responderMedic->id, 'minutes_ago' => 24, 'notes' => 'Rescue boat deployed from command post.'],
                    ['status' => Incident::STATUS_EN_ROUTE, 'user_id' => $responderMedic->id, 'minutes_ago' => 20, 'notes' => 'Team navigating via alternate route.'],
                ],
                'assignments' => [
                    [
                        'responder_id' => $responderMedic->id,
                        'status' => IncidentResponderAssignment::STATUS_EN_ROUTE,
                        'assigned_minutes_ago' => 24,
                        'ack_minutes_ago' => 22,
                        'notes' => 'Boat crew lead',
                    ],
                    [
                        'responder_id' => $responderDriverId,
                        'status' => IncidentResponderAssignment::STATUS_ASSIGNED,
                        'assigned_minutes_ago' => 21,
                        'ack_minutes_ago' => 19,
                        'notes' => 'Transport driver staged at hospital',
                    ],
                ],
            ],
            [
                'payload' => [
                    'type' => 'Highway Collision',
                    'location' => 'East Service Road, Parañaque',
                    'latlng' => '14.478600,121.044200',
                    'description' => 'Two-vehicle collision with reported head trauma. Patients stabilized and transported.',
                    'user_id' => $patientPrimary->id,
                    'status' => Incident::STATUS_RESOLVED,
                    'responders_required' => 2,
                    'assigned_responder_id' => $responderLead->id,
                    'assigned_at' => $now->copy()->subHours(3),
                    'completed_at' => $now->copy()->subHours(1),
                    'metadata' => [
                        'lat' => 14.4786,
                        'lng' => 121.0442,
                        'notes' => 'Cleared by highway patrol at 04:10',
                    ],
                ],
                'history' => [
                    ['status' => Incident::STATUS_REPORTED, 'user_id' => $patientPrimary->id, 'minutes_ago' => 180, 'notes' => '911 caller reported multi-car pileup.'],
                    ['status' => Incident::STATUS_ACKNOWLEDGED, 'user_id' => $responderLead->id, 'minutes_ago' => 172, 'notes' => 'Rescue 5 rolling out.'],
                    ['status' => Incident::STATUS_ON_SCENE, 'user_id' => $responderLead->id, 'minutes_ago' => 150, 'notes' => 'Two critical patients extricated.'],
                    ['status' => Incident::STATUS_RESOLVED, 'user_id' => $responderLead->id, 'minutes_ago' => 60, 'notes' => 'Turned over to hospital, scene cleared.'],
                ],
                'assignments' => [
                    [
                        'responder_id' => $responderLead->id,
                        'status' => IncidentResponderAssignment::STATUS_COMPLETED,
                        'assigned_minutes_ago' => 175,
                        'ack_minutes_ago' => 170,
                        'completed_minutes_ago' => 60,
                        'notes' => 'Driver and triage lead',
                    ],
                ],
            ],
        ];

        foreach ($incidentDefinitions as $definition) {
            $payload = $definition['payload'];
            $historyEntries = $definition['history'] ?? [];
            $assignmentEntries = $definition['assignments'] ?? [];

            $metadata = $payload['metadata'] ?? null;
            unset($payload['metadata']);

            $incident = Incident::create(array_merge($payload, [
                'metadata' => $metadata,
            ]));

            foreach ($historyEntries as $entry) {
                $timestamp = $now->copy()->subMinutes($entry['minutes_ago'] ?? 0);

                IncidentStatusUpdate::create([
                    'incident_id' => $incident->id,
                    'user_id' => $entry['user_id'],
                    'status' => $entry['status'],
                    'notes' => $entry['notes'] ?? null,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);
            }

            foreach ($assignmentEntries as $assignmentEntry) {
                $assignedMinutesAgo = $assignmentEntry['assigned_minutes_ago'] ?? null;
                $ackMinutesAgo = $assignmentEntry['ack_minutes_ago'] ?? null;
                $completedMinutesAgo = $assignmentEntry['completed_minutes_ago'] ?? null;

                $assignedAt = $assignedMinutesAgo
                    ? $now->copy()->subMinutes($assignedMinutesAgo)
                    : null;
                $ackAt = $ackMinutesAgo
                    ? $now->copy()->subMinutes($ackMinutesAgo)
                    : null;
                $completedAt = $completedMinutesAgo
                    ? $now->copy()->subMinutes($completedMinutesAgo)
                    : null;

                IncidentResponderAssignment::create([
                    'incident_id' => $incident->id,
                    'responder_id' => $assignmentEntry['responder_id'],
                    'status' => $assignmentEntry['status'],
                    'assigned_at' => $assignedAt,
                    'acknowledged_at' => $ackAt,
                    'completed_at' => $completedAt,
                    'notes' => $assignmentEntry['notes'] ?? null,
                ]);
            }
        }
    }
}
