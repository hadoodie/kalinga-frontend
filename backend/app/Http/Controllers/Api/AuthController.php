<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;  
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:patient,responder,admin,logistics',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        // Return the user object directly, not nested
        return response()->json($request->user());
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user(); // Get the authenticated user

        $validator = Validator::make($request->all(), [
            // --- Fields from your User model ---
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'nullable|string|max:50', 
            'availability' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:50',
            'theme' => 'nullable|string|max:50',
            'visibility' => 'nullable|string|max:50',

            // --- Fields from your React Form ---
            'patientId' => 'nullable|string',
            'dob' => 'nullable|date',
            'bloodType' => 'nullable|string|max:10',
            'address' => 'nullable|string', 
            'admitted' => 'nullable|date',
            'emergencyContactName' => 'nullable|string',
            'emergencyContactPhone' => 'nullable|string',
            
            // --- Field for mapping ---
            'phoneNumber' => 'nullable|string',
            'phone' => 'nullable|string',       
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Get all the validated data
        $validatedData = $validator->validated();

        // --- CRITICAL MAPPING LOGIC ---
        // Map 'phoneNumber' from React state to 'phone' in the database
        if (isset($validatedData['phoneNumber'])) {
            $validatedData['phone'] = $validatedData['phoneNumber'];
            unset($validatedData['phoneNumber']); // Don't try to save 'phoneNumber'
        }
        
        // Update the user with all the validated and mapped data
        $user->update($validatedData);

        // Return a consistent response with a message and the updated user
        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => $user
        ]);
    }

    /**
     * Upload ID for verification
     *  
     */
    public function verifyId(Request $request)
    {
        $request->validate([
            'id_type' => 'required|string|max:50',
            'id_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('id_image')) {
            $path = $request->file('id_image')->store('id_uploads', 'public');
            
            $user->update([
                'id_type' => $request->id_type,
                'id_image_path' => $path,
                'verification_status' => 'pending',
            ]);
        }

        return response()->json([
            'message' => 'ID uploaded successfully. Awaiting verification.',
            'user' => $user,
        ]);
    }

    /**
     * Submit complete verification information
     *  
     */
    public function submitVerification(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'birthday' => 'required|date',
            'contact_number' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'id_type' => 'required|string|max:50',
            'id_image' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB max
        ]);

        $user = $request->user();

        // Store ID image
        $idImagePath = null;
        if ($request->hasFile('id_image')) {
            $idImagePath = $request->file('id_image')->store('id_uploads', 'public');
        }

        // Update user with all verification information
        $user->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middle_name' => $request->middle_name,
            'birthday' => $request->birthday,
            'contact_number' => $request->contact_number,
            'address' => $request->address,
            'id_type' => $request->id_type,
            'id_image_path' => $idImagePath,
            'verification_status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Verification information submitted successfully. Awaiting admin approval.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Forgot password (send reset link)
     *  
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // TODO: Implement password reset email logic
        // For now, just return success message

        return response()->json([
            'message' => 'Password reset link sent to your email.',
        ]);
    }

    /**
     * Get all users (Admin only)
     *  
     */
    public function getAllUsers(Request $request)
    {
        $query = User::query();
        
        // Filter by role if provided
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        
        // Filter by verification status
        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }
        
        $users = $query->paginate(15);
        
        return response()->json($users);
    }

    /**
     * Activate user (Admin only)
     *  
     */
    public function activateUser($id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);
        
        return response()->json([
            'message' => 'User activated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Deactivate user (Admin only)
     *  
     */
    public function deactivateUser($id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => false]);
        
        return response()->json([
            'message' => 'User deactivated successfully',
            'user' => $user,
        ]);
    }
}