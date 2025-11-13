<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\LabResultController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\IncidentApiController;
use App\Http\Controllers\Api\RoadBlockadeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\AllocationController;
use Illuminate\Http\Request;
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
        
        // Full CRUD resources (keep this last)
        Route::apiResource('resources', ResourceController::class);
        Route::apiResource('hospitals', HospitalController::class);
    });
    
    // Responder routes
    Route::middleware(['role:admin,responder'])->group(function () {
        // Pathfinding routes
        Route::get('/incidents', [IncidentApiController::class, 'index']);
        Route::get('/incidents/{incident}/history', [IncidentApiController::class, 'history']);
        Route::post('/incidents/{incident}/assign', [IncidentApiController::class, 'assign']);
        Route::post('/incidents/{incident}/status', [IncidentApiController::class, 'updateStatus']);
        Route::post('/incidents/assign-nearest', [IncidentApiController::class, 'assignNearest']);
        
        Route::apiResource('road-blockades', RoadBlockadeController::class);
        Route::post('/road-blockades/route', [RoadBlockadeController::class, 'getRouteBlockades']);
        Route::patch('/road-blockades/{id}/remove', [RoadBlockadeController::class, 'removeBlockade']);
    });
    
    // Patient routes
    Route::middleware(['role:admin,patient'])->group(function () {
        Route::get('/lab-results', [LabResultController::class, 'index']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
    });

    // Chat routes (all authenticated users)
    Route::prefix('chat')->group(function () {
        Route::get('/conversations', [ChatController::class, 'getConversations']);
        Route::get('/messages/{userId}', [ChatController::class, 'getMessages']);
        Route::post('/messages', [ChatController::class, 'sendMessage']);
        Route::delete('/messages/{messageId}', [ChatController::class, 'deleteMessage']);
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