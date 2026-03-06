<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use App\Models\StockMovement; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; 

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $query = Resource::with('hospital')
            ->when($request->hospital_id, fn($q) => $q->where('hospital_id', $request->hospital_id))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search, fn($q, $term) => $q->where('name', 'like', "%{$term}%"))
            ->when($request->low_stock, fn($q) => $q->lowStock())
            ->when($request->critical, fn($q) => $q->where('is_critical', true))
            ->when($request->expiring_soon, fn($q) => $q->expiringSoon(30));

        // Filter by facility (alternative parameter name)
        if ($request->has('facility')) {
            $query->where('location', $request->facility);
        }

        // Filter by hospital_id
        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
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
            $query->whereRaw('is_critical = true');
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $lowerSearch = strtolower($search);
            $query->where(function($q) use ($lowerSearch) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$lowerSearch}%"])
                  ->orWhereRaw('LOWER(sku) LIKE ?', ["%{$lowerSearch}%"])
                  ->orWhereRaw('LOWER(barcode) LIKE ?', ["%{$lowerSearch}%"]);
            });
        }

        // Sort
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Fetch Data: Check if pagination is disabled
        if ($request->boolean('all')) {
            $resources = $query->get();
            $totalCount = $resources->count();
        } else {
            $resources = $query->paginate($request->get('per_page', 15));
            $totalCount = $resources->total(); // Get actual total, not just items on this page
        }

        // Transform the fetched resources
        $transformed = $resources->map(function ($resource) {
            return [
                'id'              => $resource->id,
                'name'            => $resource->name,
                'category'        => $resource->category ?? 'Uncategorized',
                'quantity'        => (float) $resource->quantity,
                'received'        => (float) $resource->received,
                'distributed'     => (float) $resource->distributed,
                'remaining'       => (float) $resource->quantity,
                'minimum_stock'   => (float) $resource->minimum_stock,
                'unit'            => $resource->unit,
                'status'          => $resource->status,
                'location'        => $resource->location 
                    ?? $resource->hospital?->name 
                    ?? 'Unknown Facility',
                'expiry_date'     => $resource->expiry_date?->format('M d, Y'),
                'is_critical'     => (bool) $resource->is_critical,
                'requires_cold_chain' => (bool) $resource->requires_cold_chain,
                'is_narcotic'     => (bool) $resource->is_narcotic,
                'is_high_value'   => (bool) $resource->is_high_value,
            ];
        });

        // Return the final transformed payload
        return response()->json([
            'resources' => $transformed,
            'total'     => $totalCount,
        ]);
    }

    // Calendar & History Endpoints
    public function calendarEvents(Request $request)
    {
        $query = StockMovement::with(['resource', 'performedBy'])
            ->select('stock_movements.*')
            ->join('resources', 'stock_movements.resource_id', '=', 'resources.id');
        
        // Filter by facility/location
        if ($request->has('location')) {
            $query->where('resources.location', $request->location);
        }
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('stock_movements.created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('stock_movements.created_at', '<=', $request->end_date);
        }
        
        // Filter by movement type
        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }
        
        $movements = $query->orderBy('stock_movements.created_at', 'desc')
                           ->get()
                           ->groupBy(function($movement) {
                               return $movement->created_at->format('Y-m-d');
                           });
        
        $events = [];
        foreach ($movements as $date => $dateMovements) {
            $events[] = [
                'date' => $date,
                'events' => $dateMovements->map(function($movement) {
                    return $this->formatCalendarEvent($movement);
                })->toArray()
            ];
        }
        
        return response()->json($events);
    }

    public function dateEvents(Request $request, $date)
    {
        $movements = StockMovement::with(['resource', 'performedBy'])
            ->whereDate('created_at', $date)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'date' => $date,
            'events' => $movements->map(function($movement) {
                return $this->formatCalendarEvent($movement);
            })->toArray()
        ]);
    }

    public function resourceHistory(Resource $resource)
    {
        $movements = $resource->stockMovements()
                              ->with('performedBy')
                              ->orderBy('created_at', 'desc')
                              ->get();
        
        return response()->json([
            'resource' => $resource,
            'history' => $movements
        ]);
    }

    public function stockMovements(Request $request)
    {
        $query = StockMovement::with(['resource', 'performedBy']);
        
        if ($request->has('resource_id')) {
            $query->where('resource_id', $request->resource_id);
        }
        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        
        $movements = $query->orderBy('created_at', 'desc')
                           ->paginate($request->get('per_page', 15));
        
        return response()->json($movements);
    }

    private function formatCalendarEvent(StockMovement $movement)
    {
        $eventTypes = [
            'in' => ['type' => 'stock_in', 'color' => 'green', 'icon' => '📥'],
            'out' => ['type' => 'stock_out', 'color' => 'red', 'icon' => '📤'],
            'adjustment' => ['type' => 'stock_adjustment', 'color' => 'blue', 'icon' => '⚙️']
        ];
        
        $typeConfig = $eventTypes[$movement->movement_type] ?? $eventTypes['adjustment'];
        
        return [
            'id' => $movement->id, 
            'type' => $typeConfig['type'],
            'resource' => $movement->resource->name,
            'quantity' => $movement->quantity,
            'previous_quantity' => $movement->previous_quantity,
            'new_quantity' => $movement->new_quantity,
            'facility' => $movement->resource->location,
            'reason' => $movement->reason,
            'performed_by' => $movement->performedBy ? $movement->performedBy->name : 'System',
            'performed_by_id' => $movement->performed_by, 
            'color' => $typeConfig['color'],
            'icon' => $typeConfig['icon'],
            'timestamp' => $movement->created_at->toISOString()
        ];
    }

    public function updateStockMovement(Request $request, $id)
    {
        try {
            \Log::info('Updating stock movement', [
                'id' => $id,
                'request_data' => $request->all(),
                'auth_user' => auth()->user()
            ]);

            $validated = $request->validate([
                'quantity' => 'required|numeric',
                'reason' => 'required|string|max:255',
                'performed_by' => 'sometimes|string', 
                'performed_by_id' => 'required|exists:users,id',
            ]);

            $stockMovement = StockMovement::findOrFail($id);
            
            \Log::info('Found stock movement to update', [
                'current_movement' => $stockMovement->toArray()
            ]);

            $stockMovement->update([
                'quantity' => $validated['quantity'],
                'reason' => $validated['reason'],
                'performed_by' => $validated['performed_by_id'],
            ]);

            \Log::info('Stock movement updated successfully', [
                'updated_movement' => $stockMovement->fresh()->toArray()
            ]);

            return response()->json([
                'message' => 'Stock movement updated successfully',
                'stock_movement' => $stockMovement->fresh()->load(['resource', 'performedBy'])
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating stock movement: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Failed to update stock movement',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

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

    public function show(Resource $resource)
    {
        return response()->json([
            'resource' => $resource->load(['hospital']),
        ]);
    }

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

    public function destroy(Resource $resource)
    {
        $resource->delete();

        return response()->json([
            'message' => 'Resource deleted successfully',
        ]);
    }

    public function lowStock()
    {
        $resources = Resource::with('hospital')
            ->lowStock()
            ->get();

        return response()->json($resources);
    }

    public function critical()
    {
        $resources = Resource::with('hospital')
            ->whereRaw('is_critical = true')
            ->lowStock()
            ->get();

        return response()->json($resources);
    }

    public function expiring(Request $request)
    {
        $days = (int) $request->get('days', 30);

        $resources = Resource::with('hospital')
            ->expiringSoon($days)
            ->get();

        return response()->json($resources);
    }

    public function adjustStock(Request $request, $id)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric',
            'type' => 'required|in:add,remove',
            'reason' => 'nullable|string',
        ]);

        try {
            $resource = Resource::findOrFail($id);
            
            $quantity = (float) $validated['quantity'];

            Log::info("Adjusting stock for resource {$id}", [
                'type' => $validated['type'],
                'adjustment_quantity' => $quantity,
                'current_quantity' => $resource->quantity,
                'current_received' => $resource->received,
            ]);

            switch ($validated['type']) {
                case 'add':
                    // Add to existing quantity
                    $resource->quantity = $resource->quantity + $quantity;
                    $resource->received = $resource->received + $quantity;
                    break;
                case 'remove':
                    // Subtract from quantity
                    $resource->quantity = max(0, $resource->quantity - $quantity);
                    $resource->distributed = $resource->distributed + $quantity;
                    break;
                case 'set':
                    // Set exact quantity
                    $resource->quantity = $quantity;
                    break;
            }
            
            $resource->save();
            $resource->refresh();
            $resource->updateStatus();

            Log::info("Stock adjusted successfully", [
                'new_quantity' => $resource->quantity,
                'new_received' => $resource->received,
            ]);

            return response()->json([
                'message' => 'Stock adjusted successfully',
                'resource' => $resource->fresh()->load('hospital'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}