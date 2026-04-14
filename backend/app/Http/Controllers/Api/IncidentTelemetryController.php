<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentWebsocketMetric;
use Illuminate\Http\Request;

class IncidentTelemetryController extends Controller
{
    /**
     * Persist client-side websocket receipt telemetry for an incident event.
     */
    public function storeSocketReceipt(Request $request, Incident $incident)
    {
        $validated = $request->validate([
            'event_name' => ['nullable', 'string', 'max:120'],
            'client_received_at_ms' => ['required', 'integer', 'min:1'],
            'incident_reported_at_ms' => ['nullable', 'integer', 'min:1'],
            'metadata' => ['nullable', 'array'],
        ]);

        $serverReportedAtMs = $incident->created_at ? $incident->created_at->valueOf() : null;
        $clientReceivedAtMs = (int) $validated['client_received_at_ms'];
        $propagationDelayMs = null;

        if ($serverReportedAtMs !== null) {
            $propagationDelayMs = max(0, $clientReceivedAtMs - $serverReportedAtMs);
        }

        $metric = IncidentWebsocketMetric::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()?->id,
            'event_name' => $validated['event_name'] ?? 'IncidentUpdated',
            'client_received_at_ms' => $clientReceivedAtMs,
            'incident_reported_at_ms' => $serverReportedAtMs,
            'propagation_delay_ms' => $propagationDelayMs,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json([
            'message' => 'Telemetry recorded',
            'data' => [
                'id' => $metric->id,
                'incident_id' => $metric->incident_id,
                'event_name' => $metric->event_name,
                'propagation_delay_ms' => $metric->propagation_delay_ms,
            ],
        ], 201);
    }
}
