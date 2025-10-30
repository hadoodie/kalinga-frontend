<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\HospitalController;
use App\Http\Controllers\Api\LabResultController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Http\Request;

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

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Public read-only routes for testing
Route::get('/hospitals', [HospitalController::class, 'index']);
Route::get('/resources', [ResourceController::class, 'index']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Common authenticated routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']); // <-- Duplicate removed
    Route::post('/verify-id', [AuthController::class, 'verifyId']);
    Route::post('/submit-verification', [AuthController::class, 'submitVerification']);
    
    // Admin only routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/users', [AuthController::class, 'getAllUsers']);
        Route::put('/admin/users/{id}/activate', [AuthController::class, 'activateUser']);
        Route::put('/admin/users/{id}/deactivate', [AuthController::class, 'deactivateUser']);
        Route::post('/notifications', [NotificationController::class, 'store']);
    });
    // <-- DELETED THE EXTRA '});' FROM HERE

    // Admin and Logistics routes
    Route::middleware(['role:admin,logistics'])->group(function () {
        Route::apiResource('resources', ResourceController::class);
        Route::get('/resources/low-stock', [ResourceController::class, 'lowStock']);
        Route::get('/resources/critical', [ResourceController::class, 'critical']);
        Route::get('/resources/expiring', [ResourceController::class, 'expiring']);
        
        Route::apiResource('hospitals', HospitalController::class);
    });
    
    // Responder routes
    Route::middleware(['role:admin,responder'])->group(function () {
        // Emergency response routes will go here
    });
    
    // Patient routes
    Route::middleware(['role:admin,patient'])->group(function () {
        // Patient-specific routes will go here
        Route::get('/lab-results', [LabResultController::class, 'index']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
    });

}); // <-- This is the correct closing brace for 'auth:sanctum'

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

// Test routes (public)
Route::get('/test/resources', function () {
    return response()->json(\App\Models\Resource::with('hospital')->get());
}); 