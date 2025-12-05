<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\LabResultController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\IncidentApiController;
use App\Http\Controllers\Api\GeminiController;
use App\Http\Controllers\Api\RoadBlockadeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\AllocationController;
use App\Http\Controllers\Api\RouteLogController;
use App\Http\Controllers\Api\ResponderTrackingController;
use App\Http\Controllers\Api\NLPController;
use App\Http\Controllers\HospitalSafetyIndexController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Broadcasting authentication route
Route::post('/broadcasting/auth', function (Request $request) {
    try {
        $response = Broadcast::auth($request);

        if ($response instanceof \Symfony\Component\HttpFoundation\Response) {
            \Log::debug('Broadcast auth response (response object)', [
                'user_id' => optional($request->user())->id,
                'channel_name' => $request->input('channel_name'),
                'status' => $response->getStatusCode(),
            ]);

            return $response;
        }

        \Log::debug('Broadcast auth response (array)', [
            'user_id' => optional($request->user())->id,
            'channel_name' => $request->input('channel_name'),
            'payload' => $response,
        ]);

        return response()->json($response);
    } catch (\Exception $e) {
        \Log::error('Broadcasting auth error', [
            'message' => $e->getMessage(),
            'exception' => get_class($e),
        ]);

        return response()->json([
            'error' => $e->getMessage() ?: get_class($e),
        ], 403);
    }
})->middleware('auth:sanctum');

// Public routes with rate limiting
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
});

// Public reverse geocode proxy (limits to avoid CORS on Nominatim)
Route::middleware(['throttle:30,1'])->get('/geocode/reverse', function (Request $request) {
    $validated = $request->validate([
        'lat' => ['required', 'numeric'],
        'lon' => ['required', 'numeric'],
        'zoom' => ['nullable', 'integer', 'min:3', 'max:18'],
    ]);

    $zoom = $validated['zoom'] ?? 18;
    $userAgent = config('services.nominatim.user_agent')
        ?? env('NOMINATIM_USER_AGENT')
        ?? 'kalinga-app/1.0 (+https://kalinga-frontend.onrender.com)';

    $response = Http::withHeaders([
        'User-Agent' => $userAgent,
    ])->get('https://nominatim.openstreetmap.org/reverse', [
        'format' => 'json',
        'lat' => $validated['lat'],
        'lon' => $validated['lon'],
        'zoom' => $zoom,
        'addressdetails' => 1,
    ]);

    if ($response->failed()) {
        return response()->json([
            'error' => 'Reverse geocoding failed',
            'status' => $response->status(),
            'body' => $response->json(),
        ], $response->status() ?: 502);
    }

    return response()->json($response->json());
});

// Public debug endpoint to check API -> Reverb connectivity without shell access
Route::middleware(['throttle:10,1'])->get('/debug/reverb', function () {
    $rawHost = env('REVERB_HOST');
    $port = env('REVERB_PORT', 443);
    $scheme = env('REVERB_SCHEME', 'https');

    // Normalize host (strip scheme if accidentally included)
    $host = preg_replace('#^https?://#', '', (string) $rawHost);

    $socketResult = null;
    try {
        $address = sprintf('%s:%s', $host, $port);
        $fp = @stream_socket_client($address, $errno, $errstr, 3);
        if ($fp) {
            $socketResult = ['ok' => true, 'address' => $address];
            fclose($fp);
        } else {
            $socketResult = ['ok' => false, 'error' => $errstr ?: 'connection_failed'];
        }
    } catch (\Throwable $e) {
        $socketResult = ['ok' => false, 'error' => $e->getMessage()];
    }

    $httpResult = null;
    try {
        $url = rtrim($scheme . '://' . $host, '/');
        if ($port) $url .= ':' . $port;
        // attempt a lightweight HEAD first, fallback to GET
        $response = Http::timeout(5)->withHeaders(['Accept' => 'application/json'])->head($url);
        $httpResult = ['ok' => true, 'status' => $response->status()];
    } catch (\Throwable $e) {
        // try GET if HEAD failed
        try {
            $response = Http::timeout(5)->withHeaders(['Accept' => 'application/json'])->get($url);
            $httpResult = ['ok' => true, 'status' => $response->status()];
        } catch (\Throwable $e2) {
            $httpResult = ['ok' => false, 'error' => $e2->getMessage()];
        }
    }

    return response()->json([
        'reverb_env' => ['raw' => $rawHost, 'host' => $host, 'port' => $port, 'scheme' => $scheme],
        'socket' => $socketResult,
        'http' => $httpResult,
    ]);
});
// Public read-only routes for testing
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/hospitals', [HospitalController::class, 'index']);
    Route::get('/resources', [ResourceController::class, 'index']);
});

// Protected routes (require authentication + rate limiting)
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    // Common authenticated routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/verify-id', [AuthController::class, 'verifyId']);
    Route::post('/submit-verification', [AuthController::class, 'submitVerification']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/route-logs', [RouteLogController::class, 'store']);
    Route::post('/route-logs/{routeLog}/deviations', [RouteLogController::class, 'storeDeviation']);
    Route::get('/route-logs', [RouteLogController::class, 'index']);
    
    // Admin only routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/users', [AuthController::class, 'getAllUsers']);
        Route::put('/admin/users/{id}/activate', [AuthController::class, 'activateUser']);
        Route::put('/admin/users/{id}/deactivate', [AuthController::class, 'deactivateUser']);
        Route::post('/notifications', [NotificationController::class, 'store']);
    });

    // Admin and Logistics routes
    Route::middleware(['role:admin,logistics'])->group(function () {
        
        // Allocation Request Routes
        Route::get('/incoming-requests', [AllocationController::class, 'getIncomingRequests']);
        Route::get('/outgoing-requests', [AllocationController::class, 'getOutgoingRequests']);
        Route::get('/allocation-history', [AllocationController::class, 'getHistory']);
        Route::post('/allocation-requests', [AllocationController::class, 'createRequest']);
        Route::put('/incoming-requests/{id}/status', [AllocationController::class, 'updateIncomingStatus']);
        Route::get('/supply-tracking', [AllocationController::class, 'getSupplyTracking']);

        // Calendar & History Routes (from your calendar feature)
        Route::get('/resources/calendar/events', [ResourceController::class, 'calendarEvents']);
        Route::get('/resources/calendar/events/{date}', [ResourceController::class, 'dateEvents']);
        Route::get('/resources/{resource}/history', [ResourceController::class, 'resourceHistory']);
        Route::get('/resources/stock-movements', [ResourceController::class, 'stockMovements']);
        
        // Stock adjustment (from your calendar feature)
        Route::post('/resources/{id}/adjust-stock', [ResourceController::class, 'adjustStock']);
        
        // Special queries (from your calendar feature)
        Route::get('/resources/low-stock', [ResourceController::class, 'lowStock']);
        Route::get('/resources/critical', [ResourceController::class, 'critical']);
        Route::get('/resources/expiring', [ResourceController::class, 'expiring']);
        
        // Full CRUD resources (except index which stays public)
        Route::apiResource('resources', ResourceController::class)->except(['index']);
        Route::apiResource('hospitals', HospitalController::class)->except(['index']);

        // ==========================================
        // Hospital Safety Index (HSI) Routes
        // ==========================================
        Route::prefix('hsi')->group(function () {
            // Dashboard & Overview
            Route::get('/dashboard', [HospitalSafetyIndexController::class, 'dashboard']);
            
            // Hospital-specific routes
            Route::prefix('hospitals/{hospital}')->group(function () {
                // Compliance & Simulation
                Route::get('/compliance', [HospitalSafetyIndexController::class, 'hospitalCompliance']);
                Route::post('/simulate-disaster', [HospitalSafetyIndexController::class, 'simulateDisaster']);
                Route::post('/recalculate', [HospitalSafetyIndexController::class, 'recalculateResilience']);
                
                // Disaster Mode
                Route::post('/disaster-mode/activate', [HospitalSafetyIndexController::class, 'activateDisasterMode']);
                Route::post('/disaster-mode/deactivate', [HospitalSafetyIndexController::class, 'deactivateDisasterMode']);
                
                // Safety Assessments
                Route::get('/assessments', [HospitalSafetyIndexController::class, 'assessments']);
                Route::post('/assessments', [HospitalSafetyIndexController::class, 'storeAssessment']);
                
                // Tanks
                Route::get('/tanks', [HospitalSafetyIndexController::class, 'tanks']);
                Route::post('/tanks', [HospitalSafetyIndexController::class, 'storeTank']);
                
                // Vendors
                Route::get('/vendors', [HospitalSafetyIndexController::class, 'vendors']);
                Route::post('/vendors', [HospitalSafetyIndexController::class, 'storeVendor']);
                
                // Resilience Configs
                Route::get('/resilience-configs', [HospitalSafetyIndexController::class, 'resilienceConfigs']);
                Route::post('/resilience-configs', [HospitalSafetyIndexController::class, 'storeResilienceConfig']);
            });
            
            // Individual resource routes
            Route::get('/assessments/{assessment}', [HospitalSafetyIndexController::class, 'showAssessment']);
            Route::patch('/tanks/{tank}/level', [HospitalSafetyIndexController::class, 'updateTankLevel']);
            Route::post('/tanks/{tank}/refill', [HospitalSafetyIndexController::class, 'refillTank']);
            Route::get('/tanks/{tank}/history', [HospitalSafetyIndexController::class, 'tankHistory']);
            Route::patch('/vendors/{vendor}', [HospitalSafetyIndexController::class, 'updateVendor']);
            Route::post('/vendors/{vendor}/trigger', [HospitalSafetyIndexController::class, 'triggerVendor']);
        });
    });

    // Shared read-only situational awareness (patients need visibility too)
    Route::middleware(['role:admin,responder,logistics,patient'])->group(function () {
        Route::get('/incidents', [IncidentApiController::class, 'index']);
        Route::get('/incidents/{incident}', [IncidentApiController::class, 'show']);
        Route::get('/incidents/{incident}/history', [IncidentApiController::class, 'history']);
        Route::get('/road-blockades', [RoadBlockadeController::class, 'index']);
    });

    // Gemini context generation (backend proxy) - authenticated only
    Route::post('/gemini/context', [GeminiController::class, 'generate']);
    
    // Responder (and Logistics) routes
    Route::middleware(['role:admin,responder,logistics'])->group(function () {
        // Pathfinding routes
        Route::get('/incidents/{incident}/conversation', [IncidentApiController::class, 'conversation']);
        Route::get('/incidents/{incident}/hospital-recommendations', [IncidentApiController::class, 'hospitalRecommendations']);
        Route::post('/incidents/{incident}/assign', [IncidentApiController::class, 'assign']);
        Route::post('/incidents/{incident}/status', [IncidentApiController::class, 'updateStatus']);
        Route::post('/incidents/assign-nearest', [IncidentApiController::class, 'assignNearest']);
        
        // AI Smart Routing endpoints
        Route::get('/incidents/{incident}/smart-responder-recommendations', [IncidentApiController::class, 'smartResponderRecommendations']);
        Route::post('/incidents/{incident}/smart-auto-assign', [IncidentApiController::class, 'smartAutoAssign']);
        
        Route::apiResource('road-blockades', RoadBlockadeController::class)->except(['index']);
        Route::post('/road-blockades/route', [RoadBlockadeController::class, 'getRouteBlockades']);
        Route::patch('/road-blockades/{id}/remove', [RoadBlockadeController::class, 'removeBlockade']);
    });
    
    // Patient routes
    Route::middleware(['role:admin,patient'])->group(function () {
        Route::get('/lab-results', [LabResultController::class, 'index']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        
        // Patient rescue tracking - view responder location
        Route::get('/rescue/active', [ResponderTrackingController::class, 'getMyActiveRescue']);
        Route::get('/incidents/{incident}/responder-location', [ResponderTrackingController::class, 'getResponderLocation']);
    });

    // Responder location tracking - update location during active response
    Route::middleware(['role:admin,responder'])->group(function () {
        Route::post('/incidents/{incident}/responder-location', [ResponderTrackingController::class, 'updateLocation']);
    });

    // Chat routes (all authenticated users)
    Route::prefix('chat')->group(function () {
        Route::get('/conversations', [ChatController::class, 'getConversations']);
        Route::get('/messages/{userId}', [ChatController::class, 'getMessages']);
        Route::post('/messages', [ChatController::class, 'sendMessage']);
        Route::delete('/messages/{messageId}', [ChatController::class, 'deleteMessage']);
    });

    // NLP Analysis routes (AI-powered message analysis)
    Route::prefix('nlp')->group(function () {
        Route::post('/analyze-message', [NLPController::class, 'analyzeMessage']);
        Route::post('/urgency-check', [NLPController::class, 'urgencyCheck']);
        Route::post('/analyze-conversation', [NLPController::class, 'analyzeConversation']);
        Route::post('/bulk-urgency', [NLPController::class, 'bulkUrgencyAnalysis']);
    });

    // NLP Analysis for incidents (admin/responder only)
    Route::middleware(['role:admin,responder'])->group(function () {
        Route::get('/nlp/incident/{incident}/analysis', [NLPController::class, 'analyzeIncidentMessages']);
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Test routes (public)
Route::get('/test/hospitals', function () {
    return response()->json(\App\Models\Hospital::all());
});

Route::get('/test/resources', function () {
    return response()->json(\App\Models\Resource::with('hospital')->get());
});