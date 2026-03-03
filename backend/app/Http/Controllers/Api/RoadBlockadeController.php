<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoadBlockade;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RoadBlockadeController extends Controller
{
    public function index(Request $request)
    {
        $query = RoadBlockade::with(['reporter:id,name'])
            ->where('status', 'active');

        // Optional bounding box filter for map viewport
        if ($request->has(['north', 'south', 'east', 'west'])) {
            $query->whereBetween('start_lat', [$request->south, $request->north])
                  ->whereBetween('start_lng', [$request->west, $request->east]);
        }

        $blockades = $query->orderBy('reported_at', 'desc')->get();

        return response()->json($blockades->map(function($blockade) {
            return [
                'id' => $blockade->id,
                'title' => $blockade->title,
                'description' => $blockade->description,
                'start_lat' => $blockade->start_lat,
                'start_lng' => $blockade->start_lng,
                'end_lat' => $blockade->end_lat,
                'end_lng' => $blockade->end_lng,
                'road_name' => $blockade->road_name,
                'severity' => $blockade->severity,
                'status' => $blockade->status,
                'reported_by' => $blockade->reporter->name,
                'reported_at' => $blockade->reported_at->format('Y-m-d H:i:s'),
                'reported_at_human' => $blockade->reported_at->diffForHumans(),
                'coordinates' => $blockade->coordinates
            ];
        }));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_lat' => 'required|numeric|between:-90,90',
            'start_lng' => 'required|numeric|between:-180,180',
            'end_lat' => 'nullable|numeric|between:-90,90',
            'end_lng' => 'nullable|numeric|between:-180,180',
            'road_name' => 'nullable|string|max:255',
            'severity' => 'required|in:low,medium,high,critical',
            'reported_by' => 'required|exists:users,id'
        ]);

        $blockade = RoadBlockade::create([
            'title' => $request->title,
            'description' => $request->description,
            'start_lat' => $request->start_lat,
            'start_lng' => $request->start_lng,
            'end_lat' => $request->end_lat,
            'end_lng' => $request->end_lng,
            'road_name' => $request->road_name,
            'severity' => $request->severity,
            'reported_by' => $request->reported_by,
            'reported_at' => Carbon::now(),
            'status' => 'active'
        ]);

        return response()->json([
            'message' => 'Road blockade reported successfully',
            'blockade' => $blockade->load('reporter:id,name')
        ], 201);
    }

    public function show($id)
    {
        $blockade = RoadBlockade::with(['reporter:id,name'])->findOrFail($id);
        
        return response()->json([
            'id' => $blockade->id,
            'title' => $blockade->title,
            'description' => $blockade->description,
            'start_lat' => $blockade->start_lat,
            'start_lng' => $blockade->start_lng,
            'end_lat' => $blockade->end_lat,
            'end_lng' => $blockade->end_lng,
            'road_name' => $blockade->road_name,
            'severity' => $blockade->severity,
            'status' => $blockade->status,
            'reported_by' => $blockade->reporter->name,
            'reported_at' => $blockade->reported_at->format('Y-m-d H:i:s'),
            'reported_at_human' => $blockade->reported_at->diffForHumans(),
            'resolved_at' => $blockade->resolved_at ? $blockade->resolved_at->format('Y-m-d H:i:s') : null,
            'resolved_at_human' => $blockade->resolved_at ? $blockade->resolved_at->diffForHumans() : null,
            'coordinates' => $blockade->coordinates
        ]);
    }

    public function update(Request $request, $id)
    {
        $blockade = RoadBlockade::findOrFail($id);
        
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'severity' => 'sometimes|in:low,medium,high,critical',
            'status' => 'sometimes|in:active,resolved,investigating',
        ]);

        $blockade->update($request->only([
            'title', 'description', 'severity', 'status'
        ]));

        if ($request->status === 'resolved') {
            $blockade->update(['resolved_at' => Carbon::now()]);
        }

        $blockade->load('reporter:id,name');
        
        return response()->json([
            'message' => 'Road blockade updated successfully',
            'blockade' => $blockade
        ]);
    }

    public function destroy($id)
    {
        $blockade = RoadBlockade::findOrFail($id);
        $blockade->delete();

        return response()->json(['message' => 'Road blockade deleted successfully']);
    }

    // Get blockades that might affect a specific route
    public function getRouteBlockades(Request $request)
    {
        $request->validate([
            'start_lat' => 'required|numeric',
            'start_lng' => 'required|numeric',
            'end_lat' => 'required|numeric', 
            'end_lng' => 'required|numeric',
            'buffer_km' => 'sometimes|numeric|min:0.1|max:10'
        ]);

        $bufferKm = $request->get('buffer_km', 2);
        
        $blockades = RoadBlockade::getBlockadesForRoute(
            $request->start_lat,
            $request->start_lng, 
            $request->end_lat,
            $request->end_lng,
            $bufferKm
        );

        return response()->json($blockades);
    }

    /**
     * Mark a blockade as removed/resolved
     */
    public function removeBlockade(Request $request, $id)
    {
        $blockade = RoadBlockade::findOrFail($id);
        
        $blockade->status = 'resolved';
        $blockade->resolved_at = now();
        $blockade->save();

        return response()->json([
            'message' => 'Road blockade has been marked as resolved',
            'blockade' => [
                'id' => $blockade->id,
                'title' => $blockade->title,
                'status' => $blockade->status,
                'removed_by' => $request->user()->name,
                'removed_at_human' => $blockade->resolved_at->diffForHumans(),
            ],
        ]);
    }
}
