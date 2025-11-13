<?php

namespace App\Http\Controllers\Api;

use App\Events\IncidentUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\IncidentAssignmentResource;
use App\Http\Resources\IncidentResource;
use App\Http\Resources\IncidentStatusUpdateResource;
use App\Models\Incident;
use App\Models\IncidentResponderAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
