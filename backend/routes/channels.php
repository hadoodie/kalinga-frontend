<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function ($user) {
    // A presence channel MUST return an array with 'id' and 'name'.
    // It can also include other info you want to share with clients.
    return $user;
});