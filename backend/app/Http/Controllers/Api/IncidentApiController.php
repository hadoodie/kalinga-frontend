<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;

class IncidentApiController extends Controller
{
    public function index()
    {
        // Only return available incidents with valid coordinates
        $incidents = Incident::where('status', 'available')
            ->whereNotNull('latlng')
            ->get()
            ->map(function($incident) {
                $coords = explode(',', $incident->latlng);
                return [
                    'id' => $incident->id,
                    'type' => $incident->type,
                    'location' => $incident->location,
                    'description' => $incident->description,
                    'status' => $incident->status,
                    'lat' => isset($coords[0]) ? floatval($coords[0]) : null,
                    'lng' => isset($coords[1]) ? floatval($coords[1]) : null,
                ];
            });
        return response()->json($incidents);
    }

    public function assignNearest(Request $request)
    {
        $request->validate([
            'responder_lat' => 'required|numeric',
            'responder_lng' => 'required|numeric',
            'responder_id' => 'required|exists:users,id'
        ]);

        $responderLat = $request->responder_lat;
        $responderLng = $request->responder_lng;
        $responderId = $request->responder_id;

        // Get all available incidents
        $availableIncidents = Incident::where('status', 'available')
            ->whereNotNull('latlng')
            ->get();

        if ($availableIncidents->isEmpty()) {
            return response()->json(['message' => 'No available incidents'], 404);
        }

        // Calculate distances and find nearest
        $nearestIncident = null;
        $minDistance = null;

        foreach ($availableIncidents as $incident) {
            $coords = explode(',', $incident->latlng);
            if (count($coords) >= 2) {
                $incidentLat = floatval($coords[0]);
                $incidentLng = floatval($coords[1]);
                
                // Calculate distance using Haversine formula
                $distance = $this->calculateDistance($responderLat, $responderLng, $incidentLat, $incidentLng);
                
                if ($minDistance === null || $distance < $minDistance) {
                    $minDistance = $distance;
                    $nearestIncident = $incident;
                }
            }
        }

        if ($nearestIncident) {
            $nearestIncident->assignToResponder($responderId);
            
            $coords = explode(',', $nearestIncident->latlng);
            return response()->json([
                'incident' => [
                    'id' => $nearestIncident->id,
                    'type' => $nearestIncident->type,
                    'location' => $nearestIncident->location,
                    'description' => $nearestIncident->description,
                    'status' => $nearestIncident->status,
                    'lat' => floatval($coords[0]),
                    'lng' => floatval($coords[1]),
                ],
                'distance' => $minDistance
            ]);
        }

        return response()->json(['message' => 'No suitable incident found'], 404);
    }

    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng/2) * sin($dLng/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
}
