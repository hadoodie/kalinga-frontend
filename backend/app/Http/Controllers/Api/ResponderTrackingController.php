<?php

namespace App\Http\Controllers\Api;

use App\Events\ResponderLocationUpdated;
use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentResponderAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ResponderTrackingController extends Controller
{
    /**
     * Update responder location during active incident response.
     * Broadcasts location to patient and caches for retrieval.
     */
    public function updateLocation(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'heading' => ['nullable', 'numeric', 'between:0,360'],
            'speed' => ['nullable', 'numeric', 'min:0'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'eta_minutes' => ['nullable', 'numeric', 'min:0'],
            'distance_remaining_km' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        // Verify the user is assigned to this incident
        $assignment = $incident->assignments()
            ->where('responder_id', $user->id)
            ->whereNotIn('status', [
                IncidentResponderAssignment::STATUS_COMPLETED,
                IncidentResponderAssignment::STATUS_CANCELLED,
            ])
            ->first();

        if (!$assignment && !in_array($user->role, ['admin'])) {
            return response()->json([
                'message' => 'You are not assigned to this incident.',
            ], 403);
        }

        // Cache location data for retrieval (5 minute TTL with sliding expiration)
        $cacheKey = "responder_location:{$incident->id}:{$user->id}";
        $locationData = [
            'responder_id' => $user->id,
            'responder_name' => $user->name,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'heading' => $validated['heading'] ?? null,
            'speed' => $validated['speed'] ?? null,
            'accuracy' => $validated['accuracy'] ?? null,
            'eta_minutes' => $validated['eta_minutes'] ?? null,
            'distance_remaining_km' => $validated['distance_remaining_km'] ?? null,
            'status' => $incident->status,
            'updated_at' => now()->toIso8601String(),
        ];

        Cache::put($cacheKey, $locationData, now()->addMinutes(5));

        // Also cache for the incident overall (for patient to fetch any responder)
        Cache::put("incident_responder_location:{$incident->id}", $locationData, now()->addMinutes(5));

        // Broadcast the location update
        broadcast(new ResponderLocationUpdated(
            $incident->id,
            $user->id,
            $user->name,
            $validated['latitude'],
            $validated['longitude'],
            $validated['heading'] ?? null,
            $validated['speed'] ?? null,
            $validated['accuracy'] ?? null,
            $validated['eta_minutes'] ?? null,
            $validated['distance_remaining_km'] ?? null,
            $incident->status
        ))->toOthers();

        return response()->json([
            'message' => 'Location updated successfully.',
            'data' => $locationData,
        ]);
    }

    /**
     * Get the current responder location for an incident (for patient).
     * This endpoint allows patients to poll for location if WebSocket fails.
     */
    public function getResponderLocation(Request $request, Incident $incident)
    {
        $user = $request->user();

        // Verify patient is the reporter or incident owner
        $isOwner = $incident->user_id === $user->id;
        $isAdmin = in_array($user->role, ['admin']);

        if (!$isOwner && !$isAdmin) {
            return response()->json([
                'message' => 'You do not have access to this incident tracking.',
            ], 403);
        }

        // Get cached location
        $locationData = Cache::get("incident_responder_location:{$incident->id}");

        if (!$locationData) {
            return response()->json([
                'message' => 'No active responder location available.',
                'data' => null,
            ], 404);
        }

        // Load incident with assignments for context
        $incident->loadMissing([
            'assignments.responder:id,name,email,role,phone,profile_image',
        ]);

        // Get active assignment
        $activeAssignment = $incident->assignments
            ->whereNotIn('status', [
                IncidentResponderAssignment::STATUS_COMPLETED,
                IncidentResponderAssignment::STATUS_CANCELLED,
            ])
            ->first();

        return response()->json([
            'data' => [
                'location' => $locationData,
                'incident' => [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'status' => $incident->status,
                    'location' => $incident->location,
                    'latlng' => $incident->latlng,
                ],
                'responder' => $activeAssignment ? [
                    'id' => $activeAssignment->responder->id,
                    'name' => $activeAssignment->responder->name,
                    'phone' => $activeAssignment->responder->phone,
                    'profile_image' => $activeAssignment->responder->profile_image,
                ] : null,
            ],
        ]);
    }

    /**
     * Get active tracking status for patient's incidents
     */
    public function getMyActiveRescue(Request $request)
    {
        $user = $request->user();

        // Find active incidents reported by this patient
        $activeStatuses = [
            Incident::STATUS_ACKNOWLEDGED,
            Incident::STATUS_EN_ROUTE,
            Incident::STATUS_ON_SCENE,
            Incident::STATUS_NEEDS_SUPPORT,
            Incident::STATUS_TRANSPORTING,
            Incident::STATUS_HOSPITAL_TRANSFER,
        ];

        $activeIncident = Incident::where('user_id', $user->id)
            ->whereIn('status', $activeStatuses)
            ->with([
                'assignments' => function ($query) {
                    $query->whereNotIn('status', [
                        IncidentResponderAssignment::STATUS_COMPLETED,
                        IncidentResponderAssignment::STATUS_CANCELLED,
                    ])->with('responder:id,name,phone,profile_image,role');
                },
            ])
            ->orderByDesc('created_at')
            ->first();

        if (!$activeIncident) {
            return response()->json([
                'has_active_rescue' => false,
                'data' => null,
            ]);
        }

        // Get cached location for this incident
        $locationData = Cache::get("incident_responder_location:{$activeIncident->id}");

        // Parse incident coordinates
        $incidentCoords = null;
        if ($activeIncident->latlng) {
            $parts = explode(',', $activeIncident->latlng);
            if (count($parts) === 2) {
                $incidentCoords = [
                    'latitude' => (float) trim($parts[0]),
                    'longitude' => (float) trim($parts[1]),
                ];
            }
        }

        $activeAssignment = $activeIncident->assignments->first();

        return response()->json([
            'has_active_rescue' => true,
            'data' => [
                'incident' => [
                    'id' => $activeIncident->id,
                    'type' => $activeIncident->type,
                    'status' => $activeIncident->status,
                    'location' => $activeIncident->location,
                    'coordinates' => $incidentCoords,
                    'created_at' => $activeIncident->created_at?->toIso8601String(),
                ],
                'responder' => $activeAssignment ? [
                    'id' => $activeAssignment->responder->id,
                    'name' => $activeAssignment->responder->name,
                    'phone' => $activeAssignment->responder->phone,
                    'profile_image' => $activeAssignment->responder->profile_image,
                ] : null,
                'responder_location' => $locationData,
            ],
        ]);
    }
}
