<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $appointments = $user->appointments()->orderBy('appointment_at', 'desc')->get();
        return response()->json($appointments);
    }
}