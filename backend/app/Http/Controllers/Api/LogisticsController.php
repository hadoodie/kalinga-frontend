<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\Asset;
use App\Models\Responder;
use App\Models\AllocationVehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogisticsController extends Controller
{
    public function suggestVehicle(Allocation $allocation)
    {
        $handlingClass = $allocation->handling_class ?? 'General';
        $sourceCoords = $allocation->sourceHospital->coordinates;

        $vehicle = Asset::query()
            ->where('status', 'Operational')
            ->whereJsonContains('capabilities', $handlingClass)
            ->selectRaw("*, ST_Distance(coordinates, ?) as distance_km", [$sourceCoords])
            ->orderBy('distance_km')
            ->first();

        return response()->json($vehicle ?? ['message' => 'No vehicle found']);
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
    $sourceCoords = $allocation->sourceHospital->coordinates;

    $query = Asset::query()
        ->where('status', 'Operational')
        ->selectRaw("*, ST_Distance(coordinates, ?) as distance_km", [$sourceCoords]);

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

        return response()->json(['data' => $query->get()]);
    }

    public function assignLogistics(Request $request, Allocation $allocation)
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'responder_id' => 'nullable|exists:responders,id'
        ]);

        AllocationVehicle::create([
            'allocation_id' => $allocation->id,
            'asset_id' => $request->asset_id,
            'responder_id' => $request->responder_id,
            'assigned_by' => auth()->id(),
            'assigned_at' => now(),
            'notes' => $request->notes
        ]);

        $allocation->update(['status' => 'logistics_assigned']);

        if ($request->responder_id) {
            Responder::where('id', $request->responder_id)->update(['current_asset_id' => $request->asset_id]);
        }

return response()->json([
        'success' => true,
        'message' => 'Logistics assigned successfully',
        'allocation' => $allocation->fresh(),
        'next_phase' => 'Live Tracking'
    ]);    }
}