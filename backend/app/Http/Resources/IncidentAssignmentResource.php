<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentAssignmentResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'assigned_at' => optional($this->assigned_at)?->toIso8601String(),
            'acknowledged_at' => optional($this->acknowledged_at)?->toIso8601String(),
            'completed_at' => optional($this->completed_at)?->toIso8601String(),
            'notes' => $this->notes,
            'responder' => $this->whenLoaded('responder', function () {
                return [
                    'id' => $this->responder->id,
                    'name' => $this->responder->name,
                    'email' => $this->responder->email,
                    'role' => $this->responder->role,
                    'phone' => $this->responder->phone,
                ];
            }),
        ];
    }
}
