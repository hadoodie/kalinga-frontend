<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceLog;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
public function index()
{
    $logs = MaintenanceLog::with('asset')->get();

    $transformed = $logs->map(fn($log) => [
        'id'             => $log->maintenance_code ?? 'MTN-' . str_pad($log->id, 5, '0', STR_PAD_LEFT),
        'assetId'        => $log->asset->asset_code,
        'assetName'      => $log->asset->type,
        'assetLocation'  => $log->asset->location,
        'assetCategory'  => $log->asset->category,
        'scheduledDate'  => $log->scheduled_date->format('Y-m-d'),
        'completedDate'  => $log->completed_date?->format('Y-m-d'),
        'description'    => $log->description,
        'status'         => $log->status,
        'priority'       => $log->priority,
        'technician'     => $log->technician,
        'cost'           => (float) $log->cost,
        'isOverdue'      => $log->status === 'scheduled' && $log->scheduled_date < today(),
    ]);

    return response()->json([
        'upcoming'  => $transformed->where('status', 'scheduled')->where('scheduledDate', '>=', today()),
        'overdue'   => $transformed->where('status', 'scheduled')->where('scheduledDate', '<', today()),
        'completed' => $transformed->where('status', 'completed'),
        'all'       => $transformed,
    ]);
}

    public function store(Request $request)
    {
        $log = MaintenanceLog::create($request->all());
        return response()->json($log, 201);
    }

    public function reschedule($id, Request $request)
    {
        $log = MaintenanceLog::findOrFail($id);
        $log->update(['scheduled_date' => $request->newDate]);
        return response()->json($log);
    }

    public function complete($id)
    {
        $log = MaintenanceLog::findOrFail($id);
        $log->update([
            'status' => 'completed',
            'completed_date' => now()
        ]);
        return response()->json($log);
    }
}