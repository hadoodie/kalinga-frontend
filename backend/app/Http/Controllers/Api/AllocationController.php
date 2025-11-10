<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AllocationRequest;
use App\Models\Hospital; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AllocationController extends Controller
{
    /**
     * Get all active requests made BY hospitals (for the "Incoming" tab)
     */
    public function getIncomingRequests()
    {
        return AllocationRequest::whereNotNull('requester_hospital_id') // From a hospital
            ->whereNotIn('status', ['Delivered', 'Cancelled'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all active requests made by the logged-in user (for the "Track My Requests" tab)
     */
    public function getOutgoingRequests()
    {
        return Auth::user()->outgoingAllocationRequests()
            ->whereNotIn('status', ['Delivered', 'Cancelled'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
    
    /**
     * Get completed/cancelled requests (for the "History" modal)
     */
    public function getHistory()
    {
        $user = Auth::user();
        // Show history for requests the user either made OR handled
        return AllocationRequest::whereIn('status', ['Delivered', 'Cancelled'])
            ->where(function($query) use ($user) {
                $query->where('requester_user_id', $user->id)
                      ->orWhere('handler_id', $user->id);
            })
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    /**
     * Create a new OUTGOING request (from the modal)
     */
    public function createRequest(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'destination_hospital' => 'required|string|max:255',
            'item_name' => 'required|string|max:255',
            'item_quantity' => 'required|integer|min:1',
            'request_type' => 'required|string|in:resources,ambulance,blood,organs',
            'urgency' => 'required|string|in:Low,Medium,High,Critical',
        ]);

        // Find the hospital model to get its contact info
        $hospital = Hospital::where('name', $validated['destination_hospital'])->first();

        $newRequest = AllocationRequest::create([
            'request_id' => 'S-' . (AllocationRequest::max('id') + 1001), 
            'requester_user_id' => $user->id, 
            'source_location' => $user->address ?? 'Logistics HQ', 
            'destination_hospital' => $validated['destination_hospital'],
            'item_name' => $validated['item_name'],
            'item_quantity' => $validated['item_quantity'],
            'request_type' => $validated['request_type'],
            'urgency' => $validated['urgency'],
            'status' => 'Pending',
            'contact_info' => $hospital->contact_number ?? null,
            'tracking_history' => [[
                'status' => 'Pending',
                'time' => Carbon::now(),
                'details' => 'Request submitted to ' . $validated['destination_hospital']
            ]],
        ]);
        
        return response()->json($newRequest, 201);
    }
    
    /**
     * Update the status of an INCOMING request
     */
    public function updateIncomingStatus(Request $request, $id)
    {
        $user = Auth::user();
        $allocation = AllocationRequest::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:Approved,Packed,Shipped,On-the-Way,Delivered,Cancelled',
            'rejection_reason' => 'required_if:status,Cancelled|nullable|string|max:1000',
        ]);

        $allocation->status = $validated['status'];
        $allocation->handler_id = $user->id; // Track who handled it
        
        if ($validated['status'] === 'Cancelled') {
            $allocation->rejection_reason = $validated['rejection_reason'];
        }
        
        // TODO: Add logic here to update tracking_history
        
        $allocation->save();
        
        return response()->json($allocation);
    }

    /**
     * Get all active shipments for the Supply Tracking page.
     */
    public function getSupplyTracking()
    {
        // Fetch all requests that are part of the active supply chain
        $active_statuses = ['Approved', 'Packed', 'Shipped', 'On-the-Way', 'Delivered'];

        $shipments = AllocationRequest::whereIn('status', $active_statuses)
            ->orderBy('eta', 'asc') // Order by ETA
            ->get();

        $formattedShipments = $shipments->map(function($req) {
            $now = Carbon::now();
            $status = $req->status;

            // Automatically mark as Delayed if ETA is in the past and not yet delivered
            if ($req->eta && Carbon::parse($req->eta)->isPast() && $req->status != 'Delivered') {
                $status = 'Delayed';
            }
            
            // Standardize the route description
            $source = $req->source_location; 
            $destination = $req->destination_hospital ?? 'Logistics HQ'; 

            return [
                'id' => $req->request_id,
                'route' => $source . ' → ' . $destination,
                'eta' => $req->eta,
                'status' => $status,
                'contents' => $req->item_name . ' (Qty: ' . $req->item_quantity . ')',
                'lastPing' => Carbon::parse($req->updated_at)->diffForHumans(),
                'priority' => $req->urgency,
                'location' => [$req->current_location_lat, $req->current_location_lng],
            ];
        });

        return response()->json($formattedShipments);
    }
}