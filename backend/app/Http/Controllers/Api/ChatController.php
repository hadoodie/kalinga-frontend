<?php

namespace App\Http\Controllers\Api;

use App\Events\IncidentUpdated;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Incident;
use App\Models\IncidentStatusUpdate;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    public function getConversations(Request $request)
    {
        $user = $request->user();
        $conversations = Conversation::query()
            ->with([
                'user1:id,name,role,profile_image',
                'user2:id,name,role,profile_image',
                'lastMessage:id,message,sender_id,receiver_id,conversation_id,created_at',
            ])
            ->where(function ($query) use ($user) {
                $query->where('user_id1', $user->id)
                    ->orWhere('user_id2', $user->id);
            })
            ->orderByDesc('updated_at')
            ->get();

        $conversationIds = $conversations->pluck('id')->filter()->all();

        $messagesByConversation = Message::query()
            ->with([
                'sender:id,name,role',
                'receiver:id,name,role',
            ])
            ->whereIn('conversation_id', $conversationIds)
            ->orderBy('created_at')
            ->get()
            ->groupBy('conversation_id');

        $normalized = $conversations
            ->map(function (Conversation $conversation) use ($user, $messagesByConversation) {
                $otherUser = $conversation->user_id1 === $user->id
                    ? $conversation->user2
                    : $conversation->user1;

                if (!$otherUser) {
                    return null;
                }

                $participantPayload = [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'role' => $otherUser->role,
                    'avatar' => $otherUser->profile_image,
                    'profile_image' => $otherUser->profile_image,
                ];

                $selfUser = $conversation->user_id1 === $user->id
                    ? $conversation->user1
                    : $conversation->user2;

                $selfPayload = $selfUser ? [
                    'id' => $selfUser->id,
                    'name' => $selfUser->name,
                    'role' => $selfUser->role,
                    'avatar' => $selfUser->profile_image,
                    'profile_image' => $selfUser->profile_image,
                ] : null;

                $messages = ($messagesByConversation[$conversation->id] ?? collect())
                    ->map(function (Message $message) {
                        return [
                            'id' => $message->id,
                            'text' => $message->message,
                            'senderId' => $message->sender_id,
                            'receiverId' => $message->receiver_id,
                            'sender' => $message->sender?->name,
                            'timestamp' => optional($message->created_at)->toIso8601String(),
                            'isRead' => true,
                            'isSystemMessage' => false,
                        ];
                    })
                    ->values();

                $lastMessage = $messages->last();

                return [
                    'id' => $conversation->id,
                    'conversationId' => $conversation->id,
                    'participant' => $participantPayload,
                    'participants' => array_values(array_filter([$participantPayload, $selfPayload])),
                    'category' => $this->mapCategory($otherUser->role ?? null),
                    'unreadCount' => 0,
                    'isArchived' => (bool) $conversation->is_archived,
                    'lastMessage' => $lastMessage['text'] ?? $conversation->lastMessage?->message,
                    'lastMessageTime' => $lastMessage['timestamp']
                        ?? optional($conversation->lastMessage?->created_at)->toIso8601String(),
                    'messages' => $messages,
                ];
            })
            ->filter()
            ->values();

        if ($normalized->isEmpty()) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => $normalized->sortByDesc('lastMessageTime')->values(),
        ]);
    }

    public function getMessages(Request $request, int $otherUserId)
    {
        $user = $request->user();

        $messages = Message::with([
            'sender:id,name',
            'receiver:id,name',
        ])
            ->whereNull('group_id')
            ->where(function ($query) use ($user, $otherUserId) {
                $query->where(function ($inner) use ($user, $otherUserId) {
                    $inner->where('sender_id', $user->id)
                        ->where('receiver_id', $otherUserId);
                })->orWhere(function ($inner) use ($user, $otherUserId) {
                    $inner->where('sender_id', $otherUserId)
                        ->where('receiver_id', $user->id);
                });
            })
            ->orderBy('created_at')
            ->get()
            ->map(function (Message $message) use ($user) {
                return [
                    'id' => $message->id,
                    'text' => $message->message,
                    'senderId' => $message->sender_id,
                    'receiverId' => $message->receiver_id,
                    'sender' => $message->sender?->name,
                    'timestamp' => optional($message->created_at)->toIso8601String(),
                    'isRead' => true,
                    'isSystemMessage' => false,
                    'isOwn' => $message->sender_id === $user->id,
                ];
            });

        return response()->json([
            'data' => $messages,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_id' => ['required', 'integer', 'exists:users,id'],
            'message' => ['required_without:group_id', 'nullable', 'string'],
            'group_id' => ['nullable', 'integer', 'exists:groups,id'],
            'emergency_payload' => ['nullable', 'array'],
        ]);

        if ((int) $validated['receiver_id'] === $user->id && empty($validated['group_id'])) {
            throw ValidationException::withMessages([
                'receiver_id' => 'You cannot send a direct message to yourself.',
            ]);
        }
        $receiverId = (int) $validated['receiver_id'];
        $groupId = $validated['group_id'] ?? null;
        $emergencyPayload = $validated['emergency_payload'] ?? null;

        $conversationId = null;
        $conversationModel = null;

        if (!$groupId) {
            $conversationModel = $this->firstOrCreateConversation($user->id, $receiverId);
            $conversationId = $conversationModel->id;
        }

        $message = Message::create([
            'message' => $validated['message'],
            'sender_id' => $user->id,
            'receiver_id' => $groupId ? null : $receiverId,
            'group_id' => $groupId,
            'conversation_id' => $conversationId,
        ]);

        if ($conversationId) {
            Conversation::whereKey($conversationId)->update([
                'last_message_id' => $message->id,
            ]);
        } elseif ($groupId) {
            DB::table('groups')
                ->where('id', $groupId)
                ->update(['last_message_id' => $message->id]);
        }

        $message->load(['sender:id,name,role,profile_image', 'receiver:id,name,role,profile_image']);

        $senderPayload = $message->sender ? [
            'id' => $message->sender->id,
            'name' => $message->sender->name,
            'role' => $message->sender->role,
            'avatar' => $message->sender->profile_image,
            'profile_image' => $message->sender->profile_image,
        ] : null;

        $receiverPayload = $message->receiver ? [
            'id' => $message->receiver->id,
            'name' => $message->receiver->name,
            'role' => $message->receiver->role,
            'avatar' => $message->receiver->profile_image,
            'profile_image' => $message->receiver->profile_image,
        ] : null;

        $participant = $receiverPayload ?? $senderPayload;

        $timestamp = optional($message->created_at)->toIso8601String();

        $messagePayload = [
            'id' => $message->id,
            'text' => $message->message,
            'senderId' => $message->sender_id,
            'receiverId' => $message->receiver_id,
            'sender' => $message->sender?->name,
            'timestamp' => $timestamp,
            'isRead' => false,
            'isSystemMessage' => false,
        ];

        $conversationPayload = [
            'id' => $conversationId ?? 'user-' . ($participant['id'] ?? 'unknown'),
            'conversationId' => $conversationId,
            'participant' => $participant,
            'participants' => collect([$senderPayload, $receiverPayload])->filter()->values()->all(),
            'sender' => $senderPayload,
            'receiver' => $receiverPayload,
            'category' => $this->mapCategory($participant['role'] ?? null),
            'unreadCount' => 0,
            'isArchived' => (bool) ($conversationModel?->is_archived ?? false),
            'lastMessage' => $message->message,
            'lastMessageTime' => $timestamp,
            'messages' => [$messagePayload],
        ];

        broadcast(new MessageSent(
            message: $messagePayload,
            conversation: $conversationPayload,
            senderId: $user->id,
            receiverId: $groupId ? null : $receiverId,
            groupId: $groupId,
        ));

        $autoReplyPayload = $this->handleEmergencyEscalation(
            sender: $user,
            patientMessage: $message,
            conversationPayload: $conversationPayload,
            receiverPayload: $receiverPayload,
            emergencyPayload: $emergencyPayload,
        );

        $responseData = array_merge($messagePayload, [
            'isOwn' => true,
            'conversationId' => $conversationId,
            'participant' => $conversationPayload['participant'],
            'participants' => $conversationPayload['participants'],
            'receiver' => $receiverPayload,
            'sender' => $senderPayload,
        ]);

        if ($autoReplyPayload) {
            $responseData['autoReply'] = $autoReplyPayload;
        }

        return response()->json([
            'data' => $responseData,
        ], 201);
    }

    private function handleEmergencyEscalation(
        \App\Models\User $sender,
        Message $patientMessage,
        array $conversationPayload,
        ?array $receiverPayload,
        ?array $emergencyPayload
    ): ?array {
        if (empty($emergencyPayload) || $sender->role !== 'patient') {
            return null;
        }

        if (!$receiverPayload || !isset($receiverPayload['id'])) {
            return null;
        }

        $latitudeRaw = Arr::get($emergencyPayload, 'latitude');
        $longitudeRaw = Arr::get($emergencyPayload, 'longitude');

        $latitude = is_numeric($latitudeRaw) ? (float) $latitudeRaw : null;
        $longitude = is_numeric($longitudeRaw) ? (float) $longitudeRaw : null;

        $locationLabel = Arr::get($emergencyPayload, 'location_label');
        $locationLabel = $locationLabel !== null ? trim((string) $locationLabel) : null;

        if (!$locationLabel) {
            if ($latitude !== null && $longitude !== null) {
                $locationLabel = sprintf('Coordinates: %.5f, %.5f', $latitude, $longitude);
            } else {
                $locationLabel = 'Location not provided';
            }
        }

        $rawDescription = Arr::get($emergencyPayload, 'description')
            ?? $patientMessage->message
            ?? 'Emergency SOS triggered.';

        $incidentType = Arr::get($emergencyPayload, 'incident_type', 'Emergency SOS');

        $latlngValue = ($latitude !== null && $longitude !== null)
            ? sprintf('%.6f,%.6f', $latitude, $longitude)
            : null;

        $formattedDescription = $this->formatIncidentDescription([
            'incident_type' => $incidentType,
            'location_label' => $locationLabel,
            'latlng' => $latlngValue,
            'raw_description' => $rawDescription,
            'triggered_at' => Arr::get($emergencyPayload, 'triggered_at'),
            'reported_at' => $patientMessage->created_at,
            'accuracy' => Arr::get($emergencyPayload, 'accuracy'),
            'map_url' => Arr::get($emergencyPayload, 'map_url'),
            'notes' => Arr::get($emergencyPayload, 'notes'),
            'location_error' => Arr::get($emergencyPayload, 'location_error'),
        ]);

        $respondersRequired = (int) ($emergencyPayload['responders_required'] ?? 1);
        if ($respondersRequired < 1) {
            $respondersRequired = 1;
        }

        $incidentData = [
            'type' => $incidentType,
            'location' => $locationLabel,
            'latlng' => $latlngValue,
            'description' => $formattedDescription ?? $rawDescription,
            'user_id' => $sender->id,
            'status' => Incident::STATUS_REPORTED,
            'responders_required' => $respondersRequired,
            'assigned_responder_id' => null,
            'assigned_at' => null,
        ];

        $conversationId = $conversationPayload['conversationId'] ?? null;
        if ($conversationId) {
            $incidentData['conversation_id'] = $conversationId;

            Conversation::whereKey($conversationId)->update([
                'is_archived' => false,
                'archived_at' => null,
            ]);
        }

        $incident = Incident::create($incidentData);

        IncidentStatusUpdate::create([
            'incident_id' => $incident->id,
            'user_id' => $sender->id,
            'status' => Incident::STATUS_REPORTED,
            'notes' => 'Emergency SOS created via responder chat.',
        ]);

        broadcast(new IncidentUpdated($incident))->toOthers();

        $conversationId = $conversationPayload['conversationId'] ?? null;

        if (!$conversationId) {
            return null;
        }

        $autoReplyText = Arr::get($emergencyPayload, 'auto_reply_text')
            ?? 'Responder has received your emergency alert and is preparing to assist you. Stay safe and provide any updates if your situation changes.';

        $autoMessage = Message::create([
            'message' => $autoReplyText,
            'sender_id' => $receiverPayload['id'],
            'receiver_id' => $sender->id,
            'group_id' => null,
            'conversation_id' => $conversationId,
        ]);

        Conversation::whereKey($conversationId)->update([
            'last_message_id' => $autoMessage->id,
        ]);

        $autoMessage->load(['sender:id,name,role,profile_image', 'receiver:id,name,role,profile_image']);

        $autoSenderPayload = $autoMessage->sender ? [
            'id' => $autoMessage->sender->id,
            'name' => $autoMessage->sender->name,
            'role' => $autoMessage->sender->role,
            'avatar' => $autoMessage->sender->profile_image,
            'profile_image' => $autoMessage->sender->profile_image,
        ] : null;

        $autoReceiverPayload = $autoMessage->receiver ? [
            'id' => $autoMessage->receiver->id,
            'name' => $autoMessage->receiver->name,
            'role' => $autoMessage->receiver->role,
            'avatar' => $autoMessage->receiver->profile_image,
            'profile_image' => $autoMessage->receiver->profile_image,
        ] : null;

        $autoTimestamp = optional($autoMessage->created_at)->toIso8601String();

        $autoMessagePayload = [
            'id' => $autoMessage->id,
            'text' => $autoMessage->message,
            'senderId' => $autoMessage->sender_id,
            'receiverId' => $autoMessage->receiver_id,
            'sender' => $autoMessage->sender?->name,
            'timestamp' => $autoTimestamp,
            'isRead' => false,
            'isSystemMessage' => false,
        ];

        $participants = $conversationPayload['participants']
            ?? collect([$autoSenderPayload, $autoReceiverPayload])
                ->filter()
                ->values()
                ->all();

        $participant = $conversationPayload['participant']
            ?? ($autoReceiverPayload ?? $autoSenderPayload);

        $autoConversationPayload = [
            'id' => $conversationPayload['id'],
            'conversationId' => $conversationId,
            'participant' => $participant,
            'participants' => $participants,
            'sender' => $autoSenderPayload,
            'receiver' => $autoReceiverPayload,
            'category' => $conversationPayload['category'] ?? 'Emergency',
            'unreadCount' => 0,
            'isArchived' => false,
            'lastMessage' => $autoMessage->message,
            'lastMessageTime' => $autoTimestamp,
            'messages' => [$autoMessagePayload],
        ];

        broadcast(new MessageSent(
            message: $autoMessagePayload,
            conversation: $autoConversationPayload,
            senderId: $autoMessage->sender_id,
            receiverId: $autoMessage->receiver_id,
            groupId: null,
            suppressCurrentUser: false,
        ));

        return [
            'message' => $autoMessagePayload,
            'conversation' => $autoConversationPayload,
        ];
    }

    public function deleteMessage(Request $request, int $messageId)
    {
        $user = $request->user();

        $message = Message::where('id', $messageId)
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->firstOrFail();

        $message->delete();

        return response()->json([
            'status' => 'deleted',
        ]);
    }

    private function firstOrCreateConversation(int $userId, int $otherUserId): Conversation
    {
        $ids = collect([$userId, $otherUserId])->sort()->values();
        $conversation = Conversation::query()
            ->where('user_id1', $ids[0])
            ->where('user_id2', $ids[1])
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($conversation) {
            if ($conversation->is_archived) {
                $conversation->forceFill(['is_archived' => false])->save();
            }
            return $conversation;
        }

        return Conversation::create([
            'user_id1' => $ids[0],
            'user_id2' => $ids[1],
            'is_archived' => false,
        ]);
    }

    private function formatIncidentDescription(array $metadata): ?string
    {
        $incidentType = trim((string) ($metadata['incident_type'] ?? ''));
        if ($incidentType === '') {
            $incidentType = 'Emergency Alert';
        }

        $headline = '🚨 ' . $incidentType;
        if (!Str::contains(Str::lower($incidentType), 'report')) {
            $headline .= ' reported';
        }

        $locationLabel = trim((string) ($metadata['location_label'] ?? ''));
        if ($locationLabel === '') {
            $locationLine = 'Address: Unknown location';
        } else {
            $addressPrefix = Str::contains(Str::lower($locationLabel), ['street', 'road', 'ave', 'barangay', 'city', 'province'])
                ? 'Address: '
                : 'Location: ';
            $locationLine = $addressPrefix . $locationLabel;
        }

        $latlng = trim((string) ($metadata['latlng'] ?? ''));
        $coordinateLine = $latlng !== '' ? 'Coordinates: ' . $latlng : null;

        $timestampLine = null;
        $timestampCandidate = $metadata['triggered_at'] ?? null;

        if ($timestampCandidate instanceof Carbon) {
            $timestamp = $timestampCandidate->copy();
        } elseif (is_string($timestampCandidate) && $timestampCandidate !== '') {
            try {
                $timestamp = Carbon::parse($timestampCandidate);
            } catch (\Throwable $exception) {
                $timestamp = null;
            }
        } else {
            $timestamp = null;
        }

        if (!$timestamp) {
            $reportedAt = $metadata['reported_at'] ?? null;
            if ($reportedAt instanceof Carbon) {
                $timestamp = $reportedAt->copy();
            } elseif ($reportedAt) {
                try {
                    $timestamp = Carbon::parse((string) $reportedAt);
                } catch (\Throwable $exception) {
                    $timestamp = null;
                }
            }
        }

        if ($timestamp) {
            $timezone = config('app.timezone') ?: 'UTC';
            $timestampLine = 'Reported: ' . $timestamp->setTimezone($timezone)->format('M j, Y g:i A T');
        }

        $accuracyValue = $metadata['accuracy'] ?? null;
        $accuracyLine = is_numeric($accuracyValue)
            ? 'Accuracy: ±' . (int) round($accuracyValue) . 'm'
            : null;

        $mapUrl = trim((string) ($metadata['map_url'] ?? ''));
        $mapLine = $mapUrl !== '' ? 'Map: ' . $mapUrl : null;

        $rawDescription = trim((string) ($metadata['raw_description'] ?? ''));
        $notes = trim((string) ($metadata['notes'] ?? ''));
        $locationError = trim((string) ($metadata['location_error'] ?? ''));

        $detailSegments = $this->extractIncidentDetails($rawDescription);

        if ($notes !== '') {
            $detailSegments[] = 'Notes: ' . $notes;
        }

        if ($locationError !== '') {
            $detailSegments[] = 'Location error: ' . $locationError;
        }

        $detailSegments = array_values(array_unique(array_filter($detailSegments)));

        $lines = array_values(array_filter([
            $headline,
            $locationLine,
            $coordinateLine,
            $timestampLine,
            $accuracyLine,
            $mapLine,
        ]));

        if (count($detailSegments) === 1) {
            $lines[] = 'Details: ' . $detailSegments[0];
        } elseif (count($detailSegments) > 1) {
            $lines[] = 'Details:';
            foreach ($detailSegments as $detail) {
                $lines[] = '- ' . $detail;
            }
        }

        if (empty($lines)) {
            return null;
        }

        return implode("\n", $lines);
    }

    private function extractIncidentDetails(?string $rawDescription): array
    {
        if (!$rawDescription) {
            return [];
        }

        $lines = preg_split('/\r\n|\r|\n/', $rawDescription) ?: [];
        $details = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '') {
                continue;
            }

            $lower = Str::lower($trimmed);

            if (Str::startsWith($trimmed, '🚨')) {
                continue;
            }

            if (Str::startsWith($lower, [
                'time:',
                'coordinates:',
                'accuracy:',
                'map:',
                'notes:',
                'location:',
                'address:',
                'reported:',
                'details:',
            ])) {
                continue;
            }

            $details[] = $trimmed;
        }

        if (empty($details) && count($lines) === 1) {
            return [trim($lines[0])];
        }

        return $details;
    }

    private function mapCategory(?string $role): string
    {
        return match ($role) {
            'patient' => 'Patient',
            'responder' => 'Responder',
            'admin' => 'Admin',
            'logistics' => 'Logistics',
            default => 'General',
        };
    }
}
