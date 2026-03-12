<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SensorDataController
 *
 * Bridges RPi 5 sensor data with the web dashboard.
 * When hardware sensors are inactive, returns mock data so the
 * React frontend remains fully functional.
 */
class SensorDataController extends Controller
{
    // ─── GET /api/sensor/vitals/latest ─────────────────────────────────────
    // Returns the most recent vitals reading (real or mock).

    public function latest(Request $request)
    {
        $userUuid = $request->query('user_uuid');

        // Try fetching real sensor data from the vitals table
        $query = Vital::query()->orderByDesc('created_at');

        if ($userUuid) {
            $query->where('user_uuid', $userUuid);
        }

        $vital = $query->first();

        if ($vital) {
            return response()->json([
                'source' => 'database',
                'data'   => $this->formatVital($vital),
            ]);
        }

        // No real data — return mock vitals
        return response()->json([
            'source' => 'mock',
            'data'   => $this->generateMockVital($userUuid),
        ]);
    }

    // ─── GET /api/sensor/vitals/history ────────────────────────────────────
    // Returns time-series vitals for charting (last N records).

    public function history(Request $request)
    {
        $request->validate([
            'user_uuid' => ['nullable', 'string'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $limit    = (int) $request->query('limit', 50);
        $userUuid = $request->query('user_uuid');

        $query = Vital::query()->orderByDesc('created_at')->limit($limit);

        if ($userUuid) {
            $query->where('user_uuid', $userUuid);
        }

        $vitals = $query->get();

        if ($vitals->isNotEmpty()) {
            return response()->json([
                'source' => 'database',
                'data'   => $vitals->map(fn ($v) => $this->formatVital($v))->values(),
            ]);
        }

        // Generate mock history
        $mockHistory = collect(range(1, $limit))->map(function ($i) use ($userUuid) {
            return $this->generateMockVital($userUuid, now()->subMinutes($i));
        })->values();

        return response()->json([
            'source' => 'mock',
            'data'   => $mockHistory,
        ]);
    }

    // ─── POST /api/sensor/vitals ───────────────────────────────────────────
    // Ingest endpoint — RPi pushes sensor readings here.

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_uuid'          => ['required', 'string'],
            'heart_rate'         => ['required', 'numeric', 'min:20', 'max:250'],
            'oxygen_saturation'  => ['required', 'numeric', 'min:50', 'max:100'],
            'temperature'        => ['required', 'numeric', 'min:30', 'max:45'],
            'blood_pressure'     => ['nullable', 'string', 'max:20'],
            'respiratory_rate'   => ['nullable', 'numeric', 'min:5', 'max:60'],
            'notes'              => ['nullable', 'string', 'max:500'],
        ]);

        $vital = Vital::create([
            'user_uuid'          => $validated['user_uuid'],
            'heart_rate'         => $validated['heart_rate'],
            'oxygen_saturation'  => $validated['oxygen_saturation'],
            'temperature'        => $validated['temperature'],
            'blood_pressure'     => $validated['blood_pressure'] ?? null,
            'respiratory_rate'   => $validated['respiratory_rate'] ?? null,
            'notes'              => $validated['notes'] ?? null,
        ]);

        Log::info('Sensor data ingested', ['vital_id' => $vital->id, 'user_uuid' => $vital->user_uuid]);

        return response()->json([
            'message' => 'Vital signs recorded successfully.',
            'data'    => $this->formatVital($vital),
        ], 201);
    }

    // ─── GET /api/sensor/vitals/summary ────────────────────────────────────
    // Aggregate summary across all patients (dashboard card).

    public function summary()
    {
        $hasData = Vital::exists();

        if ($hasData) {
            $stats = DB::table('vitals')
                ->selectRaw("
                    COUNT(*)                                           AS total_readings,
                    ROUND(AVG(heart_rate)::numeric, 1)                 AS avg_heart_rate,
                    ROUND(AVG(oxygen_saturation)::numeric, 1)          AS avg_spo2,
                    ROUND(AVG(temperature)::numeric, 1)                AS avg_temperature,
                    SUM(CASE WHEN heart_rate > 120 OR heart_rate < 50 THEN 1 ELSE 0 END) AS abnormal_hr,
                    SUM(CASE WHEN oxygen_saturation < 92 THEN 1 ELSE 0 END)              AS low_spo2,
                    SUM(CASE WHEN temperature > 38.5 OR temperature < 35.5 THEN 1 ELSE 0 END) AS abnormal_temp
                ")
                ->first();

            return response()->json([
                'source' => 'database',
                'data'   => $stats,
            ]);
        }

        // Mock summary
        return response()->json([
            'source' => 'mock',
            'data'   => [
                'total_readings'  => 128,
                'avg_heart_rate'  => 78.4,
                'avg_spo2'        => 96.2,
                'avg_temperature' => 36.8,
                'abnormal_hr'     => 3,
                'low_spo2'        => 2,
                'abnormal_temp'   => 1,
            ],
        ]);
    }

    // ─── GET /api/sensor/status ────────────────────────────────────────────
    // Edge device connectivity status (RPi health check).

    public function deviceStatus()
    {
        $lastReading = Vital::orderByDesc('created_at')->first();
        $isOnline    = $lastReading && $lastReading->created_at->diffInMinutes(now()) < 5;

        return response()->json([
            'device_online'     => $isOnline,
            'last_reading_at'   => $lastReading?->created_at?->toIso8601String(),
            'seconds_since'     => $lastReading ? $lastReading->created_at->diffInSeconds(now()) : null,
            'device_ip'         => '192.168.254.110',
            'device_port'       => 5000,
        ]);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private function formatVital(Vital $vital): array
    {
        return [
            'id'                 => $vital->id,
            'user_uuid'          => $vital->user_uuid,
            'heart_rate'         => (float) $vital->heart_rate,
            'spo2'               => (float) $vital->oxygen_saturation,
            'temperature'        => (float) $vital->temperature,
            'blood_pressure'     => $vital->blood_pressure,
            'respiratory_rate'   => $vital->respiratory_rate ? (float) $vital->respiratory_rate : null,
            'notes'              => $vital->notes,
            'recorded_at'        => $vital->created_at->toIso8601String(),
        ];
    }

    private function generateMockVital(?string $userUuid = null, $timestamp = null): array
    {
        $timestamp = $timestamp ?? now();

        return [
            'id'                 => null,
            'user_uuid'          => $userUuid ?? 'mock-patient-001',
            'heart_rate'         => round(60 + mt_rand(0, 400) / 10, 1),   // 60–100 bpm range
            'spo2'               => round(94 + mt_rand(0, 60) / 10, 1),    // 94–100 %
            'temperature'        => round(36.0 + mt_rand(0, 20) / 10, 1),  // 36.0–38.0 °C
            'blood_pressure'     => mt_rand(110, 130) . '/' . mt_rand(70, 85),
            'respiratory_rate'   => mt_rand(12, 20),
            'notes'              => 'Mock data — sensor hardware not active',
            'recorded_at'        => $timestamp->toIso8601String(),
        ];
    }
}
