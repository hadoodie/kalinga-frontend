<?php

use App\Http\Resources\UserResource;
use App\Models\Incident;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function ($user) {
    // A presence channel MUST return an array with 'id' and 'name'.
    // It can also include other info you want to share with clients.
    return $user ? new UserResource($user) : null;
});

Broadcast::channel('incidents', function ($user) {
    if (!$user) {
        return false;
    }

    $allowedRoles = ['admin', 'responder', 'logistics', 'patient'];

    return in_array($user->role, $allowedRoles, true)
        ? new UserResource($user)
        : false;
});

Broadcast::channel('chat.user.{userId}', function ($user, $userId) {
    if ((int) $user->id !== (int) $userId) {
        return false;
    }

    return new UserResource($user);
});

Broadcast::channel('chat.group.{groupId}', function ($user, $groupId) {
    if (!method_exists($user, 'groups')) {
        return false;
    }

    return $user->groups()->whereKey($groupId)->exists() ? new UserResource($user) : false;
});

// Channel for responder location tracking during active incidents
// Patients can subscribe to track their assigned responder in real-time
Broadcast::channel('incident.{incidentId}.tracking', function ($user, $incidentId) {
    if (!$user) {
        return false;
    }

    $incident = Incident::find($incidentId);
    if (!$incident) {
        return false;
    }

    // Allow admin always
    if ($user->role === 'admin') {
        return new UserResource($user);
    }

    // Allow the patient who reported the incident
    if ($incident->user_id === $user->id) {
        return new UserResource($user);
    }

    // Allow responders assigned to this incident
    $isAssigned = $incident->assignments()
        ->where('responder_id', $user->id)
        ->exists();

    return $isAssigned ? new UserResource($user) : false;
});