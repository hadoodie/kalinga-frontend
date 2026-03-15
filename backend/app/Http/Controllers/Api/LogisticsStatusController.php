<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request as HttpRequest;
use App\Models\Request as SupplyRequest;
use App\Models\Allocation;
use App\Events\LogisticsStatusUpdated;
use Illuminate\Support\Facades\DB;

class LogisticsStatusController extends Controller
{
    public function updateStatus(HttpRequest $httpRequest, $id)
    {
        $validated = $httpRequest->validate([
            "status" => "required|string|in:under_review,matched,allocated,in_transit,delivered,verified,archived,failed,rejected"
        ]);

        return DB::transaction(function () use ($validated, $id) {
            $supplyRequest = SupplyRequest::findOrFail($id);
            $newStatus = $validated["status"];

            $supplyRequest->update([
                "status" => $newStatus
            ]);

            // Sync Allocation status if applicable
            $allocation = Allocation::where("request_id", $id)->latest()->first();
            if ($allocation) {
                // Determine allocation status mapping
                $allocStatus = $newStatus;

                // Some mappings if necessary
                if ($newStatus === "allocated") $allocStatus = "confirmed";
                if ($newStatus === "matched") $allocStatus = "planned";

                $allocation->update([
                    "status" => $allocStatus
                ]);
            }

            $modelData = $supplyRequest->toArray();
            if ($allocation) {
                $modelData["allocation"] = $allocation->load(["allocationVehicles", "sourceHospital", "destinationHospital"])->toArray();
            }

            // Fire Reverb Event
            event(new LogisticsStatusUpdated($modelData));

            return response()->json([
                "success" => true,
                "message" => "Status transitioned to " . $newStatus,
                "data" => $modelData
            ]);
        });
    }
}