<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserVerification;
use Illuminate\Support\Facades\Auth;

class VerificationController extends Controller
{
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
}