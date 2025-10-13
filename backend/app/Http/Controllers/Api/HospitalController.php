<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    /**
     * Display a listing of hospitals
     */
    public function index()
    {
        return response()->json(Hospital::all());
    }

    /**
     * Store a newly created hospital
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'email' => 'nullable|email',
            'capacity' => 'nullable|integer',
            'type' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $hospital = Hospital::create($validated);
        return response()->json(['message' => 'Hospital created', 'hospital' => $hospital], 201);
    }

    /**
     * Display the specified hospital
     */
    public function show(Hospital $hospital)
    {
        return response()->json($hospital);
    }

    /**
     * Update the specified hospital
     */
    public function update(Request $request, Hospital $hospital)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'email' => 'nullable|email',
            'capacity' => 'nullable|integer',
            'type' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);
        $hospital->update($validated);
        return response()->json(['message' => 'Hospital updated', 'hospital' => $hospital]);
    }

    /**
     * Remove the specified hospital
     */
    public function destroy(Hospital $hospital)
    {
        $hospital->delete();
        return response()->json(['message' => 'Hospital deleted']);
    }
}
