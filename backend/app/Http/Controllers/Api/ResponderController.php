<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Responder;
use Illuminate\Http\Request;

class ResponderController extends Controller
{
    public function available(Request $request)
    {
        $handling = $request->query('handling_class', 'general');

        $query = Responder::where('status', 'Available'); 

        if ($handling === 'cold_chain') {
            $query->whereJsonContains('handling_capabilities', 'ColdChain');
        } elseif ($handling === 'narcotics') {
            $query->whereJsonContains('handling_capabilities', 'Narcotics');
        } elseif ($handling === 'high_value') {
            $query->whereJsonContains('handling_capabilities', 'HighValue');
        }

        return response()->json([
            'data' => $query->orderBy('full_name')->get()
        ]);
    }
}