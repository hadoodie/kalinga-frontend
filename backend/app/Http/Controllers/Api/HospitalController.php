<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Services\HospitalCapabilityService;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    public function __construct(private HospitalCapabilityService $hospitalCapabilityService)
    {
    }

    /**
     * Display a listing of hospitals
     */
    public function index(Request $request)
    {
        $originLat = $this->resolveCoordinate($request->query('lat'));
        $originLng = $this->resolveCoordinate($request->query('lng'));

        $hospitals = Hospital::query()
            ->with(['resources' => function ($query) {
                $query->select('id', 'hospital_id', 'name', 'category', 'quantity', 'is_critical');
            }])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        $payload = $hospitals
            ->map(function (Hospital $hospital) use ($originLat, $originLng) {
                $lat = $hospital->latitude !== null ? (float) $hospital->latitude : null;
                $lng = $hospital->longitude !== null ? (float) $hospital->longitude : null;

                $distance = null;
                if ($originLat !== null && $originLng !== null && $lat !== null && $lng !== null) {
                    $distance = $this->calculateDistance($originLat, $originLng, $lat, $lng);
                }

                $resourceProfile = $this->hospitalCapabilityService->buildResourceProfile($hospital);
                $distanceScore = $this->hospitalCapabilityService->distanceScore($distance);
                $priorityScore = $this->hospitalCapabilityService->priorityScore($resourceProfile['score'], $distanceScore);

                return [
                    'id' => $hospital->id,
                    'name' => $hospital->name,
                    'address' => $hospital->address,
                    'contact_number' => $hospital->contact_number ?? $hospital->contact,
                    'type' => $hospital->type,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'distance_km' => $distance,
                    'capacity' => $hospital->capacity,
                    'emergency_services' => (bool) $hospital->emergency_services,
                    'capability_score' => $resourceProfile['score'],
                    'distance_score' => $distanceScore,
                    'priority_score' => $priorityScore,
                    'resource_profile' => $resourceProfile,
                ];
            })
            ->sortByDesc('priority_score')
            ->values();

        return response()->json($payload);
    }

    /**
     * Store a newly created hospital
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'email' => 'nullable|email',
            'capacity' => 'nullable|integer',
            'type' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $hospital = Hospital::create($validated);
        return response()->json(['message' => 'Hospital created', 'hospital' => $hospital], 201);
    }

    /**
     * Display the specified hospital
     */
    public function show(Hospital $hospital)
    {
        return response()->json($hospital);
    }

    /**
     * Update the specified hospital
     */
    public function update(Request $request, Hospital $hospital)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'email' => 'nullable|email',
            'capacity' => 'nullable|integer',
            'type' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);
        $hospital->update($validated);
        return response()->json(['message' => 'Hospital updated', 'hospital' => $hospital]);
    }

    /**
     * Remove the specified hospital
     */
    public function destroy(Hospital $hospital)
    {
        $hospital->delete();
        return response()->json(['message' => 'Hospital deleted']);
    }

    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function resolveCoordinate($value): ?float
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
}
