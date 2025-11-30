<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class ResponderLocationUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets;
    use SerializesModels;

    public int $incidentId;
    public int $responderId;
    public string $responderName;
    public float $latitude;
    public float $longitude;
    public ?float $heading;
    public ?float $speed;
    public ?float $accuracy;
    public ?float $eta;
    public ?float $distanceRemaining;
    public string $status;

    public function __construct(
        int $incidentId,
        int $responderId,
        string $responderName,
        float $latitude,
        float $longitude,
        ?float $heading = null,
        ?float $speed = null,
        ?float $accuracy = null,
        ?float $eta = null,
        ?float $distanceRemaining = null,
        string $status = 'en_route'
    ) {
        $this->incidentId = $incidentId;
        $this->responderId = $responderId;
        $this->responderName = $responderName;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->heading = $heading;
        $this->speed = $speed;
        $this->accuracy = $accuracy;
        $this->eta = $eta;
        $this->distanceRemaining = $distanceRemaining;
        $this->status = $status;
    }

    public function broadcastOn(): array
    {
        // Broadcast to the incident-specific private channel so patient can listen
        return [
            new PrivateChannel('incident.' . $this->incidentId . '.tracking'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ResponderLocationUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'incident_id' => $this->incidentId,
            'responder' => [
                'id' => $this->responderId,
                'name' => $this->responderName,
                'location' => [
                    'latitude' => $this->latitude,
                    'longitude' => $this->longitude,
                    'heading' => $this->heading,
                    'speed' => $this->speed,
                    'accuracy' => $this->accuracy,
                ],
                'eta_minutes' => $this->eta,
                'distance_remaining_km' => $this->distanceRemaining,
                'status' => $this->status,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
