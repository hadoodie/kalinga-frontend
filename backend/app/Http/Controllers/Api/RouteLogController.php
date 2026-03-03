<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RouteLog;
use Illuminate\Http\Request;

class RouteLogController extends Controller
{
    /**
     * List route logs with optional filtering.
     * Admins can see all routes; responders see only their own.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $limit = min((int) $request->query('limit', 20), 100);
        $includeDeviations = $request->boolean('include_deviations', false);

        $query = RouteLog::query()
            ->with(['user:id,name,role'])
            ->orderByDesc('started_at');

        // Non-admin users can only see their own routes
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        // Optional filters
        if ($request->filled('user_id') && $user->role === 'admin') {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('from_date')) {
            $query->where('started_at', '>=', $request->query('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->where('started_at', '<=', $request->query('to_date'));
        }

        $routes = $query->limit($limit)->get();

        // Optionally strip deviations array to reduce payload size
        if (!$includeDeviations) {
            $routes->each(fn ($route) => $route->makeHidden('deviations'));
        }

        return response()->json([
            'data' => $routes,
            'meta' => [
                'total' => $routes->count(),
                'limit' => $limit,
            ],
        ]);
    }

    /**
     * Store a newly created route log.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'start_lat' => ['required', 'numeric', 'between:-90,90'],
            'start_lng' => ['required', 'numeric', 'between:-180,180'],
            'dest_lat' => ['required', 'numeric', 'between:-90,90'],
            'dest_lng' => ['required', 'numeric', 'between:-180,180'],
            'route_path' => ['required', 'array', 'min:2'],
            'route_path.*' => ['array', 'size:2'],
            'distance' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'started_at' => ['nullable', 'date'],
            'session_identifier' => ['nullable', 'string', 'max:255'],
        ]);

        $routeLog = RouteLog::create([
            'user_id' => $request->user()->id,
            'session_identifier' => $validated['session_identifier'] ?? null,
            'start_lat' => $validated['start_lat'],
            'start_lng' => $validated['start_lng'],
            'dest_lat' => $validated['dest_lat'],
            'dest_lng' => $validated['dest_lng'],
            'route_path' => $validated['route_path'],
            'deviations' => [],
            'metadata' => $validated['metadata'] ?? [],
            'distance' => $validated['distance'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'deviation_count' => 0,
            'started_at' => $validated['started_at'] ?? now(),
            'last_recalculated_at' => null,
        ]);

        return response()->json([
            'message' => 'Route log created successfully',
            'route_log' => $routeLog,
        ]);
    }

    /**
     * Store a deviation for an existing route log and update the latest path snapshot.
     */
    public function storeDeviation(Request $request, RouteLog $routeLog)
    {
        if ($routeLog->user_id !== $request->user()->id) {
            abort(403, 'You are not authorized to modify this route log.');
        }

        $validated = $request->validate([
            'deviation_lat' => ['required', 'numeric', 'between:-90,90'],
            'deviation_lng' => ['required', 'numeric', 'between:-180,180'],
            'route_path' => ['required', 'array', 'min:2'],
            'route_path.*' => ['array', 'size:2'],
            'distance' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $deviations = $routeLog->deviations ?? [];
        $deviations[] = [
            'occurred_at' => now()->toIso8601String(),
            'location' => [
                'lat' => $validated['deviation_lat'],
                'lng' => $validated['deviation_lng'],
            ],
            'route_path' => $validated['route_path'],
            'distance' => $validated['distance'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'metadata' => $validated['metadata'] ?? [],
        ];

        $routeLog->update([
            'route_path' => $validated['route_path'],
            'distance' => $validated['distance'] ?? $routeLog->distance,
            'duration' => $validated['duration'] ?? $routeLog->duration,
            'deviation_count' => ($routeLog->deviation_count ?? 0) + 1,
            'deviations' => $deviations,
            'last_recalculated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Route deviation recorded successfully',
            'route_log' => $routeLog->fresh(),
        ]);
    }
}
