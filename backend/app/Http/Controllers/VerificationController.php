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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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
                $file = $request->file('id_image');
                $frontPath = $file->storeAs(
                    'verification-docs',
                    'front_' . Auth::id() . '_' . uniqid() . '.' . $file->getClientOriginalExtension(),
                    'local'
                );
                \Log::info("Front image stored at: " . $frontPath);
            } else {
                \Log::warning("No front image received in request");
            }

            if ($request->hasFile('back_image')) {
                $file = $request->file('back_image');
                $backPath = $file->storeAs(
                    'verification-docs',
                    'back_' . Auth::id() . '_' . uniqid() . '.' . $file->getClientOriginalExtension(),
                    'local'
                );
                \Log::info("Back image stored at: " . $backPath);
            } else {
                \Log::warning("No back image received in request");
            }

            \Log::info("Creating verification record", [
                'front_path' => $frontPath,
                'back_path' => $backPath,
                'id_type' => $request->id_type,
                'user_id' => Auth::id()
            ]);

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
            
            \Log::info("Verification record created successfully", [
                'verification_id' => $verification->id,
                'stored_front_path' => $verification->front_image_path,
                'stored_back_path' => $verification->back_image_path
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

        $requests->transform(function ($req) {
            if ($req->front_image_path) {
                $req->secure_front_url = URL::temporarySignedRoute(
                    'secure.document', now()->addMinutes(60), ['path' => $req->front_image_path]
                );
            }
            if ($req->back_image_path) {
                $req->secure_back_url = URL::temporarySignedRoute(
                    'secure.document', now()->addMinutes(60), ['path' => $req->back_image_path]
                );
            }
            return $req;
        });

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

            $tokenResult = $user->createToken('magic-link');
            $tokenResult->accessToken->forceFill([
                'expires_at' => now()->addMinutes(30),
            ])->save();
            
            $token = $tokenResult->plainTextToken;

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

    /**
     * Securely serve the document via a signed URL
     */
    public function showDocument(Request $request)
    {
        // Check if the link has been tampered with or expired
        if (! $request->hasValidSignature()) {
            abort(403, 'Unauthorized or expired image link.');
        }

        $path = $request->query('path');

        // Validate that $path is a non-empty string before further checks
        if (!is_string($path) || trim($path) === '') {
            abort(400, 'Missing or invalid path parameter.');
        }

        // SECURITY FIX: Prevent Directory Traversal
        if (str_contains($path, '..') || !str_starts_with($path, 'verification-docs/')) {
            abort(403, 'Invalid file path requested.');
        }
        
        // Fetch it from the private 'local' disk
        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'Document not found.');
        }

        return response()->file(Storage::disk('local')->path($path));
    }
}