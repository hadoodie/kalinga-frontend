<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use Illuminate\Http\Request;

class LogisticNotificationController extends Controller
{
    // Store a new notification
    public function store(Request $request)
    {
        $data = $request->validate([
            'type'         => 'required|string',
            'recipient_id' => 'nullable|exists:users,id',
            'notifiable_type' => 'required|string',
            'notifiable_id'   => 'required|integer',
            'message'      => 'required|string',
            'channel'      => 'in:database,mail,sms,broadcast',
        ]);

        $notification = NotificationLog::create([
            ...$data,
            'status' => 'pending',
        ]);

        return response()->json($notification, 201);
    }

    // Mark as sent
    public function markSent($id)
    {
        $notification = NotificationLog::findOrFail($id);
        $notification->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
        return response()->json($notification);
    }

    // Mark as read
    public function markRead($id)
    {
        $notification = NotificationLog::findOrFail($id);
        $notification->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
        return response()->json($notification);
    }

    // List notifications for a user
    public function index(Request $request)
    {
        $notifications = NotificationLog::where('recipient_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notifications);
    }
}
