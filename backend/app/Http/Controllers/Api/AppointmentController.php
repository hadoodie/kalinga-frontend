<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

class AppointmentController extends Controller
{
    // GET /api/appointments
    public function index()
    {
        $user = Auth::user();

        $orderColumn = Schema::hasColumn('appointments', 'appointment_at')
            ? 'appointment_at'
            : (Schema::hasColumn('appointments', 'appointment_date') ? 'appointment_date' : 'created_at');

        // Return appointments ordered by newest date first
        $appointments = $user->appointments()->orderBy($orderColumn, 'asc')->get();

        // Keep frontend payload stable even if DB uses appointment_at.
        $appointments->transform(function ($appointment) {
            if (!isset($appointment->appointment_date)) {
                $appointment->appointment_date = $appointment->appointment_at;
            }
            return $appointment;
        });

        return response()->json($appointments);
    }

    // POST /api/appointments
    public function store(Request $request)
    {
        // Get the currently logged in user
        $user = Auth::user();

        // Validate the incoming data
        $validated = $request->validate([
            'hospital' => 'required|string',
            'service' => 'required|string',
            'appointment_date' => 'nullable|date',
            'appointment_at' => 'nullable|date',
            'complaint' => 'required|string',
            'patient_name' => 'required|string',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'location' => 'nullable|string',
            'instructions' => 'nullable|string',
            'status' => 'required|string',
            'provider_name' => 'nullable|string',
            'provider_specialty' => 'nullable|string',
            'recaptcha_token' => 'required|string', 
        ]);

        $appointmentAt = $request->input('appointment_at') ?? $request->input('appointment_date');
        if (!$appointmentAt) {
            return response()->json([
                'message' => 'The appointment date is required.'
            ], 422);
        }

        // Persist into whichever date column exists in the current environment.
        unset($validated['appointment_date'], $validated['appointment_at']);
        if (Schema::hasColumn('appointments', 'appointment_at')) {
            $validated['appointment_at'] = $appointmentAt;
        }
        if (Schema::hasColumn('appointments', 'appointment_date')) {
            $validated['appointment_date'] = $appointmentAt;
        }

        // Verify with Google reCAPTCHA (skip in dev if secret key is not configured)
        $recaptchaSecret = config('services.recaptcha.secret');
        
        if ($recaptchaSecret) {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $recaptchaSecret, 
                'response' => $request->input('recaptcha_token'),
                'remoteip' => $request->ip(),
            ]);
            
            // If Google says the check failed, stop here
            if (!$response->json()['success']) {
                return response()->json([
                    'message' => 'reCAPTCHA verification failed. Please try again.'
                ], 422);
            }
        } else {
            // In development without proper reCAPTCHA setup, log a warning
            \Log::warning('reCAPTCHA verification skipped - RECAPTCHA_SECRET_KEY not configured');
        }

        unset($validated['recaptcha_token']);

        // Create the appointment linked to this user
        $appointment = $user->appointments()->create($validated);

        // Return the new appointment with 201 Created status
        return response()->json($appointment, 201);
    }
    
    // DELETE /api/appointments/{id}
    public function destroy($id)
    {
        $user = Auth::user();
        
        // Find the appointment BUT ensure it belongs to this user
        $appointment = $user->appointments()->where('id', $id)->first();

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment cancelled']);
    }
}