<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request;
use App\Models\Resource;
use App\Models\AuditLog;
use Illuminate\Http\Request as HttpRequest;  
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class RequestController extends Controller
{
    use AuthorizesRequests;  
 
public function index(HttpRequest $request)
{
    $user = Auth::user();

   
    if ($user->role === 'logistics') {
        $query = Request::with(['hospital', 'resource', 'creator'])->latest();
    } 
   
    else {
        $query = Request::with(['hospital', 'resource', 'creator'])
            ->myHospital()
            ->latest();
    }

    if ($request->status) {
        $query->where('status', $request->status);
    }
    if ($request->urgency) {
        $query->where('urgency_level', $request->urgency);
    }

    $requests = $request->boolean('all')
        ? $query->get()
        : $query->paginate(15);

    return response()->json($requests);
}


    public function store(HttpRequest $request)
    {
        $validated = $request->validate([
            'resource_id'     => 'required|exists:resources,id',
            'quantity'        => 'required|integer|min:1',
            'urgency_level'   => 'required|in:Low,Medium,High,Critical',
            'handling_class'  => 'required|in:General,ColdChain,Narcotics,HighValue',
            'reason'          => 'nullable|string|max:1000',
        ]);

        $resource = Resource::findOrFail($validated['resource_id']);

        return DB::transaction(function () use ($validated, $resource) {
            $hospitalId = Auth::user()->hospitals()->first()?->id;

            $req = Request::create([
                'hospital_id'     => $hospitalId,  
                'resource_id'     => $resource->id,
                'resource_name'   => $resource->name,
                'quantity'        => $validated['quantity'],
                'urgency_level'   => $validated['urgency_level'],
                'handling_class'  => $validated['handling_class'],
                'reason'          => $validated['reason'],
                'status'          => 'pending', // lowercase
                'created_by'      => Auth::id(),
                'meta'            => ['source' => 'hospital_portal'],
            ]);

            AuditLog::create([
                'action'     => 'request_submitted',
                'auditable_type' => Request::class,
                'auditable_id'   => $req->id,
                'user_id'    => Auth::id(),
                'details'    => "Submitted request for {$resource->name} x{$validated['quantity']}"
            ]);

            return response()->json([
                'message'  => 'Request submitted successfully',
                'request'  => $req->load(['resource', 'hospital', 'creator'])
            ], 201);
        });
    }

public function storeDraft(HttpRequest $request)    {
        $validated = $request->validate([
            'resource_id'     => 'required|exists:resources,id',
            'quantity'        => 'required|integer|min:1',
            'urgency_level'   => 'required|in:Low,Medium,High,Critical',
            'handling_class'  => 'required|in:General,ColdChain,Narcotics,HighValue',
            'reason'          => 'nullable|string|max:1000',
        ]);

        $resource = Resource::findOrFail($validated['resource_id']);

        $draft = Request::create([
            'hospital_id' => Auth::user()->hospitals()->first()?->id,
            'resource_id'     => $resource->id,
            'resource_name'   => $resource->name,
            'quantity'        => $validated['quantity'],
            'urgency_level'   => $validated['urgency_level'],
            'handling_class'  => $validated['handling_class'],
            'reason'          => $validated['reason'],
            'status'          => 'draft',
            'created_by'      => Auth::id(),
        ]);

        return response()->json([
            'message'  => 'Draft saved',
            'request'  => $draft->load('resource')
        ], 201);
    }

public function updateDraft(HttpRequest $request, Request $requestModel)    
{
        $this->authorize('update', $requestModel);

        if ($requestModel->status !== 'draft') {
            return response()->json(['error' => 'Only draft requests can be edited'], 403);
        }

        $validated = $request->validate([
            'quantity'       => 'required|integer|min:1',
            'urgency_level'  => 'required|in:Low,Medium,High,Critical',
                'handling_class' => 'required|in:General,ColdChain,Narcotics,HighValue',
                'reason'         => 'nullable|string|max:1000',
            ]);

            $requestModel->update($validated);

            return response()->json([
                'message' => 'Draft updated',
                'request' => $requestModel->fresh()->load('resource')
            ]);
        }

public function submitDraft(HttpRequest $request, Request $requestModel)
{

    \Log::info('SubmitDraft binding check', [
    'exists' => $requestModel->exists,
    'id' => $requestModel->id,
    'status' => $requestModel->status,
]);

    if (!$requestModel->exists) {
        return response()->json(['error' => 'Request not found'], 404);
    }

    if ($requestModel->status !== 'draft') {
        return response()->json(['error' => 'Only draft requests can be submitted'], 403);
    }


    $requestModel->update(['status' => 'pending']);

    $requestModel->auditLogs()->create([
        'action'     => 'request_submitted_from_draft',
        'details'    => 'Converted draft to submitted request',
        'user_id'    => auth()->id(),
        'ip_address' => $request->ip(),
        'user_agent' => $request->header('User-Agent'),
    ]);

    return response()->json([
        'message' => 'Draft submitted successfully',
        'request' => $requestModel->fresh()->load(['resource', 'creator']),
    ]);
}

public function show(Request $requestModel)
    {
        return response()->json($requestModel->load(['resource', 'hospital', 'creator']));
    }

public function destroy(Request $requestModel)    {
        $this->authorize('delete', $requestModel);

        if ($requestModel->status !== 'draft') {
            return response()->json(['error' => 'Only draft requests can be deleted'], 403);
        }

        $requestModel->delete();

        return response()->json(['message' => 'Draft deleted']);
    }




    public function markAsUnderReview(Request $requestModel)
{
    $user = auth()->user();

    // Only DOH Dispatcher can mark as under review
    if ($user->role !== 'doh_dispatcher') {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    if ($requestModel->status !== Request::STATUS_PENDING) {
        return response()->json([
            'error' => 'Request is no longer pending',
            'current_status' => $requestModel->status
        ], 422);
    }

    return DB::transaction(function () use ($requestModel, $user) {
        $oldStatus = $requestModel->status;

        $requestModel->update([
            'status' => Request::STATUS_UNDER_REVIEW
        ]);

        // Audit log
        $requestModel->auditLogs()->create([
            'action'         => 'request_under_review',
            'details'        => 'DOH Dispatcher started reviewing the request',
            'before'         => ['status' => $oldStatus],
            'after'          => ['status' => Request::STATUS_UNDER_REVIEW],
            'ip_address'     => request()->ip(),
            'user_agent'     => request()->header('User-Agent'),
        ]);

        // Optional: notify hospital "Your request is being reviewed"
        $requestModel->notifications()->create([
            'type'     => 'request_under_review',
            'message'  => 'Your supply request is now under review by DOH.',
            'channel'  => 'database',
            'status'   => 'sent',
            'sent_at'  => now(),
        ]);

        return response()->json([
            'message' => 'Request is now under review',
            'request' => $requestModel->fresh()->load(['hospital', 'resource'])
        ]);
    });
}

    /**
     * PATCH /api/requests/{request}/status
     *
     * Update a request's status (approve, reject, allocate, deliver, etc.).
     * Allowed transitions:
     *   pending      → approved | rejected
     *   approved     → allocated
     *   allocated    → in_transit
     *   in_transit   → delivered
     *   delivered    → verified
     */
    public function updateStatus(HttpRequest $httpRequest, Request $requestModel)
    {
        $validated = $httpRequest->validate([
            'status' => 'required|string|in:approved,rejected,allocated,in_transit,delivered,verified,under_review',
            'reason' => 'nullable|string|max:1000',
        ]);

        $allowed = [
            'pending'      => ['approved', 'rejected', 'under_review'],
            'under_review' => ['approved', 'rejected'],
            'approved'     => ['allocated'],
            'allocated'    => ['in_transit'],
            'in_transit'   => ['delivered'],
            'delivered'    => ['verified'],
        ];

        $currentStatus = $requestModel->status;
        $newStatus     = $validated['status'];

        if (!isset($allowed[$currentStatus]) || !in_array($newStatus, $allowed[$currentStatus])) {
            return response()->json([
                'error'          => "Cannot transition from '{$currentStatus}' to '{$newStatus}'",
                'current_status' => $currentStatus,
                'allowed'        => $allowed[$currentStatus] ?? [],
            ], 422);
        }

        return DB::transaction(function () use ($requestModel, $validated, $currentStatus) {
            $requestModel->update([
                'status'      => $validated['status'],
                'approved_by' => in_array($validated['status'], ['approved', 'rejected']) ? Auth::id() : $requestModel->approved_by,
                'approved_at' => $validated['status'] === 'approved' ? now() : $requestModel->approved_at,
            ]);

            $requestModel->auditLogs()->create([
                'action'     => "request_status_{$validated['status']}",
                'details'    => $validated['reason'] ?? "Status changed from {$currentStatus} to {$validated['status']}",
                'before'     => ['status' => $currentStatus],
                'after'      => ['status' => $validated['status']],
                'user_id'    => Auth::id(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->header('User-Agent'),
            ]);

            return response()->json([
                'message' => "Request status updated to {$validated['status']}",
                'request' => $requestModel->fresh()->load(['resource', 'hospital', 'creator']),
            ]);
        });
    }
}