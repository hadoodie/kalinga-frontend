<?php

namespace App\Http\Resources;

use App\Models\IncidentResponderAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        [$lat, $lng] = $this->resolveCoordinates();
        $intel = $this->resolveConversationIntel();

        return [
            'id' => $this->id,
            'type' => $this->type,
            'location' => $this->location,
            'description' => $this->description,
            'conversation_id' => $this->conversation_id,
            'status' => $this->status,
            'reported_at' => optional($this->created_at)?->toIso8601String(),
            'reported_at_human' => optional($this->created_at)?->diffForHumans(),
            'lat' => $lat,
            'lng' => $lng,
            'latitude' => $lat,
            'longitude' => $lng,
            'location_lat' => $lat,
            'location_lng' => $lng,
            'responders_required' => (int) ($this->responders_required ?? 1),
            'responders_assigned' => (int) $this->assignments
                ->where('status', '!=', IncidentResponderAssignment::STATUS_CANCELLED)
                ->count(),
            'is_fulfilled' => (bool) ($this->is_fulfilled ?? false),
            'intel_summary' => $intel['summary'] ?? null,
            'intel_updated_at' => $intel['updated_at'] ?? null,
            'intel_recent_statements' => $intel['recent_statements'] ?? [],
            'intel' => $intel,
            'latest_update' => $this->whenLoaded('latestStatusUpdate', function () {
                return new IncidentStatusUpdateResource($this->latestStatusUpdate);
            }),
            'assignments' => IncidentAssignmentResource::collection(
                $this->whenLoaded('assignments', function () {
                    return $this->assignments;
                })
            ),
            'history' => IncidentStatusUpdateResource::collection(
                $this->whenLoaded('statusUpdates', function () {
                    return $this->statusUpdates;
                })
            ),
        ];
    }

    /**
     * Resolve latitude/longitude pair from stored latlng string.
     */
    private function resolveCoordinates(): array
    {
        if (!$this->latlng) {
            return [null, null];
        }

        $parts = explode(',', $this->latlng);
        if (count($parts) !== 2) {
            return [null, null];
        }

        return [
            is_numeric($parts[0]) ? (float) $parts[0] : null,
            is_numeric($parts[1]) ? (float) $parts[1] : null,
        ];
    }

    private function resolveConversationIntel(): ?array
    {
        $metadata = $this->metadata;

        if (!is_array($metadata) || empty($metadata['conversation_insights'])) {
            return null;
        }

        $intel = $metadata['conversation_insights'];

        if (!is_array($intel)) {
            return null;
        }

        if (isset($intel['recent_statements']) && is_array($intel['recent_statements'])) {
            $intel['recent_statements'] = array_values($intel['recent_statements']);
        }

        return $intel;
    }
}
