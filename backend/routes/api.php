<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VitalsController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/vitals', [VitalsController::class, 'index']);       // Read
    Route::post('/vitals', [VitalsController::class, 'store']);      // Create
    Route::put('/vitals/{id}', [VitalsController::class, 'update']); // Update
    Route::delete('/vitals/{id}', [VitalsController::class, 'destroy']); // Delete (THIS WAS MISSING)
});
