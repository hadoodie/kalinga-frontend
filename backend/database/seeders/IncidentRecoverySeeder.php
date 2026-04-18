<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Incident;
use App\Models\IncidentResponderAssignment;
use App\Models\IncidentStatusUpdate;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class IncidentRecoverySeeder extends Seeder
{
    public function run(): void
    {
        $patients = User::query()
            ->where('role', 'patient')
            ->orderBy('id')
            ->get();

        $responders = User::query()
            ->where('role', 'responder')
            ->orderBy('id')
            ->get();

        if ($patients->isEmpty() || $responders->isEmpty()) {
            $this->command?->warn('IncidentRecoverySeeder skipped: patient or responder users not found.');
            return;
        }

        $fallbackLatLng = '14.587161948115629, 120.98448943772256';

        $rows = [
            [
                'source_incident_id' => 1,
                'latlng' => '14.65700, 120.98490',
                'location_label' => 'Recovered location #1',
                'initiated_at' => '2026-04-11 02:01:36',
                'received_at' => '2026-04-11 02:01:38',
            ],
            [
                'source_incident_id' => 2,
                'latlng' => '14.73049, 121.13642',
                'location_label' => 'Recovered location #2',
                'initiated_at' => '2026-04-14 10:00:16',
                'received_at' => '2026-04-14 10:00:18',
            ],
            [
                'source_incident_id' => 3,
                'latlng' => '14.58885, 121.22538',
                'location_label' => 'Recovered location #3',
                'initiated_at' => '2026-04-14 10:32:04',
                'received_at' => '2026-04-14 10:32:06',
            ],
            [
                'source_incident_id' => 4,
                'latlng' => '14.61414, 121.25785',
                'location_label' => 'Recovered location #4',
                'initiated_at' => '2026-04-14 10:46:32',
                'received_at' => '2026-04-14 10:52:47',
            ],
            [
                'source_incident_id' => 5,
                'latlng' => null,
                'location_label' => 'No Location (fallback applied)',
                'initiated_at' => '2026-04-14 10:46:32',
                'received_at' => null,
            ],
            [
                'source_incident_id' => 6,
                'latlng' => '14.63149, 121.21228',
                'location_label' => 'Recovered location #6',
                'initiated_at' => '2026-04-14 10:48:37',
                'received_at' => '2026-04-14 10:54:55',
            ],
            [
                'source_incident_id' => 7,
                'latlng' => '14.66614, 120.95528',
                'location_label' => 'Recovered location #7',
                'initiated_at' => '2026-04-14 10:54:53',
                'received_at' => '2026-04-14 11:09:25',
            ],
            [
                'source_incident_id' => 8,
                'latlng' => null,
                'location_label' => 'No Location (fallback applied)',
                'initiated_at' => '2026-04-14 11:02:52',
                'received_at' => null,
            ],
        ];

        foreach ($rows as $index => $row) {
            DB::transaction(function () use ($patients, $responders, $row, $index, $fallbackLatLng) {
                $patient = $patients[$index % $patients->count()];
                $responder = $responders[$index % $responders->count()];

                $initiatedAt = Carbon::createFromFormat('Y-m-d H:i:s', $row['initiated_at']);
                $receivedAt = $row['received_at']
                    ? Carbon::createFromFormat('Y-m-d H:i:s', $row['received_at'])
                    : $initiatedAt->copy()->addSeconds(120);

                $latlng = $row['latlng'] ?? $fallbackLatLng;

                $existing = Incident::query()
                    ->where('user_id', $patient->id)
                    ->where('latlng', $latlng)
                    ->where('created_at', $initiatedAt)
                    ->first();

                if ($existing) {
                    return;
                }

                $pair = [$patient->id, $responder->id];
                sort($pair);

                $conversation = Conversation::create([
                    'user_id1' => $pair[0],
                    'user_id2' => $pair[1],
                    'is_archived' => 'false',
                    'archived_at' => null,
                    'created_at' => $initiatedAt,
                    'updated_at' => $receivedAt,
                ]);

                $incident = Incident::create([
                    'type' => 'Emergency SOS',
                    'location' => $row['location_label'],
                    'latlng' => $latlng,
                    'description' => sprintf(
                        '[Recovered SOS] Source Incident %d. Reconstructed from available timeline data.',
                        $row['source_incident_id']
                    ),
                    'user_id' => $patient->id,
                    'conversation_id' => $conversation->id,
                    'status' => Incident::STATUS_ACKNOWLEDGED,
                    'assigned_responder_id' => $responder->id,
                    'assigned_at' => $receivedAt,
                    'completed_at' => null,
                    'responders_required' => 1,
                    'metadata' => [
                        'recovery_batch' => '2026-04-incident-rebuild',
                        'source_incident_id' => $row['source_incident_id'],
                        'original_reception_time' => $row['received_at'],
                        'auto_assigned_reception_time' => $row['received_at'] ? null : $receivedAt->toDateTimeString(),
                        'location_was_fallback' => $row['latlng'] === null,
                    ],
                    'created_at' => $initiatedAt,
                    'updated_at' => $receivedAt,
                ]);

                IncidentResponderAssignment::create([
                    'incident_id' => $incident->id,
                    'responder_id' => $responder->id,
                    'status' => IncidentResponderAssignment::STATUS_ASSIGNED,
                    'assigned_at' => $receivedAt,
                    'acknowledged_at' => $receivedAt,
                    'completed_at' => null,
                    'notes' => 'Recovered assignment from historical SOS telemetry data.',
                    'created_at' => $receivedAt,
                    'updated_at' => $receivedAt,
                ]);

                IncidentStatusUpdate::create([
                    'incident_id' => $incident->id,
                    'user_id' => $patient->id,
                    'status' => Incident::STATUS_REPORTED,
                    'notes' => 'Recovered: patient SOS trigger.',
                    'created_at' => $initiatedAt,
                    'updated_at' => $initiatedAt,
                ]);

                IncidentStatusUpdate::create([
                    'incident_id' => $incident->id,
                    'user_id' => $responder->id,
                    'status' => Incident::STATUS_ACKNOWLEDGED,
                    'notes' => 'Recovered: responder acknowledged incident assignment.',
                    'created_at' => $receivedAt,
                    'updated_at' => $receivedAt,
                ]);

                $sosMessage = Message::create([
                    'message' => '🚨 Emergency SOS activated by patient.',
                    'sender_id' => $patient->id,
                    'receiver_id' => $responder->id,
                    'group_id' => null,
                    'conversation_id' => $conversation->id,
                    'incident_id' => $incident->id,
                    'created_at' => $initiatedAt,
                    'updated_at' => $initiatedAt,
                ]);

                $autoReplyTime = $receivedAt->copy()->addSeconds(5);

                $autoReply = Message::create([
                    'message' => 'Responder has received your emergency alert and is preparing to assist you. Stay safe and provide any updates if your situation changes.',
                    'sender_id' => $responder->id,
                    'receiver_id' => $patient->id,
                    'group_id' => null,
                    'conversation_id' => $conversation->id,
                    'incident_id' => $incident->id,
                    'created_at' => $autoReplyTime,
                    'updated_at' => $autoReplyTime,
                ]);

                $conversation->update([
                    'last_message_id' => $autoReply->id,
                    'updated_at' => $autoReplyTime,
                ]);

                // Keep first message referenced to prevent unused variable optimizers removing context.
                if (!$sosMessage->id) {
                    throw new \RuntimeException('Failed to create recovered SOS message.');
                }
            });
        }
    }
}
