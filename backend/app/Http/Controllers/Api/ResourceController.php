<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    /**
     * Display a listing of resources
     */
    public function index(Request $request)
    {
        $query = Resource::with('hospital');

        // Filter by facility type (Evacuation Center or Medical Facility)
        if ($request->has('facility')) {
            $facility = $request->facility;
            if ($facility === 'Evacuation Center') {
                $query->where('location', 'LIKE', '%Evacuation%');
            } elseif ($facility === 'Medical Facility') {
                $query->where('location', 'LIKE', '%Medical%')
                      ->orWhere('location', 'LIKE', '%Hospital%')
                      ->orWhere('location', 'LIKE', '%Clinic%');
            }
        }

        // Filter by category
        if ($request->has('category') && $request->category !== 'All') {
            $query->byCategory($request->category);
        }

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'Critical') {
                $query->where('status', 'Critical');
            } else {
                $query->where('status', $request->status);
            }
        }

        // Filter low stock
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        // Filter critical items
        if ($request->boolean('critical')) {
            $query->critical();
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('sku', 'ILIKE', "%{$search}%")
                  ->orWhere('barcode', 'ILIKE', "%{$search}%");
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Check if pagination is disabled
        if ($request->boolean('all')) {
            $resources = $query->get();
            return response()->json($resources);
        }

        $resources = $query->paginate($request->get('per_page', 15));

        return response()->json($resources);
    }

    /**
     * Store a newly created resource
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'unit' => 'required|string',
            'quantity' => 'required|numeric|min:0',
            'received' => 'nullable|numeric|min:0',
            'distributed' => 'nullable|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'location' => 'required|string',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'description' => 'nullable|string',
            'supplier' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'image_url' => 'nullable|string',
            'is_critical' => 'boolean',
            'requires_refrigeration' => 'boolean',
        ]);

        // Auto-calculate quantity if received and distributed are provided
        if (isset($validated['received']) && isset($validated['distributed'])) {
            $validated['quantity'] = $validated['received'] - $validated['distributed'];
        }

        $resource = Resource::create($validated);
        $resource->updateStatus();

        return response()->json([
            'message' => 'Resource created successfully',
            'resource' => $resource->load('hospital'),
        ], 201);
    }

    /**
     * Display the specified resource
     */
    public function show(Resource $resource)
    {
        return response()->json([
            'resource' => $resource->load(['hospital']),
        ]);
    }

    /**
     * Update the specified resource
     */
    public function update(Request $request, Resource $resource)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'category' => 'string',
            'unit' => 'string',
            'quantity' => 'numeric|min:0',
            'received' => 'nullable|numeric|min:0',
            'distributed' => 'nullable|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'location' => 'string',
            'hospital_id' => 'nullable|exists:hospitals,id',
            'description' => 'nullable|string',
            'supplier' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'image_url' => 'nullable|string',
            'is_critical' => 'boolean',
            'requires_refrigeration' => 'boolean',
        ]);

        // Auto-calculate quantity if received and distributed are provided
        if (isset($validated['received']) && isset($validated['distributed'])) {
            $validated['quantity'] = $validated['received'] - $validated['distributed'];
        }

        $resource->update($validated);
        $resource->updateStatus();

        return response()->json([
            'message' => 'Resource updated successfully',
            'resource' => $resource->load('hospital'),
        ]);
    }

    /**
     * Remove the specified resource
     */
    public function destroy(Resource $resource)
    {
        $resource->delete();

        return response()->json([
            'message' => 'Resource deleted successfully',
        ]);
    }

    /**
     * Get low stock resources
     */
    public function lowStock()
    {
        $resources = Resource::with('hospital')
            ->lowStock()
            ->get();

        return response()->json($resources);
    }

    /**
     * Get critical resources
     */
    public function critical()
    {
        $resources = Resource::with('hospital')
            ->critical()
            ->lowStock()
            ->get();

        return response()->json($resources);
    }

    /**
     * Get expiring resources
     */
    public function expiring(Request $request)
    {
        $days = $request->get('days', 30);

        $resources = Resource::with('hospital')
            ->expiringSoon($days)
            ->get();

        return response()->json($resources);
    }

    /**
     * Adjust stock (add or remove)
     */
    public function adjustStock(Request $request, Resource $resource)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric',
            'type' => 'required|in:add,remove',
            'reason' => 'nullable|string',
        ]);

        try {
            if ($validated['type'] === 'add') {
                $resource->addStock($validated['quantity'], $resource->hospital_id, $validated['reason'] ?? 'Manual adjustment');
            } else {
                $resource->removeStock($validated['quantity'], $resource->hospital_id, $validated['reason'] ?? 'Manual adjustment');
            }

            return response()->json([
                'message' => 'Stock adjusted successfully',
                'resource' => $resource->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}