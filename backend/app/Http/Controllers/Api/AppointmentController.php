<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http; 

class AppointmentController extends Controller
{
    // GET /api/appointments
    public function index()
    {
        $user = Auth::user();
        // Return appointments ordered by newest date first
        $appointments = $user->appointments()->orderBy('appointment_at', 'asc')->get();
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
            'appointment_at' => 'required|date', 
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

        // Verify with Google reCAPTCHA
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => env('RECAPTCHA_SECRET_KEY'), 
            'response' => $request->input('recaptcha_token'),
            'remoteip' => $request->ip(),
        ]);
        
        // If Google says the check failed, stop here
        if (!$response->json()['success']) {
            return response()->json([
                'message' => 'reCAPTCHA verification failed. Please try again.'
            ], 422);
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