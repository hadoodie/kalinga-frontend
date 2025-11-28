<?php

namespace App\Http\Controllers\Api;

use App\Events\IncidentUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\IncidentAssignmentResource;
use App\Http\Resources\IncidentResource;
use App\Http\Resources\IncidentStatusUpdateResource;
use App\Models\Conversation;
use App\Models\Hospital;
use App\Models\Incident;
use App\Models\IncidentResponderAssignment;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Collection;

class IncidentApiController extends Controller
{
    public function index(Request $request)
    {
        $statuses = $this->normalizeStatuses($request->query('status'));

        $query = Incident::query()
            ->with([
                'assignments.responder:id,name,email,role,phone',
                'statusUpdates' => function ($builder) {
                    $builder->with('user:id,name,role')->latest()->limit(25);
                },
                'latestStatusUpdate.user:id,name,role',
            ])
            ->orderByDesc('created_at');

        if (!empty($statuses)) {
            $query->whereIn('status', $statuses);
        } elseif (!$request->boolean('include_cancelled', false)) {
            $query->where('status', '!=', Incident::STATUS_CANCELLED);
        }

        if (!$request->boolean('include_resolved', true)) {
            $query->where('status', '!=', Incident::STATUS_RESOLVED);
        }

        $perPage = (int) $request->query('per_page', 0);

        if ($perPage > 0) {
            $paginated = $query->paginate($perPage);
            return IncidentResource::collection($paginated)
                ->additional([
                    'meta' => [
                        'pagination' => [
                            'total' => $paginated->total(),
                            'per_page' => $paginated->perPage(),
                            'current_page' => $paginated->currentPage(),
                            'last_page' => $paginated->lastPage(),
                        ],
                    ],
                ]);
        }

        $incidents = $query->get();

        return IncidentResource::collection($incidents);
    }

    public function show(Request $request, Incident $incident)
    {
        $incident->load([
            'assignments.responder:id,name,email,role,phone',
            'statusUpdates' => function ($builder) {
                $builder->with('user:id,name,role')->latest()->limit(50);
            },
            'latestStatusUpdate.user:id,name,role',
            'user:id,name,role,profile_image,phone',
        ]);

        return new IncidentResource($incident);
    }

    public function conversation(Request $request, Incident $incident)
    {
        $responder = $request->user();

        if (!$responder instanceof User) {
            abort(403, 'Unauthorized');
        }

        if (!$this->userCanAccessIncident($responder, $incident)) {
            abort(403, 'You are not assigned to this incident.');
        }

        $incident->loadMissing(['user:id,name,role,profile_image,phone']);
        $patient = $incident->user;

        if (!$patient) {
            return response()->json([
                'conversation' => null,
                'message' => 'Incident is not linked to a reporting user yet.',
            ], 404);
        }

        $conversation = $incident->conversation_id
            ? Conversation::find($incident->conversation_id)
            : $this->firstOrCreateConversation($patient->id, $responder->id);

        if (!$incident->conversation_id && $conversation) {
            $incident->conversation_id = $conversation->id;
            $incident->save();
        }

        $messages = $this->fetchConversationMessages(
            $patient->id,
            $responder->id,
            $conversation?->id
        );

        $payload = $this->formatConversationPayload(
            $conversation,
            $patient,
            $responder,
            $incident,
            $messages
        );

        return response()->json([
            'conversation' => $payload,
        ]);
    }

    public function hospitalRecommendations(Request $request, Incident $incident)
    {
        [$incidentLat, $incidentLng] = $this->extractCoordinates($incident->latlng);

        if ($incidentLat === null || $incidentLng === null) {
            $metadata = is_array($incident->metadata) ? $incident->metadata : [];
            $metadataLat = $this->resolveCoordinateFromMetadata($metadata['lat'] ?? $metadata['latitude'] ?? null);
            $metadataLng = $this->resolveCoordinateFromMetadata($metadata['lng'] ?? $metadata['lon'] ?? $metadata['longitude'] ?? null);

            if ($metadataLat !== null && $metadataLng !== null) {
                $incidentLat = $metadataLat;
                $incidentLng = $metadataLng;
            }
        }

        $hospitals = Hospital::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        if ($hospitals->isEmpty()) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'incident_has_coordinates' => $incidentLat !== null && $incidentLng !== null,
                    'reason' => 'no_hospitals_configured',
                ],
            ]);
        }

        $limit = max(1, (int) $request->query('limit', 5));

        $recommendations = $hospitals
            ->map(function (Hospital $hospital) use ($incidentLat, $incidentLng) {
                $lat = $hospital->latitude !== null ? (float) $hospital->latitude : null;
                $lng = $hospital->longitude !== null ? (float) $hospital->longitude : null;

                $distance = null;
                if ($incidentLat !== null && $incidentLng !== null && $lat !== null && $lng !== null) {
                    $distance = $this->calculateDistance($incidentLat, $incidentLng, $lat, $lng);
                }

                return [
                    'id' => $hospital->id,
                    'name' => $hospital->name,
                    'address' => $hospital->address,
                    'contact_number' => $hospital->contact_number ?? $hospital->contact,
                    'type' => $hospital->type,
                    'capabilities' => $this->inferHospitalCapabilities($hospital),
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'distance_km' => $distance,
                    'capacity' => $hospital->capacity,
                    'emergency_services' => (bool) $hospital->emergency_services,
                ];
            })
            ->sortBy(function (array $payload) {
                return $payload['distance_km'] ?? PHP_INT_MAX;
            })
            ->values()
            ->take($limit)
            ->values();

        return response()->json([
            'data' => $recommendations,
            'meta' => [
                'incident_has_coordinates' => $incidentLat !== null && $incidentLng !== null,
            ],
        ]);
    }

    public function assign(Request $request, Incident $incident)
    {
        $request->validate([
            'responder_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $responderId = (int) ($request->input('responder_id') ?? $request->user()->id);

        $activeAssignmentCount = $incident->assignments()
            ->whereNotIn('status', [
                IncidentResponderAssignment::STATUS_COMPLETED,
                IncidentResponderAssignment::STATUS_CANCELLED,
            ])->count();

        $existingAssignment = $incident->assignments()
            ->where('responder_id', $responderId)
            ->first();

        if (!$existingAssignment
            && $incident->responders_required > 0
            && $activeAssignmentCount >= $incident->responders_required
        ) {
            return response()->json([
                'message' => 'Incident already has the required number of responders.',
            ], 409);
        }

        $assignment = DB::transaction(function () use ($incident, $responderId, $request, $existingAssignment) {
            $assignment = $incident->assignToResponder($responderId);

            if (!$existingAssignment && $incident->status === Incident::STATUS_REPORTED) {
                $incident->statusUpdates()->create([
                    'user_id' => $request->user()->id,
                    'status' => Incident::STATUS_ACKNOWLEDGED,
                    'notes' => $request->input('notes'),
                ]);
            }

            return $assignment;
        });

        $incident->load([
            'assignments.responder:id,name,email,role,phone',
            'statusUpdates.user:id,name,role',
            'latestStatusUpdate.user:id,name,role',
        ]);

        broadcast(new IncidentUpdated($incident))->toOthers();

        return (new IncidentResource($incident))
            ->additional([
                'assignment' => new IncidentAssignmentResource($assignment),
            ]);
    }

    public function updateStatus(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(Incident::allowedStatuses())],
            'notes' => ['nullable', 'string', 'max:500'],
            'responders_required' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $assignment = $incident->assignments()
            ->where('responder_id', $request->user()->id)
            ->first();

        DB::transaction(function () use ($incident, $validated, $assignment, $request) {
            $incident->fill([
                'status' => $validated['status'],
            ]);

            if (isset($validated['responders_required'])) {
                $incident->responders_required = (int) $validated['responders_required'];
            }

            if (in_array($validated['status'], [Incident::STATUS_RESOLVED, Incident::STATUS_CANCELLED], true)) {
                $incident->completed_at = now();
            } else {
                $incident->completed_at = null;
            }

            $incident->save();

            if ($assignment) {
                $assignment->status = $this->mapIncidentStatusToAssignment($validated['status']);

                if ($assignment->status === IncidentResponderAssignment::STATUS_COMPLETED) {
                    $assignment->completed_at = now();
                }

                $assignment->save();
            }

            $incident->statusUpdates()->create([
                'user_id' => $request->user()->id,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $incident->load([
            'assignments.responder:id,name,email,role,phone',
            'statusUpdates.user:id,name,role',
            'latestStatusUpdate.user:id,name,role',
        ]);

        $this->syncConversationArchiveState($incident);

        broadcast(new IncidentUpdated($incident))->toOthers();

        return new IncidentResource($incident);
    }

    public function history(Incident $incident)
    {
        $incident->load(['statusUpdates.user:id,name,role']);

        return IncidentStatusUpdateResource::collection($incident->statusUpdates);
    }

    public function assignNearest(Request $request)
    {
        $validated = $request->validate([
            'responder_lat' => ['required', 'numeric'],
            'responder_lng' => ['required', 'numeric'],
            'responder_id' => ['required', 'exists:users,id'],
        ]);

        $responderLat = $validated['responder_lat'];
        $responderLng = $validated['responder_lng'];
        $responderId = $validated['responder_id'];

        $openStatuses = [
            Incident::STATUS_REPORTED,
            Incident::STATUS_ACKNOWLEDGED,
            Incident::STATUS_EN_ROUTE,
            Incident::STATUS_ON_SCENE,
        ];

        $incidents = Incident::whereIn('status', $openStatuses)
            ->whereNotNull('latlng')
            ->with(['assignments'])
            ->get()
            ->filter(function (Incident $incident) use ($responderId) {
                $activeAssignments = $incident->assignments->whereNotIn('status', [
                    IncidentResponderAssignment::STATUS_COMPLETED,
                    IncidentResponderAssignment::STATUS_CANCELLED,
                ]);

                if ($activeAssignments->contains('responder_id', $responderId)) {
                    return true;
                }

                if ($incident->responders_required === 0) {
                    return true;
                }

                return $activeAssignments->count() < $incident->responders_required;
            });

        if ($incidents->isEmpty()) {
            return response()->json(['message' => 'No available incidents'], 404);
        }

        $nearestIncident = null;
        $minDistance = null;

        foreach ($incidents as $incident) {
            [$incidentLat, $incidentLng] = $this->extractCoordinates($incident->latlng);
            if ($incidentLat === null || $incidentLng === null) {
                continue;
            }

            $distance = $this->calculateDistance($responderLat, $responderLng, $incidentLat, $incidentLng);

            if ($minDistance === null || $distance < $minDistance) {
                $minDistance = $distance;
                $nearestIncident = $incident;
            }
        }

        if (!$nearestIncident) {
            return response()->json(['message' => 'No suitable incident found'], 404);
        }

        $assignment = DB::transaction(function () use ($nearestIncident, $responderId) {
            $assignment = $nearestIncident->assignToResponder($responderId);

            if ($nearestIncident->status === Incident::STATUS_REPORTED) {
                $nearestIncident->statusUpdates()->create([
                    'user_id' => null,
                    'status' => Incident::STATUS_ACKNOWLEDGED,
                    'notes' => 'Dispatcher auto assignment',
                ]);
            }

            return $assignment;
        });

        $nearestIncident->load([
            'assignments.responder:id,name,email,role,phone',
            'statusUpdates.user:id,name,role',
            'latestStatusUpdate.user:id,name,role',
        ]);

        broadcast(new IncidentUpdated($nearestIncident))->toOthers();

        [$lat, $lng] = $this->extractCoordinates($nearestIncident->latlng);

        return response()->json([
            'incident' => (new IncidentResource($nearestIncident))->resolve(),
            'distance' => $minDistance,
            'assignment' => new IncidentAssignmentResource($assignment),
            'coordinates' => ['lat' => $lat, 'lng' => $lng],
        ]);
    }

    private function syncConversationArchiveState(Incident $incident): void
    {
        if (!$incident->conversation_id) {
            return;
        }

        $shouldArchive = in_array($incident->status, [
            Incident::STATUS_RESOLVED,
            Incident::STATUS_CANCELLED,
        ], true);

        Conversation::whereKey($incident->conversation_id)->update([
            'is_archived' => $shouldArchive,
            'archived_at' => $shouldArchive ? now() : null,
        ]);
    }

    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function extractCoordinates(?string $latlng): array
    {
        if (!$latlng) {
            return [null, null];
        }

        $parts = explode(',', $latlng);
        if (count($parts) !== 2) {
            return [null, null];
        }

        $lat = is_numeric($parts[0]) ? (float) $parts[0] : null;
        $lng = is_numeric($parts[1]) ? (float) $parts[1] : null;

        return [$lat, $lng];
    }

    private function resolveCoordinateFromMetadata($value): ?float
    {
        if ($value === null) {
            return null;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            return is_numeric($trimmed) ? (float) $trimmed : null;
        }

        return null;
    }

    private function firstOrCreateConversation(int $userA, int $userB): ?Conversation
    {
        if ($userA === $userB) {
            return null;
        }

        $pair = [$userA, $userB];
        sort($pair);

        $conversation = Conversation::query()
            ->where('user_id1', $pair[0])
            ->where('user_id2', $pair[1])
            ->where('is_archived', false)
            ->first();

        if ($conversation) {
            return $conversation;
        }

        return Conversation::create([
            'user_id1' => $pair[0],
            'user_id2' => $pair[1],
            'is_archived' => false,
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function fetchConversationMessages(int $userA, int $userB, ?int $conversationId = null, int $limit = 200): Collection
    {
        $query = Message::query()
            ->with([
                'sender:id,name,role,profile_image',
                'receiver:id,name,role,profile_image',
            ])
            ->whereNull('group_id')
            ->orderByDesc('created_at');

        $query->where(function ($builder) use ($userA, $userB, $conversationId) {
            if ($conversationId) {
                $builder->where('conversation_id', $conversationId);
            }

            $builder->orWhere(function ($inner) use ($userA, $userB) {
                $inner->where(function ($q) use ($userA, $userB) {
                    $q->where('sender_id', $userA)->where('receiver_id', $userB);
                })->orWhere(function ($q) use ($userA, $userB) {
                    $q->where('sender_id', $userB)->where('receiver_id', $userA);
                });
            });
        });

        return $query
            ->limit($limit)
            ->get()
            ->sortBy('created_at')
            ->values()
            ->map(function (Message $message) {
                $timestamp = optional($message->created_at)?->toIso8601String();

                return [
                    'id' => $message->id,
                    'text' => $message->message,
                    'body' => $message->message,
                    'senderId' => $message->sender_id,
                    'receiverId' => $message->receiver_id,
                    'sender' => $message->sender?->name,
                    'sender_name' => $message->sender?->name,
                    'timestamp' => $timestamp,
                    'createdAt' => $timestamp,
                ];
            });
    }

    private function formatConversationPayload(
        ?Conversation $conversation,
        User $patient,
        User $responder,
        Incident $incident,
        Collection $messages
    ): array {
        $participantPayload = [
            'id' => $patient->id,
            'name' => $patient->name,
            'role' => $patient->role,
            'avatar' => $patient->profile_image,
            'profile_image' => $patient->profile_image,
            'phone' => $patient->phone,
        ];

        $responderPayload = [
            'id' => $responder->id,
            'name' => $responder->name,
            'role' => $responder->role,
            'avatar' => $responder->profile_image,
            'profile_image' => $responder->profile_image,
            'phone' => $responder->phone,
        ];

        $title = $incident->type ?? 'Incident #' . $incident->id;

        return [
            'id' => $conversation?->id ?? ('user-' . $participantPayload['id']),
            'conversationId' => $conversation?->id,
            'incidentId' => $incident->id,
            'title' => $title,
            'reference' => 'Incident #' . $incident->id,
            'participant' => $participantPayload,
            'participants' => [$participantPayload, $responderPayload],
            'messages' => $messages->values()->all(),
            'lastMessage' => $messages->last()['text'] ?? null,
            'lastMessageTime' => $messages->last()['timestamp'] ?? null,
            'isArchived' => (bool) ($conversation?->is_archived ?? false),
        ];
    }

    private function userCanAccessIncident(User $user, Incident $incident): bool
    {
        if (in_array($user->role, ['admin'], true)) {
            return true;
        }

        return $incident->assignments()
            ->where('responder_id', $user->id)
            ->exists();
    }

    private function inferHospitalCapabilities(Hospital $hospital): array
    {
        $capabilities = [];

        if ($hospital->type) {
            $capabilities[] = ucfirst($hospital->type);
        }

        if ($hospital->emergency_services) {
            $capabilities[] = '24/7 Emergency';
        }

        if ($hospital->capacity) {
            $capabilities[] = $hospital->capacity . ' beds';
        }

        return $capabilities;
    }

    private function normalizeStatuses($statuses): array
    {
        if (!$statuses) {
            return [];
        }

        if (is_string($statuses)) {
            $statuses = array_filter(array_map('trim', explode(',', $statuses)));
        }

        if (!is_array($statuses)) {
            return [];
        }

        $allowed = Incident::allowedStatuses();

        return array_values(array_intersect($allowed, $statuses));
    }

    private function mapIncidentStatusToAssignment(string $status): string
    {
        return match ($status) {
            Incident::STATUS_EN_ROUTE => IncidentResponderAssignment::STATUS_EN_ROUTE,
            Incident::STATUS_ON_SCENE, Incident::STATUS_NEEDS_SUPPORT => IncidentResponderAssignment::STATUS_ON_SCENE,
            Incident::STATUS_RESOLVED => IncidentResponderAssignment::STATUS_COMPLETED,
            Incident::STATUS_CANCELLED => IncidentResponderAssignment::STATUS_CANCELLED,
            default => IncidentResponderAssignment::STATUS_ASSIGNED,
        };
    }
}
