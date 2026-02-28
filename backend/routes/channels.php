<?php

use App\Http\Resources\UserResource;
use App\Models\Incident;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function ($user) {
    // A presence channel MUST return an array with 'id' and 'name'.
    // It can also include other info you want to share with clients.
    if (!$user) return false;
    return ['id' => $user->id, 'name' => $user->name, 'role' => $user->role];
});

Broadcast::channel('incidents', function ($user) {
    if (!$user) {
        return false;
    }

    $allowedRoles = ['admin', 'responder', 'logistics', 'patient'];

    return in_array($user->role, $allowedRoles, true)
        ? ['id' => $user->id, 'name' => $user->name, 'role' => $user->role]
        : false;
});

Broadcast::channel('chat.user.{userId}', function ($user, $userId) {
    if ((int) $user->id !== (int) $userId) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name, 'role' => $user->role];
});

Broadcast::channel('chat.group.{groupId}', function ($user, $groupId) {
    if (!method_exists($user, 'groups')) {
        return false;
    }

    return $user->groups()->whereKey($groupId)->exists() ? ['id' => $user->id, 'name' => $user->name, 'role' => $user->role] : false;
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
        return ['id' => $user->id, 'name' => $user->name, 'role' => $user->role];
    }

    // Allow the patient who reported the incident
    if ($incident->user_id === $user->id) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => $user->role];
    }

    // Allow responders assigned to this incident
    $isAssigned = $incident->assignments()
        ->where('responder_id', $user->id)
        ->exists();

    return $isAssigned ? ['id' => $user->id, 'name' => $user->name, 'role' => $user->role] : false;
});
