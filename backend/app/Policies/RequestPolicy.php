<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Request;

class RequestPolicy
{
public function update(User $user, Request $request): bool
{

        \Log::info('Policy check', [
        'user_id' => $user->id,
        'user_role' => $user->role,
        'request_created_by' => $request->created_by,
        'request_hospital_id' => $request->hospital_id,
    ]);

        // Allow any user belonging to the same hospital
if ($user->hospitals()->pluck('id')->contains($request->hospital_id)) {
    return true;
}


    // Admins and logistics can update any request
if (in_array(strtolower($user->role), ['admin','logistics','hospital_admin'])) {
    return true;
}


    // Patients can update their own requests
    if ($user->role === 'patient' && $request->created_by === $user->id) {
        return true;
    }

    

    // Dispatchers can update requests they created
    if ($user->role === 'dispatcher' && $request->created_by === $user->id) {
        return true;
    }

    return false;
}

    public function delete(User $user, Request $request): bool
    {

    \Log::info('Delete policy check', [
        'user_id' => $user->id,
        'user_role' => $user->role,
        'request_status' => $request->status,
    ]);
        // Only admins and hospital admins can delete drafts
        return in_array($user->role, ['admin', 'hospital_admin','logistics', 'procurement',]);
    }
}
