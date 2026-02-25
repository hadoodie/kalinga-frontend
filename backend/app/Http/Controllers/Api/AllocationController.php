<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as SupplyRequest;
use App\Models\Allocation;
use App\Models\Resource;
use App\Models\Asset;
use App\Models\Responder;
use App\Models\Hospital;
use App\Models\AuditLog;
use App\Models\NotificationLog;
use App\Models\AllocationVehicle;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AllocationController extends Controller
{

public function index(Request $request)
{
    $query = Allocation::with([
        'request.hospital',
        'request.resource',
        'sourceHospital',
        'destinationHospital'
    ]);

    // Filter by source hospital (for release requests tab)
    if ($request->filled('source_hospital_id')) {
        $query->where('source_hospital_id', $request->source_hospital_id);
    }

    // Filter by destination hospital
    if ($request->filled('destination_hospital_id')) {
        $query->where('destination_hospital_id', $request->destination_hospital_id);
    }

    // Filter by status
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    return $query->orderBy('created_at', 'desc')->get();
}


public function show($id)
{
    $allocation = Allocation::with([
        'request',
        'sourceHospital',
        'destinationHospital',
        'allocationVehicles.asset',         
        'allocationVehicles.responder.user',  
        'allocationVehicles.assignedByUser'
    ])
    ->findOrFail($id);

    return response()->json($allocation);
}


public function myAllocations()
{
    return Allocation::with([
        'request.hospital',
        'sourceHospital',
        'destinationHospital',
        'request',
        'allocationVehicles.asset',
        'allocationVehicles.responder.user' 
    ])
    ->where('created_by', auth()->id())
    ->orWhereIn('status', ['planned', 'confirmed', 'logistics_assigned'])
    ->latest()
    ->get();
}

    // 1. Suggest Matches
public function suggestions($requestId)
{
    $request = SupplyRequest::with('hospital')->findOrFail($requestId);

    // Safety check: hospital must exist and have coordinates
    if (!$request->hospital || !$request->hospital->latitude || !$request->hospital->longitude) {
        return response()->json(['error' => 'Request hospital has no coordinates'], 422);
    }

    $destLat      = $request->hospital->latitude;
    $destLng      = $request->hospital->longitude;
    $requiredQty  = $request->quantity;
    $handling     = $request->handling_class;   
    $resourceName = $request->resource_name;

    $query = Resource::select([
            'resources.id as resource_id',
            'resources.hospital_id',
            'resources.quantity as available_quantity',
            'resources.requires_cold_chain',
            'resources.is_high_value',
            'resources.is_narcotic',
            'hospitals.name as hospital_name',
            'hospitals.latitude',
            'hospitals.longitude',
            DB::raw("(6371 * acos(
                cos(radians(?)) * cos(radians(hospitals.latitude)) *
                cos(radians(hospitals.longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(hospitals.latitude))
            ))::numeric(10,2) AS distance_km")
        ])
        ->setBindings([$destLat, $destLng, $destLat])
        ->join('hospitals', 'resources.hospital_id', '=', 'hospitals.id')
        ->where('resources.name', $resourceName)
        ->where('resources.quantity', '>=', $requiredQty)
        ->where('resources.hospital_id', '!=', $request->hospital_id);

    // Handling class filter based on flags
    $query->where(function ($q) use ($handling) {
        if ($handling === 'Cold Chain') {
            $q->where('resources.requires_cold_chain', true);
        } elseif ($handling === 'High-Value') {
            $q->where('resources.is_high_value', true);
        } elseif ($handling === 'Narcotics') {
            $q->where('resources.is_narcotic', true);
        } else {
            // General: no special flag required
        }
    });

    // Distance filter (use WHERE instead of HAVING in Postgres)
    $query->whereRaw("(6371 * acos(
        cos(radians(?)) * cos(radians(hospitals.latitude)) *
        cos(radians(hospitals.longitude) - radians(?)) +
        sin(radians(?)) * sin(radians(hospitals.latitude))
    )) < 500", [$destLat, $destLng, $destLat]);

    $suggestions = $query
        ->orderBy('distance_km')
        ->get()
        ->map(function ($res) use ($request) {
            // Derive handling class display from flags
            if ($res->requires_cold_chain) {
                $display = 'Cold Chain';
            } elseif ($res->is_high_value) {
                $display = 'High-Value';
            } elseif ($res->is_narcotic) {
                $display = 'Narcotics';
            } else {
                $display = 'General';
            }

            return [
                'resource_id'        => $res->resource_id,
                'hospital_id'        => $res->hospital_id,
                'hospital_name'      => $res->hospital_name,
                'available_quantity' => $res->available_quantity,
                'distance_km'        => (float) $res->distance_km,
                'handling_class'     => $display,
                'can_fulfill'        => $res->available_quantity >= $request->quantity,
            ];
        });

    return response()->json($suggestions);
}


    // 2. Store Request Create Allocation
public function store(Request $request)
{
    $data = $request->validate([
        'request_id'         => 'required|exists:requests,id',
        'source_hospital_id' => 'required|exists:hospitals,id',
        'quantity'           => 'required|numeric|min:0.0001',
        'handling_class'     => 'required|in:General,Cold Chain,Narcotics,High-Value',
    ]);

    $originalRequest = \App\Models\Request::findOrFail($data['request_id']);

    $dbClass = match ($data['handling_class']) {
        'Cold Chain' => 'Cold Chain',
        'High-Value' => 'High-Value',
        'Narcotics'  => 'Narcotics',
        default      => 'General',
    };

    $allocation = Allocation::create([
        'request_id'              => $data['request_id'],
        'source_hospital_id'      => $data['source_hospital_id'],
        'destination_hospital_id' => $originalRequest->hospital_id,
        'resource_type'           => $originalRequest->resource_name,
        'quantity'                => $data['quantity'],
        'handling_class'          => $dbClass,
        'status'                  => 'planned',
        'created_by'              => auth()->id(),
    ]);

    $allocation->load([
        'request.hospital',
        'sourceHospital',
        'destinationHospital',
        'request'
    ]);

    AuditLog::create([
        'user_id'        => auth()->id(),
        'action'         => 'CREATE_ALLOCATION',
        'description'    => "Allocation #{$allocation->id} created",
        'auditable_type' => Allocation::class,
        'auditable_id'   => $allocation->id,
    ]);

    return response()->json(
    $allocation->load([
        'request.hospital',
        'sourceHospital',
        'destinationHospital',
        'request.resource'
    ]),
    201
);
}

    // 3. Confirm Allocation
public function confirm($id)
{
    $allocation = Allocation::findOrFail($id);
    
    // Check if it's planned
    if ($allocation->status !== 'planned') {
        return response()->json(['error' => 'Only planned allocations can be confirmed'], 422);
    }

    // Update to 'confirmed' NOT 'logistics_assigned'
    $allocation->update([
        'status'       => 'confirmed', 
        'confirmed_by' => auth()->id(),
        'confirmed_at' => now(),
    ]);

    // Refresh and return
    $allocation->refresh();
    $allocation->load(['request.hospital', 'sourceHospital', 'destinationHospital', 'request']);
    
    return response()->json($allocation);
}


    // 4. Assign Logistics (Phase 3 trigger)
public function assign(Request $request, Allocation $allocation)
{
    // PHASE 3: Only confirmed allocations can be assigned
    if ($allocation->status !== 'confirmed') {
        return response()->json([
            'error' => 'Only confirmed allocations can be assigned.'
        ], 422);
    }

    $request->validate([
        'asset_id'     => 'required|exists:assets,id',
        'responder_id' => 'required|exists:responders,id',
    ]);

    return DB::transaction(function () use ($request, $allocation) {
        $asset     = Asset::findOrFail($request->asset_id);
        $responder = Responder::findOrFail($request->responder_id);

        // 1. Asset must be available
        if (!in_array($asset->status, ['Operational', 'Standby'])) {
            return response()->json(['error' => 'Selected vehicle is not available.'], 422);
        }

        // 2. Responder must be available
        if ($responder->status !== 'Available' || $responder->current_asset_id !== null) {
            return response()->json(['error' => 'Selected responder is not available.'], 422);
        }

        // 3. Capability matching (this is the heart of Phase 3)
        $requiredCapability = match ($allocation->handling_class) {
            'HighValue'  => 'high_value',
            'ColdChain'  => 'cold_chain',
            'Narcotics'  => 'narcotics',
            default      => 'general',
        };

        $assetCapabilities = array_map('strtolower', $asset->capabilities ?? []);
        $requiredCapability = match ($allocation->handling_class) {
            'HighValue'  => 'high_value',
            'ColdChain'  => 'cold_chain',
            'Narcotics'  => 'narcotics',
            default      => 'general',
        };

        if (!in_array($requiredCapability, $assetCapabilities)) {
            return response()->json([
                'error' => "Vehicle does not have required capability: {$requiredCapability}"
            ], 422);
        }

        // 4. Update allocation
        $allocation->update([
            'status'      => 'logistics_assigned',
            'assigned_at' => now(),
            'assigned_by' => auth()->id(),
        ]);

        // 5. Create pivot record 
        AllocationVehicle::create([
            'allocation_id' => $allocation->id,
            'asset_id'      => $asset->id,
            'responder_id'  => $responder->id,
            'assigned_by'   => auth()->id(), 
            'assigned_at' => now(),
        ]);

        // 6. Update asset & responder status 
        $asset->update(['status' => 'Standby']); 
        $responder->update([
            'status'          => 'On Duty',
            'current_asset_id' => $asset->id,
        ]);

        // 7. Audit log
        \App\Models\AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'ASSIGN_LOGISTICS',
            'details'        => "Assigned vehicle {$asset->plate_number} and responder {$responder->full_name} to allocation #{$allocation->id}",
            'auditable_type' => Allocation::class,
            'auditable_id'   => $allocation->id,
        ]);

        // 8. FINAL RETURN 
        $allocation->refresh(); 
        $allocation->load(['allocationVehicles.asset', 'allocationVehicles.responder']);

        return response()->json([
            'message'    => 'Logistics assigned successfully!',
            'allocation' => [
                'id'             => $allocation->id,
                'status'         => $allocation->status,
                'handling_class' => $allocation->handling_class,
                'assigned_at'    => $allocation->assigned_at,
                'vehicle'        => [
                    'id'           => $allocation->allocationVehicles->first()->asset->id ?? null,
                    'plate_number' => $allocation->allocationVehicles->first()->asset->plate_number ?? null,
                    'type'         => $allocation->allocationVehicles->first()->asset->type ?? null,
                    'capabilities' => $allocation->allocationVehicles->first()->asset->capabilities ?? null,
                ],
                'responder'      => [
                    'id'             => $allocation->allocationVehicles->first()->responder->id ?? null,
                    'full_name'      => $allocation->allocationVehicles->first()->responder->full_name ?? null,
                    'contact_number' => $allocation->allocationVehicles->first()->responder->contact_number ?? null,
                ],
            ]
        ], 200);
    });
}


public function assignment($id)
{
    $allocation = Allocation::with([
        'allocationVehicle.asset',      
        'allocationVehicle.responder'   
    ])->findOrFail($id);

    if (!$allocation->allocationVehicle) {
        return response()->json(['vehicle' => null, 'responder' => null]);
    }

    $asset     = $allocation->allocationVehicle->asset;
    $responder = $allocation->allocationVehicle->responder;

    return response()->json([
        'vehicle' => $asset ? [
            'id'                => $asset->id,
            'plate_number'      => $asset->plate_number,
            'asset_code'        => $asset->asset_code,
            'type'              => $asset->type,
            'model'             => $asset->model ?? 'N/A',
            'category'          => $asset->category,
            'manufacturer'      => $asset->manufacturer ?? 'N/A',
            'year_manufactured' => $asset->year_manufactured,
            'capacity'          => $asset->capacity,
            'location'          => $asset->location ?? 'Not specified',
            'status'            => ucfirst(str_replace('_', ' ', $asset->status)),
            'condition'         => $asset->condition ?? 'Excellent',
            'condition_rating'  => $asset->condition_rating ?? 85, 
            'capabilities'      => $asset->capabilities, 
            'last_maintenance'  => $asset->last_maintenance,
            'next_maintenance'  => $asset->next_maintenance,
        ] : null,

        'responder' => $responder ? [
            'id'                   => $responder->id,
            'responder_code'       => $responder->responder_code,
            'full_name'            => $responder->full_name,
            'contact_number'       => $responder->contact_number,
            'email'                => $responder->user?->email ?? 'N/A',
            'license_number'       => $responder->license_number ?? 'Not provided',
            'years_experience'     => $responder->years_experience ?? 5,
            'status'               => ucfirst(str_replace('_', ' ', $responder->status)),
            'handling_capabilities'=> $responder->handling_capabilities,
            'certifications'       => $responder->certifications ?? [],
        ] : null,
    ]);
}




    private function normalizeCapability(string $handlingClass): string
    {
        return match ($handlingClass) {
            'Cold Chain' => 'cold_chain',
            'Narcotics'  => 'narcotics',
            'High-Value' => 'high_value',
            default      => 'general',
        };
    }


    // 5. BULK CREATE (from CoordinationPanel)
   public function bulkCreate(Request $request)
{
    $request->validate([
        'allocations' => 'required|array',
        'allocations.*.request_id'          => 'required|exists:requests,id',
        'allocations.*.source_hospital_id'  => 'required|exists:hospitals,id',
        'allocations.*.quantity'            => 'required|numeric|min:0.0001',
        'allocations.*.handling_class'      => 'required|in:General,Cold Chain,Narcotics,High-Value',
    ]);

    $created = [];

    foreach ($request->allocations as $item) {
        $req = SupplyRequest::findOrFail($item['request_id']);

        // Rule: source ≠ destination
        if ($req->hospital_id == $item['source_hospital_id']) {
            continue; // or throw error
        }

        $dbClass = match ($item['handling_class']) {
            'Cold Chain' => 'Cold Chain',
            'High-Value' => 'High-Value',
            'Narcotics'  => 'Narcotics',
            default      => 'General',
        };

        $allocation = Allocation::create([
            'request_id'              => $item['request_id'],
            'source_hospital_id'      => $item['source_hospital_id'],
            'destination_hospital_id' => $req->hospital_id,
            'resource_type'           => $req->resource_name,
            'quantity'                => $item['quantity'],
            'handling_class'          => $dbClass,
            'status'                  => 'planned',
            'created_by'              => auth()->id(),
        ]);

        $this->notifyAllocationCreated($allocation);

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'BULK_CREATE_ALLOCATION',
            'description'    => "Bulk allocation #{$allocation->id} created",
            'auditable_type' => Allocation::class,
            'auditable_id'   => $allocation->id,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
        ]);

        $created[] = $allocation;
    }

return response()->json(
    $allocation->load([
        'request.hospital',
        'sourceHospital',
        'destinationHospital',
        'request.resource'
    ]),
    201
);



}

    // 6. Reject Suggestion 
    public function rejectSuggestion($allocationId)
    {
        $allocation = Allocation::findOrFail($allocationId);
        $allocation->delete();
        return response()->json(['message' => 'Suggestion rejected']);
    }
    

// ---------------------------------------------------------
// LOGISTICS SUGGESTIONS (VEHICLES & RESPONDERS)
// ---------------------------------------------------------


public function suggestVehicle(Allocation $allocation)
{
    $lat = $allocation->sourceHospital->latitude;
    $lng = $allocation->sourceHospital->longitude;
    $handlingClass = $allocation->handling_class ?? 'General';

    $vehicle = Asset::query()
        ->where('status', 'Operational')
        ->whereJsonContains('capabilities', $handlingClass)
        ->selectRaw("
            *, 
            (6371 * acos(
                cos(radians(?)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(?)) + 
                sin(radians(?)) * sin(radians(latitude))
            )) as distance_km
        ", [$lat, $lng, $lat])
        ->orderBy('distance_km')
        ->first();

    return response()->json($vehicle);
}


public function suggestResponder(Allocation $allocation)
{
    $handlingClass = $allocation->handling_class ?? 'General';

    $responder = Responder::query()
        ->where('status', 'Available')
        ->whereNull('current_asset_id')
        ->whereJsonContains('handling_capabilities', $handlingClass)
        ->with('homeDepot')
        ->inRandomOrder()
        ->first();

    return response()->json($responder ?? null);
}


public function availableVehicles(Allocation $allocation, Request $request)
{
    $lat = $allocation->sourceHospital->latitude;
    $lng = $allocation->sourceHospital->longitude;

    $query = Asset::query()
        ->where('status', 'Operational')
        ->selectRaw("
            *, 
            (6371 * acos(
                cos(radians(?)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(?)) + 
                sin(radians(?)) * sin(radians(latitude))
            )) as distance_km
        ", [$lat, $lng, $lat]);

    if ($request->capability) {
        $query->whereJsonContains('capabilities', $request->capability);
    }

    $vehicles = $query->orderBy('distance_km')->get();

    return response()->json([
        'data' => $vehicles,
        'meta' => ['total' => $vehicles->count()]
    ]);
}


public function availableResponders(Allocation $allocation, Request $request)
{
    $query = Responder::query()
        ->where('status', 'Available')
        ->whereNull('current_asset_id');

    if ($request->capability) {
        $query->whereJsonContains('handling_capabilities', $request->capability);
    }

    return response()->json([
        'data' => $query->get()
    ]);
}

public function assignmentDetails($id)
{
    $allocation = Allocation::with([
        'request.resource',
        'sourceHospital',
        'destinationHospital',
        'allocationVehicles.asset',
        'allocationVehicles.responder.user',           // ← GIVES YOU EMAIL, PHOTO, ADDRESS, CITY, ZIP
        'allocationVehicles.assignedByUser'
    ])
    ->findOrFail($id);

    return response()->json([
        'success' => true,
        'data' => $allocation
    ]);
}

public function pendingCount()
{
    $count = Request::where('status', 'pending')->count();
    return response()->json(['count' => $count]);
}

public function myAllocationsCount()
{
    $userId = auth()->id();
    
    $counts = Allocation::where('created_by', $userId)
        ->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'logistics_assigned' THEN 1 ELSE 0 END) as logistics_assigned,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned
        ")
        ->first();
    
    return response()->json($counts);
}

public function showWithDetails($id)
{
    $allocation = Allocation::with([
        'sourceHospital',
        'destinationHospital',
        'request',
        'allocationVehicles.asset',
        'allocationVehicles.responder.user',
        'allocationVehicles.assignedBy'
    ])->findOrFail($id);
    
    return response()->json($allocation);
}

}