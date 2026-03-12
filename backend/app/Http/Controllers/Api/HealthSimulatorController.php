<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * HealthSimulatorController
 *
 * Provides a "Data Simulator" that mimics real-time Alisto health monitoring
 * inputs (Heart Rate, SpO2, Body Temperature) for testing and demo purposes.
 *
 * Does NOT alter existing schema — only inserts into the existing `vitals` table.
 */
class HealthSimulatorController extends Controller
{
    /**
     * POST /api/simulator/start
     *
     * Generate a batch of simulated vitals readings for one or more patients.
     * Useful for populating the dashboard when the RPi hardware is offline.
     */
    public function start(Request $request)
    {
        $validated = $request->validate([
            'patient_uuids'   => ['nullable', 'array', 'max:20'],
            'patient_uuids.*' => ['string'],
            'readings_count'  => ['nullable', 'integer', 'min:1', 'max:100'],
            'interval_seconds' => ['nullable', 'integer', 'min:1', 'max:300'],
        ]);

        $patientUuids   = $validated['patient_uuids'] ?? ['sim-patient-001', 'sim-patient-002', 'sim-patient-003'];
        $readingsCount  = $validated['readings_count'] ?? 10;
        $intervalSeconds = $validated['interval_seconds'] ?? 30;

        $generated = [];

        foreach ($patientUuids as $uuid) {
            for ($i = 0; $i < $readingsCount; $i++) {
                $timestamp = now()->subSeconds($i * $intervalSeconds);
                $scenario  = $this->pickScenario();
                $vitals    = $this->simulateVitals($scenario);

                $vital = Vital::create([
                    'user_uuid'          => $uuid,
                    'heart_rate'         => $vitals['heart_rate'],
                    'oxygen_saturation'  => $vitals['spo2'],
                    'temperature'        => $vitals['temperature'],
                    'blood_pressure'     => $vitals['blood_pressure'],
                    'respiratory_rate'   => $vitals['respiratory_rate'],
                    'notes'              => "Simulated [{$scenario}] — Alisto Health Monitor",
                ]);

                // Back-date the created_at for realistic time-series
                $vital->timestamps = false;
                $vital->created_at = $timestamp;
                $vital->updated_at = $timestamp;
                $vital->save();

                $generated[] = [
                    'id'          => $vital->id,
                    'user_uuid'   => $uuid,
                    'scenario'    => $scenario,
                    'heart_rate'  => $vitals['heart_rate'],
                    'spo2'        => $vitals['spo2'],
                    'temperature' => $vitals['temperature'],
                    'recorded_at' => $timestamp->toIso8601String(),
                ];
            }
        }

        Log::info('Health simulator: generated ' . count($generated) . ' readings');

        return response()->json([
            'message'          => 'Simulation complete.',
            'total_readings'   => count($generated),
            'patients'         => count($patientUuids),
            'readings_per_patient' => $readingsCount,
            'data'             => $generated,
        ], 201);
    }

    /**
     * POST /api/simulator/stream
     *
     * Returns a single simulated reading without persisting — for SSE/polling preview.
     */
    public function stream(Request $request)
    {
        $userUuid = $request->input('user_uuid', 'sim-stream-001');
        $scenario = $request->input('scenario', $this->pickScenario());
        $vitals   = $this->simulateVitals($scenario);

        return response()->json([
            'source'    => 'simulator',
            'scenario'  => $scenario,
            'data'      => [
                'user_uuid'        => $userUuid,
                'heart_rate'       => $vitals['heart_rate'],
                'spo2'             => $vitals['spo2'],
                'temperature'      => $vitals['temperature'],
                'blood_pressure'   => $vitals['blood_pressure'],
                'respiratory_rate' => $vitals['respiratory_rate'],
                'recorded_at'      => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * DELETE /api/simulator/cleanup
     *
     * Remove all simulated data (notes LIKE '%Simulated%Alisto Health Monitor%').
     */
    public function cleanup()
    {
        $deleted = Vital::where('notes', 'LIKE', '%Simulated%Alisto Health Monitor%')->delete();

        return response()->json([
            'message'         => 'Simulated data cleaned up.',
            'records_deleted' => $deleted,
        ]);
    }

    /**
     * GET /api/simulator/scenarios
     *
     * List available simulation profiles.
     */
    public function scenarios()
    {
        return response()->json([
            'scenarios' => [
                'normal'    => 'Healthy patient — all vitals within normal range',
                'fever'     => 'Elevated body temperature (38.5–40.0 °C)',
                'hypoxia'   => 'Low SpO2 (82–91%) — respiratory distress scenario',
                'tachycardia' => 'Elevated heart rate (110–150 bpm)',
                'bradycardia' => 'Low heart rate (35–55 bpm)',
                'critical'  => 'Multiple abnormal vitals — critical care scenario',
                'random'    => 'Randomly pick any of the above',
            ],
        ]);
    }

    // ─── Simulation Engine ─────────────────────────────────────────────────

    private function pickScenario(): string
    {
        $scenarios = ['normal', 'fever', 'hypoxia', 'tachycardia', 'bradycardia', 'critical'];
        // Weighted: 50% normal, 50% abnormal
        if (mt_rand(1, 100) <= 50) {
            return 'normal';
        }
        return $scenarios[array_rand(array_slice($scenarios, 1)) + 1];
    }

    private function simulateVitals(string $scenario): array
    {
        return match ($scenario) {
            'normal' => [
                'heart_rate'       => $this->frand(60.0, 100.0),
                'spo2'             => $this->frand(95.0, 100.0),
                'temperature'      => $this->frand(36.1, 37.3),
                'blood_pressure'   => mt_rand(110, 130) . '/' . mt_rand(70, 85),
                'respiratory_rate' => mt_rand(12, 20),
            ],
            'fever' => [
                'heart_rate'       => $this->frand(85.0, 115.0),
                'spo2'             => $this->frand(93.0, 98.0),
                'temperature'      => $this->frand(38.5, 40.0),
                'blood_pressure'   => mt_rand(100, 125) . '/' . mt_rand(65, 80),
                'respiratory_rate' => mt_rand(18, 28),
            ],
            'hypoxia' => [
                'heart_rate'       => $this->frand(90.0, 130.0),
                'spo2'             => $this->frand(82.0, 91.0),
                'temperature'      => $this->frand(36.0, 37.5),
                'blood_pressure'   => mt_rand(90, 120) . '/' . mt_rand(60, 80),
                'respiratory_rate' => mt_rand(22, 35),
            ],
            'tachycardia' => [
                'heart_rate'       => $this->frand(110.0, 150.0),
                'spo2'             => $this->frand(92.0, 98.0),
                'temperature'      => $this->frand(36.5, 38.0),
                'blood_pressure'   => mt_rand(130, 160) . '/' . mt_rand(85, 100),
                'respiratory_rate' => mt_rand(18, 25),
            ],
            'bradycardia' => [
                'heart_rate'       => $this->frand(35.0, 55.0),
                'spo2'             => $this->frand(90.0, 96.0),
                'temperature'      => $this->frand(35.5, 37.0),
                'blood_pressure'   => mt_rand(85, 105) . '/' . mt_rand(55, 70),
                'respiratory_rate' => mt_rand(10, 16),
            ],
            'critical' => [
                'heart_rate'       => mt_rand(0, 1) ? $this->frand(140.0, 180.0) : $this->frand(30.0, 45.0),
                'spo2'             => $this->frand(70.0, 85.0),
                'temperature'      => mt_rand(0, 1) ? $this->frand(39.5, 41.0) : $this->frand(34.0, 35.5),
                'blood_pressure'   => mt_rand(70, 90) . '/' . mt_rand(40, 55),
                'respiratory_rate' => mt_rand(6, 10),
            ],
            default => $this->simulateVitals('normal'),
        };
    }

    private function frand(float $min, float $max): float
    {
        return round($min + mt_rand(0, 1000) / 1000 * ($max - $min), 1);
    }
}
