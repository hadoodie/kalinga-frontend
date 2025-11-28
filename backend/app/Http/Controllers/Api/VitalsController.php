<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Vital; // ✅ CRITICAL: This imports the Model so the controller can find it

class VitalsController extends Controller
{
    // --- CREATE (POST) ---
    public function store(Request $request)
    {
        Log::info("📥 Incoming Save Request:", $request->all());

        // 1. Validate (Now allows patient_name)
        $validated = $request->validate([
            'patient_id'   => 'required|string',
            'patient_name' => 'nullable|string', 
            'temperature'  => 'required|numeric',
            'bpm'          => 'required|numeric',
            'spo2'         => 'required|numeric',
        ]);

        // 2. Create Record
        try {
            $vital = Vital::create($validated);
            Log::info("✅ Saved Record ID: " . $vital->id);

            return response()->json([
                'success' => true,
                'message' => 'Record created successfully',
                'data'    => $vital
            ], 201);
        } catch (\Exception $e) {
            Log::error("❌ Save Failed: " . $e->getMessage());
            return response()->json(['error' => 'Save Failed', 'message' => $e->getMessage()], 500);
        }
    }

    // --- READ ALL (GET) ---
    public function index()
    {
        try {
            // Check if table exists (optional safeguard)
            // Or just try to fetch
            $data = Vital::latest()->get();
            return response()->json($data, 200);
        } catch (\Exception $e) {
            // This catches the 500 error and shows it as text you can read
            Log::error("Database Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Database Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // --- UPDATE (PUT) ---
    public function update(Request $request, $id)
    {
        Log::info("📝 Updating Record ID: $id", $request->all());
        
        try {
            $vital = Vital::find($id);
            if (!$vital) return response()->json(['message' => 'Not found'], 404);

            $validated = $request->validate([
                'patient_id'   => 'sometimes|string',
                'patient_name' => 'nullable|string',
                'temperature'  => 'sometimes|numeric',
                'bpm'          => 'sometimes|numeric',
                'spo2'         => 'sometimes|numeric',
            ]);

            $vital->update($validated);
            return response()->json(['success' => true, 'data' => $vital], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update Failed', 'message' => $e->getMessage()], 500);
        }
    }

    // --- DELETE (DELETE) ---
    public function destroy($id)
    {
        Log::info("🗑️ Deleting Record ID: $id");
        
        try {
            $vital = Vital::find($id);
            if (!$vital) return response()->json(['message' => 'Not found'], 404);

            $vital->delete();
            return response()->json(['success' => true], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Delete Failed', 'message' => $e->getMessage()], 500);
        }
    }
}
