<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ForecastGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $demandCount;
    public int $riskCount;
    public int $highRiskCount;
    public ?string $modelVersion;
    public string $generatedAt;

    public function __construct(
        int $demandCount,
        int $riskCount,
        int $highRiskCount,
        ?string $modelVersion = null,
    ) {
        $this->demandCount   = $demandCount;
        $this->riskCount     = $riskCount;
        $this->highRiskCount = $highRiskCount;
        $this->modelVersion  = $modelVersion;
        $this->generatedAt   = now()->toIso8601String();
    }

    /**
     * Broadcast on the logistics channel so the dashboard can react in real-time.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('logistics'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'forecast.generated';
    }
}
