<?php

use App\Http\Resources\UserResource;
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

    return in_array($user->role, ['admin', 'responder'], true)
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