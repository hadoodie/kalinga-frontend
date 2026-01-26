<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function available(Request $request)
    {
        $handling = $request->query('handling_class', 'general');

        $query = Asset::where('status', 'Operational'); 

        if ($handling === 'cold_chain') {
            $query->whereJsonContains('capabilities', 'ColdChain');
        } elseif ($handling === 'narcotics') {
            $query->whereJsonContains('capabilities', 'Narcotics');
        } elseif ($handling === 'high_value') {
            $query->whereJsonContains('capabilities', 'HighValue');
        }
       

        return response()->json([
            'data' => $query->orderBy('plate_number')->get()
        ]);
    }

public function index(Request $request)
{
    $query = Asset::query();

    // Search (Postgres ILIKE)
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->whereRaw('asset_code ILIKE ?', ["%$search%"])
              ->orWhereRaw('type ILIKE ?', ["%$search%"])
              ->orWhereRaw('plate_number ILIKE ?', ["%$search%"])
              ->orWhereRaw('location ILIKE ?', ["%$search%"]);
        });
    }

    // Filters
    if ($request->filled('status')) {
        $status = $request->status === 'available' ? 'Operational' : $request->status;
        $query->where('status', $status);
    }
    if ($request->filled('category')) $query->where('category', $request->category);
    if ($request->filled('location')) $query->where('location', $request->location);

    // Capabilities filter
    if ($request->filled('capabilities')) {
        $query->whereJsonContains('capabilities', $request->capabilities);
    }

    $assets = $query->get();

    return response()->json($assets->map(function ($asset) {
        return [
            'id'           => $asset->asset_code,
            'name'         => $asset->type,
            'category'     => $asset->category,
            'location'     => $asset->location,
            'status'       => $asset->status === 'Standby' ? 'Operational' : $asset->status,
            'personnel'    => $asset->personnel,
            'fuelLevel'    => (int) $asset->current_fuel_level,
            'value'        => $asset->value ? '$' . number_format($asset->value, 0) : null,
            'year'         => $asset->year,
            'plateNumber'  => $asset->plate_number,
            'condition'    => $asset->condition,
            'nextMaintenance' => $asset->next_maintenance,
            'capabilities' => $asset->capabilities,
            'temperatureControl' => $asset->capabilities && in_array('temperature_control', $asset->capabilities),
        ];
    }));
}



        public function show($code)
        {
            $asset = Asset::where('asset_code', $code)->firstOrFail();

            return response()->json([
                'id'           => $asset->asset_code,
                'name'         => $asset->type,
                'category'     => $asset->category,
                'capacity'     => $asset->capacity,
                'status'       => $asset->status === 'Standby' ? 'Operational' : $asset->status,
                'location'     => $asset->location,
                'personnel'    => $asset->personnel,
                'plateNumber'  => $asset->plate_number,
                'manufacturer' => $asset->manufacturer,
                'model'        => $asset->model,
                'year'         => $asset->year,
                'fuelLevel'    => (int) $asset->current_fuel_level,
                'mileage'      => $asset->mileage,
                'value'        => $asset->value ? '$' . number_format($asset->value, 0) : null,
                'purchaseDate'  => $asset->purchase_date?->format('Y-m-d'),
                'condition'    => $asset->condition,
                'capabilities' => $asset->capabilities,
                'lastMaintenance' => $asset->last_maintenance,
                'nextMaintenance' => $asset->next_maintenance,
            ]);
        }

        public function store(Request $request)
        {
            $asset = Asset::create($request->all());
            
            return response()->json([
                'id'     => $asset->asset_code,
                'name'   => $asset->type,
                'status' => $asset->status === 'Standby' ? 'Operational' : $asset->status,
               
            ], 201);
        }

  
        public function update(Request $request, $code)
        {
            $asset = Asset::where('asset_code', $code)->firstOrFail();
            $asset->update($request->all());

            return response()->json([
                'id'   => $asset->asset_code,
                'name' => $asset->type,
                'status' => $asset->status === 'Standby' ? 'Operational' : $asset->status,
            ]);
        }

        public function destroy($code)
        {
            $asset = Asset::where('asset_code', $code)->firstOrFail();
            $asset->delete();

            return response()->json(['message' => 'Asset deleted']);
        }

        public function metrics()
        {
            $total = Asset::count();

            $active = Asset::whereIn('status', ['Operational', 'Standby'])->count();

            $underRepair = Asset::where('status', 'Under Repair')->count();

            // Optional: assets not assigned to any allocation (if you have allocation table)
            $unassigned = Asset::whereDoesntHave('allocations')->count(); // or your logic

            return response()->json([
                'total_assets'         => $total,
                'active_assets'        => $active,
                'vehicles_under_repair'=> $underRepair,
                'assets_unassigned'    => $unassigned,
            ]);
        }


                public function adjustStock(Request $request, $code)
        {
            $asset = Asset::where('asset_code', $code)->firstOrFail();

            $request->validate([
                'quantity' => 'required|integer',
                'reason'   => 'required|string',
                'type'     => 'required|in:add,remove', // or 'adjustment'
            ]);

   
            StockMovement::create([
                'asset_id' => $asset->id,
                'quantity' => $request->type === 'remove' ? -$request->quantity : $request->quantity,
                'reason'   => $request->reason,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Stock adjusted successfully',
                'asset'   => $asset->fresh()
            ]);
        }
   
        public function exportCsv()
        {
            $assets = Asset::all();
            $csv = "Asset Code,Name,Category,Status,Location,Fuel Level,Next Maintenance\n";
            foreach ($assets as $a) {
                $csv .= "\"{$a->asset_code}\",\"{$a->type}\",\"{$a->category}\",\"{$a->status}\",\"{$a->location}\",\"{$a->current_fuel_level}%\",\"{$a->next_maintenance}\"\n";
            }

            return response($csv)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="assets-'.date('Y-m-d').'.csv"');
        }
}