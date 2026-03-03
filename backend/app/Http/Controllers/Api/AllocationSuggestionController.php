<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request;
use App\Models\Hospital;
use Illuminate\Http\Request as HttpRequest; 

class AllocationSuggestionController extends Controller
{
    public function index($requestId, HttpRequest $request) 
    {
        $requestModel = Request::with('hospital')->findOrFail($requestId);

        $suggestions = Hospital::where('id', '!=', $requestModel->hospital_id)
            ->whereHas('resources', function ($q) use ($requestModel) {
                $q->where('resource_name', $requestModel->resource_name)
                  ->where('quantity', '>=', $requestModel->quantity);
            })
            ->selectRaw('
                hospitals.*,
                ST_Distance(
                    geography(location),
                    geography((SELECT location FROM hospitals WHERE id = ?))
                ) as distance_meters
            ', [$requestModel->hospital_id])
            ->orderBy('distance_meters')
            ->limit(10)
            ->get()
            ->map(function ($hospital) use ($requestModel) {
                $km = round($hospital->distance_meters / 1000, 1);
                return [
                    'hospital_id' => $hospital->id,
                    'hospital_name' => $hospital->name,
                    'distance_km' => $km,
                    'eta_minutes' => (int) max(15, $km * 2.2), 
                    'available_quantity' => 999, 
                    'can_fulfill' => true,
                ];
            });

        return response()->json($suggestions);
    }
}