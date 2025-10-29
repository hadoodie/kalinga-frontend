<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification; 
use Illuminate\Support\Facades\Validator; 

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = $user->notifications()->latest()->get();
        return response()->json($notifications);
    }

    /**
     * Store a new notification in the database.
     * (This is the new function you are adding)
     */
    public function store(Request $request)
    {
        // Validate the incoming data
        $validator = Validator::make($request->all(), [
            'user_id'     => 'required|integer|exists:users,id', // Make sure user exists
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the notification
        $notification = Notification::create([
            'user_id'     => $request->user_id,
            'title'       => $request->title,
            'description' => $request->description,
        ]);

        // Send back a success response
        return response()->json($notification, 201); // 201 = "Created"
    }
}