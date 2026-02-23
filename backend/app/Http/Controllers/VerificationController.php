<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserVerification;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\UserVerified;
use App\Mail\UserRejected;
use Illuminate\Support\Facades\Log;

class VerificationController extends Controller
{
    /**
     * Store a new verification request (User Side)
     */
    public function store(Request $request)
    {
        // Validate the incoming data 
        $request->validate([
            'id_type' => 'required|string',
            'id_image' => 'required|image|max:10240', 
            'id_number' => 'required|string',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'birthday' => 'required|date', 
            'address' => 'required|string',
            'contact_number' => 'required|string',
        ]);

        try {
            // Handle File Upload
            $path = null;
            if ($request->hasFile('id_image')) {
                $path = $request->file('id_image')->store('verification-docs', 'public');
            }

            // Save to Database
            $verification = UserVerification::create([
                'user_id' => Auth::id(),
                'id_type' => $request->id_type,
                'id_number' => $request->id_number,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'date_of_birth' => $request->birthday, 
                'address' => $request->address,
                'front_image_path' => $path, 
                'status' => 'pending'
            ]);
            
            // Update the User's status to 'pending' immediately 
            $user = Auth::user();
            $user->verification_status = 'pending';
            $user->contact_number = $request->contact_number;
            $user->save();

            return response()->json([
                'message' => 'Verification submitted successfully!', 
                'user' => $user, // Return updated user 
                'data' => $verification
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get all pending requests (Admin Side)
     */
    public function index()
    {
        $requests = UserVerification::with('user') // Load user details
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($requests);
    }

    /**
     * Approve a verification request (Admin Side)
     */
    public function approve($id)
    {
        Log::info("Attempting to approve verification ID: " . $id); // Log 1

        $verification = UserVerification::findOrFail($id);
        
        // Update Verification Record
        $verification->status = 'verified';
        $verification->save();

        Log::info("Verification record updated for ID: " . $id); // Log 2

        // Update User & Send Email
        $user = User::find($verification->user_id);
        
        if ($user) {
            $user->verification_status = 'verified';
            $user->save();
            Log::info("User status updated for User ID: " . $user->id); // Log 3

            try {
                Log::info("Attempting to send email to: " . $user->email); // Log 4
                
                // SEND EMAIL
                Mail::to($user->email)->send(new UserVerified());
                
                Log::info("Email sent successfully!"); // Log 5
            } catch (\Exception $e) {
                Log::error("Email failed to send: " . $e->getMessage()); // Error Log
            }
        } else {
            Log::error("User not found for verification ID: " . $id);
        }

        return response()->json(['message' => 'User verified successfully']);
    }

    /**
     * Reject a verification request (Admin Side)
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string'
        ]);

        $verification = UserVerification::findOrFail($id);
        
        // Update Verification Record
        $verification->status = 'rejected';
        $verification->rejection_reason = $request->reason;
        $verification->save();

        // Update User & Send Email
        $user = User::find($verification->user_id);
        if ($user) {
            $user->verification_status = 'rejected';
            $user->save();
            
            // Send Rejection Email (Wrapped in try-catch to be safe)
            try {
                Mail::to($user->email)->send(new UserRejected($request->reason));
            } catch (\Exception $e) {
                Log::error("Rejection email failed to send: " . $e->getMessage());
            }
        }

        return response()->json(['message' => 'User verification rejected']);
    }
}