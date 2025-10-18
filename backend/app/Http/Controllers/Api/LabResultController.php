<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LabResult;
use Illuminate\Support\Facades\Auth;

class LabResultController extends Controller
{
    public function index(Request $request)
    {
        // Validate incoming request parameters
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'sort_by' => 'nullable|in:Ascending,Descending',
        ]);

        $query = LabResult::query()
            // IMPORTANT: Only get results for the currently authenticated user
            ->where('user_id', Auth::id());

        // Conditionally apply date filters if they exist
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('order_date', [$request->date_from, $request->date_to]);
        }

        // Apply sorting
        $sortBy = $request->input('sort_by', 'Descending'); // Default to Descending
        $sortDirection = ($sortBy === 'Descending') ? 'desc' : 'asc';
        $query->orderBy('order_date', $sortDirection);

        // Fetch the results
        $results = $query->get();
        
        // Also fetch the patient's name from the user relationship
        // We'll add this relationship to the LabResult model next
        $results->load('user');

        return response()->json($results);
    }
}