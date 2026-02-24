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
            'back_image' => 'nullable|image|max:10240', 
            'id_number' => 'required|string',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'birthday' => 'required|date', 
            'address' => 'required|string',
            'contact_number' => 'required|string',
        ]);

        try {
            $frontPath = null;
            $backPath = null; 
            
            if ($request->hasFile('id_image')) {
                $frontPath = $request->file('id_image')->store('verification-docs', 'public');
            }

            if ($request->hasFile('back_image')) {
                $backPath = $request->file('back_image')->store('verification-docs', 'public');
            }

            $verification = UserVerification::create([
                'user_id' => Auth::id(),
                'id_type' => $request->id_type,
                'id_number' => $request->id_number,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'date_of_birth' => $request->birthday, 
                'address' => $request->address,
                'front_image_path' => $frontPath, 
                'back_image_path' => $backPath, 
                'status' => 'pending'
            ]);
            
            $user = Auth::user();
            $user->verification_status = 'pending';
            $user->contact_number = $request->contact_number;
            $user->save();

            return response()->json([
                'message' => 'Verification submitted successfully!', 
                'user' => $user, 
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
        $requests = UserVerification::with('user') 
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

        $verification = UserVerification::findOrFail($id);

        $verification->status = 'verified';
        $verification->save();

        $user = User::find($verification->user_id);
        
        if ($user) {
            $user->verification_status = 'verified';
            $user->save();

            $token = $user->createToken('magic-link')->plainTextToken;

            try {

                Mail::to($user->email)->send(new UserVerified($user, $token));
                
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

        $verification->status = 'rejected';
        $verification->rejection_reason = $request->reason;
        $verification->save();

        $user = User::find($verification->user_id);
        if ($user) {
            $user->verification_status = 'rejected';
            $user->save();

            try {
                Mail::to($user->email)->send(new UserRejected($request->reason, $user)); 
            } catch (\Exception $e) {
                Log::error("Rejection email failed to send: " . $e->getMessage());
            }
        }

        return response()->json(['message' => 'User verification rejected']);
    }
}