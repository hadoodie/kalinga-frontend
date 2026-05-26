<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LabResultController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\IncidentApiController;
use App\Http\Controllers\Api\GeminiController;
use App\Http\Controllers\Api\RoadBlockadeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\RouteLogController;
use App\Http\Controllers\Api\ResponderTrackingController;
use App\Http\Controllers\Api\IncidentTelemetryController;
use App\Http\Controllers\Api\NLPController;
use App\Http\Controllers\HospitalSafetyIndexController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\OCRController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\AllocationController;
use App\Http\Controllers\Api\LogisticsStatusController;
use App\Http\Controllers\Api\ResponderController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\LogisticsController;
use App\Http\Controllers\Api\PresenceController;

use App\Http\Controllers\Api\ForecastController;

use App\Http\Controllers\Api\SensorDataController;
use App\Http\Controllers\Api\PatientCareReportController;
use App\Http\Controllers\Api\HealthSimulatorController;


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
Route::middleware([])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
});
// Public reverse geocode proxy (limits to avoid CORS on Nominatim)
Route::middleware([])->get('/geocode/reverse', function (Request $request) {
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
Route::middleware([])->get('/debug/reverb', function () {
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

// Authenticated debug helper to evaluate broadcast channel authorization rules
Route::middleware(['auth:sanctum'])->post('/debug/broadcast-auth', function (Request $request) {
    $user = $request->user();
    $channel = (string) $request->input('channel_name', '');
    $socketId = (string) $request->input('socket_id', '');

    if ($channel === '') {
        return response()->json([
            'ok' => false,
            'reason' => 'channel_name is required',
        ], 400);
    }

    $decision = [
        'ok' => false,
        'reason' => 'unsupported channel',
    ];

    // Helper to parse trailing numeric identifier
    $parseId = function (string $value): ?int {
        $parts = explode('.', $value);
        $last = end($parts);
        return ctype_digit($last) ? (int) $last : null;
    };

    // private-chat.user.{id}
    if (str_starts_with($channel, 'private-chat.user.')) {
        $targetId = $parseId($channel);
        if ($targetId !== null && (int) $user->id === $targetId) {
            $decision = ['ok' => true, 'reason' => 'user id matches channel'];
        } else {
            $decision = ['ok' => false, 'reason' => 'user id mismatch'];
        }
    }

    // private-chat.group.{id}
    if (str_starts_with($channel, 'private-chat.group.')) {
        $targetId = $parseId($channel);
        if ($targetId !== null && method_exists($user, 'groups')) {
            $exists = $user->groups()->whereKey($targetId)->exists();
            $decision = [
                'ok' => $exists,
                'reason' => $exists ? 'user is in group' : 'user not in group',
            ];
        } else {
            $decision = ['ok' => false, 'reason' => 'group relation missing or invalid id'];
        }
    }

    // presence-incidents
    if ($channel === 'presence-incidents') {
        $allowedRoles = ['admin', 'responder', 'logistics', 'patient'];
        $isAllowed = in_array($user->role, $allowedRoles, true);
        $decision = [
            'ok' => $isAllowed,
            'reason' => $isAllowed ? 'role allowed for incidents presence channel' : 'role not permitted',
        ];
    }

    // presence-incident.{incidentId}.tracking (leaflet tracker/patient-responder)
    if (str_starts_with($channel, 'presence-incident.') && str_ends_with($channel, '.tracking')) {
        $parts = explode('.', $channel);
        // expected: ['presence-incident', '{incidentId}', 'tracking']
        $incidentId = null;
        if (count($parts) >= 3 && ctype_digit($parts[1])) {
            $incidentId = (int) $parts[1];
        }

        if ($incidentId) {
            $incident = \App\Models\Incident::find($incidentId);
            if (!$incident) {
                $decision = ['ok' => false, 'reason' => 'incident not found'];
            } else {
                $isOwner = $incident->user_id === $user->id;
                $isAssigned = $incident->assignments()->where('responder_id', $user->id)->exists();
                $isAdmin = $user->role === 'admin';
                $allowed = $isOwner || $isAssigned || $isAdmin;
                $decision = [
                    'ok' => $allowed,
                    'reason' => $allowed ? 'authorized (owner/assigned/admin)' : 'not owner/assigned/admin',
                    'context' => [
                        'is_owner' => $isOwner,
                        'is_assigned' => $isAssigned,
                        'is_admin' => $isAdmin,
                        'incident_id' => $incidentId,
                    ],
                ];
            }
        } else {
            $decision = ['ok' => false, 'reason' => 'invalid incident id in channel'];
        }
    }

    return response()->json([
        'ok' => $decision['ok'],
        'reason' => $decision['reason'],
        'channel' => $channel,
        'socket_id' => $socketId,
        'user' => [
            'id' => $user->id,
            'role' => $user->role,
            'email' => $user->email ?? null,
        ],
        'context' => $decision['context'] ?? null,
    ]);
});
// Public read-only routes for testing
Route::middleware([])->group(function () {
    Route::get('/hospitals', [HospitalController::class, 'index']);
    Route::get('/resources', [ResourceController::class, 'index']);
});

// Secure Image Serving (Requires Valid Signature)
Route::get('/secure-document', [\App\Http\Controllers\VerificationController::class, 'showDocument'])
    ->middleware('signed')
    ->name('secure.document');

// Protected routes (require authentication + rate limiting)
Route::middleware(['auth:sanctum'])->group(function () {
    // Common authenticated routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/presence/heartbeat', [PresenceController::class, 'heartbeat']);
    Route::post('/presence/offline', [PresenceController::class, 'offline']);
    Route::post('/verify-id', [AuthController::class, 'verifyId']);
    Route::post('/submit-verification', [AuthController::class, 'submitVerification']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/route-logs', [RouteLogController::class, 'store']);
    Route::post('/route-logs/{routeLog}/deviations', [RouteLogController::class, 'storeDeviation']);
    Route::get('/route-logs', [RouteLogController::class, 'index']);
    Route::post('/book-appointment', [AppointmentController::class, 'store']);
    Route::post('/parse-id', [OCRController::class, 'processImage']);

    // Identity Verification
    Route::post('/verify-identity', [VerificationController::class, 'store']);
  
    // Admin only routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/users', [AuthController::class, 'getAllUsers']);
        Route::put('/admin/users/{id}/activate', [AuthController::class, 'activateUser']);
        Route::put('/admin/users/{id}/deactivate', [AuthController::class, 'deactivateUser']);
        Route::put('/admin/users/{id}/hospital', [AuthController::class, 'updateUserHospital']);
        Route::put('/admin/users/{id}', [AuthController::class, 'updateUser']);
        Route::get('/admin/verifications', [VerificationController::class, 'index']);
        Route::post('/admin/verifications/{id}/approve', [VerificationController::class, 'approve']);
        Route::post('/admin/verifications/{id}/reject', [VerificationController::class, 'reject']);
        Route::post('/notifications', [NotificationController::class, 'store']);
    });

    // Admin and Logistics routes
    Route::middleware(['role:admin,logistics'])->group(function () {

        // ── AI Forecasting Routes ────────────────────────────
        Route::prefix('forecasts')->group(function () {
            Route::get('/demand',             [ForecastController::class, 'demand']);
            Route::get('/risk',               [ForecastController::class, 'risk']);
            Route::get('/summary',            [ForecastController::class, 'summary']);
            Route::get('/hospital/{hospital}', [ForecastController::class, 'hospitalDetail']);
            Route::get('/narrative',          [ForecastController::class, 'narrative']);
            Route::get('/auto-reorders',      [ForecastController::class, 'autoReorders']);
            Route::get('/health',             [ForecastController::class, 'health']);
            Route::get('/history',            [ForecastController::class, 'history']);
            Route::get('/accuracy',           [ForecastController::class, 'accuracy']);
            Route::post('/trigger',           [ForecastController::class, 'trigger']);
        });

            Route::get('/requests', [RequestController::class, 'index']);
            Route::post('/requests', [RequestController::class, 'store']);
            Route::get('/requests/{request}', [RequestController::class, 'show']);
            Route::post('/requests/draft', [RequestController::class, 'storeDraft']);
            Route::delete('/requests/{request}', [RequestController::class, 'destroy']);
            Route::patch('/requests/{request}/draft', [RequestController::class, 'updateDraft']);
            Route::post('/requests/{request}/submit', [RequestController::class, 'submitDraft']);
            Route::post('/requests/{request}/under-review', [RequestController::class, 'markAsUnderReview'])
                ->name('requests.under-review');
            Route::patch('/requests/{request}/status', [RequestController::class, 'updateStatus'])
                ->name('requests.update-status');
            
            Route::get('/allocations', [AllocationController::class, 'index']);
            Route::post('/allocations', [AllocationController::class, 'store']);
            Route::post('/allocations/bulk', [AllocationController::class, 'bulkCreate']);
            Route::get('/allocations/my', [AllocationController::class, 'myAllocations']);
            Route::patch('/allocations/{allocation}/confirm', [AllocationController::class, 'confirm']);
            Route::get('/allocations/suggestions/{request}', [AllocationController::class, 'suggestions']);
            Route::delete('/allocations/{allocation}/reject', [AllocationController::class, 'rejectSuggestion']);

            Route::prefix('allocations')->group(function () {
            Route::patch('{allocation}/assign', [AllocationController::class, 'assign']); });

             Route::get('/allocations/{id}/assignment-details', [AllocationController::class, 'assignmentDetails'])
            ->name('allocations.assignment-details');

            Route::get('/allocations/pending/count', [AllocationController::class, 'pendingCount']);
            Route::get('/allocations/my/count', [AllocationController::class, 'myAllocationsCount']);
            Route::get('/allocations/{id}/details', [AllocationController::class, 'showWithDetails']);

            Route::get('/allocations/{id}', [AllocationController::class, 'show']);
            Route::get('/allocations/{id}/assignment', [AllocationController::class, 'assignment']);
            Route::get('/allocations/{allocation}/suggest-vehicle', [AllocationController::class, 'suggestVehicle']);
            Route::get('/allocations/{allocation}/suggest-responder', [AllocationController::class, 'suggestResponder']);
            Route::get('/allocations/{allocation}/available-vehicles', [AllocationController::class, 'availableVehicles']);
            Route::get('/allocations/{allocation}/available-responders', [AllocationController::class, 'availableResponders']);

            Route::get('/supply-tracking', [AllocationController::class, 'getSupplyTracking']);
                
            Route::get('/responders/available', [ResponderController::class, 'available']);

            Route::get('assets/metrics', [AssetController::class, 'metrics']);
            Route::get('assets/export/csv', [AssetController::class, 'exportCsv']);
            Route::get('/assets/available', [AssetController::class, 'available']);
            Route::post('assets/{code}/adjust-stock', [AssetController::class, 'adjustStock']);
            Route::apiResource('assets', AssetController::class)->parameters(['assets' => 'code']);



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

        // 
        // Hospital Safety Index (HSI) Routes
        // 
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

            // Resilience config single-resource routes (outside hospital prefix)
            Route::patch('/resilience-configs/{config}', [HospitalSafetyIndexController::class, 'updateResilienceConfig']);
            Route::delete('/resilience-configs/{config}', [HospitalSafetyIndexController::class, 'deleteResilienceConfig']);
            
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
        Route::apiResource('patient-care-reports', PatientCareReportController::class)
            ->only(['index', 'show', 'store']);
        Route::post('patient-care-reports/{patientCareReport}/soft-copy', [PatientCareReportController::class, 'generateSoftCopy']);
        Route::get('patient-care-reports/{patientCareReport}/soft-copy', [PatientCareReportController::class, 'downloadSoftCopy']);

        Route::get('/incidents/{incident}/conversation', [IncidentApiController::class, 'conversation']);
        Route::get('/incidents/{incident}/hospital-recommendations', [IncidentApiController::class, 'hospitalRecommendations']);
        Route::post('/incidents/{incident}/assign', [IncidentApiController::class, 'assign']);
        Route::post('/incidents/{incident}/status', [IncidentApiController::class, 'updateStatus']);
        Route::post('/incidents/{incident}/telemetry/socket-receipt', [IncidentTelemetryController::class, 'storeSocketReceipt']);
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
        Route::get('/my-patient-care-reports', [PatientCareReportController::class, 'myReports']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
        
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

// Logistics Unified Tracking Event
Route::patch('/logistics/requests/{id}/status', [LogisticsStatusController::class, 'updateStatus']);

// Test routes (public)
Route::get('/test/hospitals', function () {
    return response()->json(\App\Models\Hospital::all());
});

Route::get('/test/resources', function () {
    return response()->json(\App\Models\Resource::with('hospital')->get());
});

// ======
// Alisto Sensor Data & Health Simulator Routes
// ======

// Public sensor endpoints (RPi pushes data here; dashboard reads it)
Route::middleware([])->prefix('sensor')->group(function () {
    Route::get('/vitals/latest',  [SensorDataController::class, 'latest']);
    Route::get('/vitals/history', [SensorDataController::class, 'history']);
    Route::get('/vitals/summary', [SensorDataController::class, 'summary']);
    Route::get('/status',         [SensorDataController::class, 'deviceStatus']);
    Route::post('/vitals',        [SensorDataController::class, 'store']);
});

// Simulator endpoints (protected — admin/responder only)
Route::middleware(['auth:sanctum'])->prefix('simulator')->group(function () {
    Route::get('/scenarios',  [HealthSimulatorController::class, 'scenarios']);
    Route::post('/start',     [HealthSimulatorController::class, 'start']);
    Route::post('/stream',    [HealthSimulatorController::class, 'stream']);
    Route::delete('/cleanup', [HealthSimulatorController::class, 'cleanup']);
});

// ======
// Hospital Patient Distribution (bridged to DB capacity)
// ======
Route::middleware([])->get('/hospitals/patient-distribution', function () {
    $hospitals = \App\Models\Hospital::whereNotNull('capacity')
        ->where('is_active', true)
        ->select('id', 'name', 'capacity', 'bed_capacity', 'icu_capacity')
        ->get();

    if ($hospitals->isEmpty()) {
        // Mock distribution when no hospitals are configured
        return response()->json([
            'source' => 'mock',
            'data'   => [
                ['hospital' => 'Philippine General Hospital', 'patients' => 142, 'capacity' => 200, 'occupancy_pct' => 71],
                ['hospital' => 'East Avenue Medical Center',  'patients' => 98,  'capacity' => 150, 'occupancy_pct' => 65],
                ['hospital' => 'Rizal Medical Center',        'patients' => 76,  'capacity' => 120, 'occupancy_pct' => 63],
                ['hospital' => 'JRRMMC',                      'patients' => 115, 'capacity' => 180, 'occupancy_pct' => 64],
                ['hospital' => 'St. Luke\'s QC',              'patients' => 68,  'capacity' => 100, 'occupancy_pct' => 68],
            ],
        ]);
    }

    $data = $hospitals->map(function ($h) {
        $totalCapacity = $h->bed_capacity ?? $h->capacity ?? 100;
        $simulatedPatients = (int) round($totalCapacity * (mt_rand(55, 90) / 100));
        return [
            'hospital'      => $h->name,
            'hospital_id'   => $h->id,
            'patients'      => $simulatedPatients,
            'capacity'      => $totalCapacity,
            'occupancy_pct' => $totalCapacity > 0 ? round($simulatedPatients / $totalCapacity * 100) : 0,
        ];
    });

    return response()->json([
        'source' => 'database',
        'data'   => $data,
    ]);
});

// ======
// DOH Hospital Reports — Priority categorization by occupancy
// ======
Route::middleware([])->get('/reports/doh-hospital', function () {
    $hospitals = \App\Models\Hospital::where('is_active', true)
        ->select('id', 'name', 'capacity', 'bed_capacity', 'icu_capacity', 'emergency_services')
        ->get();

    if ($hospitals->isEmpty()) {
        return response()->json([
            'source' => 'mock',
            'data'   => [
                ['hospital' => 'Philippine General Hospital', 'occupancy_pct' => 92, 'priority' => 'Critical', 'message' => 'ICU at full capacity', 'action' => 'Divert new admissions to nearby facilities'],
                ['hospital' => 'East Avenue Medical Center',  'occupancy_pct' => 78, 'priority' => 'High',     'message' => 'ER nearing capacity', 'action' => 'Request additional staff from DOH pool'],
                ['hospital' => 'Rizal Medical Center',        'occupancy_pct' => 63, 'priority' => 'Medium',   'message' => 'Stable operations', 'action' => 'Continue monitoring'],
            ],
        ]);
    }

    $reports = $hospitals->map(function ($h) {
        $totalCapacity = $h->bed_capacity ?? $h->capacity ?? 100;
        $occupancy     = mt_rand(45, 98);

        if ($occupancy >= 85) {
            $priority = 'Critical';
            $message  = 'Facility at/near full capacity — ICU and ER beds critically low';
            $action   = 'Activate surge protocol; divert new admissions to partner facilities';
        } elseif ($occupancy >= 70) {
            $priority = 'High';
            $message  = 'Occupancy elevated — approaching capacity threshold';
            $action   = 'Request additional staff deployment from DOH regional pool';
        } else {
            $priority = 'Medium';
            $message  = 'Operations stable — within normal occupancy range';
            $action   = 'Continue routine monitoring';
        }

        return [
            'hospital'      => $h->name,
            'hospital_id'   => $h->id,
            'occupancy_pct' => $occupancy,
            'priority'      => $priority,
            'severity'      => strtolower($priority === 'Critical' ? 'critical' : ($priority === 'High' ? 'high' : 'medium')),
            'message'       => $message,
            'action'        => $action,
            'emergency_services' => (bool) $h->emergency_services,
            'timestamp'     => now()->toIso8601String(),
        ];
    })->sortByDesc('occupancy_pct')->values();

    return response()->json([
        'source' => 'database',
        'data'   => $reports,
    ]);
});

// ======
// DOH Triage Status — linked to QR code auth logs / vitals
// ======
Route::middleware([])->get('/reports/doh-triage', function () {
    $hasVitals = \App\Models\Vital::exists();

    if ($hasVitals) {
        $stats = \Illuminate\Support\Facades\DB::table('vitals')
            ->selectRaw("
                COUNT(*) AS total,
                SUM(CASE WHEN oxygen_saturation < 85 OR heart_rate > 140 OR heart_rate < 40 THEN 1 ELSE 0 END) AS critical,
                SUM(CASE WHEN (oxygen_saturation >= 85 AND oxygen_saturation < 92) OR (heart_rate > 120 AND heart_rate <= 140) THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN (oxygen_saturation >= 92 AND oxygen_saturation < 95) OR (heart_rate > 100 AND heart_rate <= 120) THEN 1 ELSE 0 END) AS medium,
                SUM(CASE WHEN oxygen_saturation >= 95 AND heart_rate >= 60 AND heart_rate <= 100 THEN 1 ELSE 0 END) AS low
            ")
            ->first();

        return response()->json([
            'source' => 'database',
            'data'   => [
                'total'    => (int) $stats->total,
                'critical' => (int) $stats->critical,
                'high'     => (int) $stats->high,
                'medium'   => (int) $stats->medium,
                'low'      => (int) $stats->low,
            ],
        ]);
    }

    return response()->json([
        'source' => 'mock',
        'data'   => [
            'total'    => 87,
            'critical' => 5,
            'high'     => 12,
            'medium'   => 28,
            'low'      => 42,
        ],
    ]);
});

// ======
// Incident Logs Polling Endpoint (lightweight)
// ======
Route::middleware([])->get('/incidents/poll', function (\Illuminate\Http\Request $request) {
    $since = $request->query('since');
    $query = \App\Models\Incident::query()
        ->with(['assignments.responder:id,name,role', 'latestStatusUpdate.user:id,name,role'])
        ->where('status', '!=', 'cancelled')
        ->orderByDesc('updated_at')
        ->limit(50);

    if ($since) {
        $query->where('updated_at', '>', $since);
    }

    return response()->json([
        'data'       => $query->get(),
        'polled_at'  => now()->toIso8601String(),
    ]);
});


