<?php

namespace App\Events;

use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class IncidentUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public Incident $incident)
    {
        $this->incident->loadMissing([
            'assignments.responder:id,name,email,role,phone',
            'statusUpdates' => function ($builder) {
                $builder->with('user:id,name,role')->latest()->limit(25);
            },
            'latestStatusUpdate.user:id,name,role',
        ]);
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('incidents')];
    }

    public function broadcastAs(): string
    {
        return 'IncidentUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'incident' => (new IncidentResource($this->incident))->resolve(),
        ];
    }
}
