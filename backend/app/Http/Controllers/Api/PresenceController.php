<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PresenceController extends Controller
{
    private const TTL_SECONDS = 90;

    public function heartbeat(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'ok' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        Cache::put(
            User::presenceCacheKey($user->id),
            now()->timestamp,
            now()->addSeconds(self::TTL_SECONDS)
        );

        return response()->json([
            'ok' => true,
            'expires_in' => self::TTL_SECONDS,
        ]);
    }

    public function offline(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'ok' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        Cache::forget(User::presenceCacheKey($user->id));

        return response()->json([
            'ok' => true,
        ]);
    }
}
