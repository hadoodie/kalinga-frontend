<?php

namespace App\Console\Commands;

use App\Models\ForecastDemand;
use App\Models\ForecastRisk;
use App\Models\StockMovement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class MonitorForecasts extends Command
{
    protected $signature = 'forecasts:monitor
                            {--retrain : Trigger model retraining if accuracy drifts}
                            {--days=7 : Number of days of history to evaluate}';

    protected $description = 'Monitor forecast accuracy and trigger retraining if needed';

    /**
     * Acceptable error threshold (Mean Absolute Percentage Error).
     * If MAPE > 40%, the model should be retrained.
     */
    const MAPE_THRESHOLD = 0.40;

    /**
     * Minimum forecast rows needed for a meaningful accuracy check.
     */
    const MIN_ROWS = 50;

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $retrain = $this->option('retrain');

        $this->info('═══════════════════════════════════════════════');
        $this->info('  Kalinga Forecast Monitor');
        $this->info("  Evaluating last {$days} days");
        $this->info('═══════════════════════════════════════════════');

        // ── Step 1: Compare past forecasts to actual consumption ──
        $this->info("\n[1/3] Comparing forecasts vs actuals...");

        $metrics = $this->calculateAccuracy($days);

        if ($metrics === null) {
            $this->warn('  ⚠ Not enough data for accuracy check');
            return Command::SUCCESS;
        }

        $this->table(
            ['Metric', 'Value'],
            [
                ['Evaluated Pairs', number_format($metrics['pairs'])],
                ['Mean Abs Error (MAE)', round($metrics['mae'], 3)],
                ['MAPE', round($metrics['mape'] * 100, 1) . '%'],
                ['Bias (avg over/under)', round($metrics['bias'], 3)],
                ['R² Score', round($metrics['r2'], 4)],
            ]
        );

        // ── Step 2: Risk model evaluation ─────────────────────
        $this->info("\n[2/3] Evaluating risk predictions...");

        $riskMetrics = $this->evaluateRiskPredictions($days);

        if ($riskMetrics) {
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Predictions Evaluated', $riskMetrics['total']],
                    ['Correct Risk Level', round($riskMetrics['accuracy'] * 100, 1) . '%'],
                    ['False Alarms (predicted high, was low)', $riskMetrics['false_alarms']],
                    ['Missed Risks (predicted low, was high)', $riskMetrics['missed_risks']],
                ]
            );
        } else {
            $this->warn('  ⚠ No risk evaluations available yet');
        }

        // ── Step 3: Retrain if needed ─────────────────────────
        $needsRetrain = $metrics['mape'] > self::MAPE_THRESHOLD;

        $this->info("\n[3/3] Retraining decision...");

        if ($needsRetrain) {
            $this->warn("  ⚠ MAPE ({$metrics['mape']}%) exceeds threshold (" . (self::MAPE_THRESHOLD * 100) . '%)');

            if ($retrain) {
                $this->info('  → Triggering retraining...');
                $this->triggerRetraining();
            } else {
                $this->warn('  → Run with --retrain flag to trigger retraining');
            }
        } else {
            $this->info('  ✓ Model accuracy within acceptable range');
        }

        // Log metrics for historical tracking
        Log::info('[ForecastMonitor] Accuracy report', [
            'days_evaluated' => $days,
            'mae' => $metrics['mae'],
            'mape' => $metrics['mape'],
            'r2' => $metrics['r2'],
            'needs_retrain' => $needsRetrain,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Compare past demand forecasts against actual stock movement data.
     */
    private function calculateAccuracy(int $days): ?array
    {
        $since = now()->subDays($days);

        // Get past forecasts where the forecast_time has already passed
        $pastForecasts = ForecastDemand::where('forecast_time', '<=', now())
            ->where('generated_at', '>=', $since)
            ->select([
                'hospital_id',
                'resource_id',
                'forecast_time',
                'yhat',
            ])
            ->get();

        if ($pastForecasts->count() < self::MIN_ROWS) {
            return null;
        }

        // Get actual consumption for the same time windows
        $actuals = StockMovement::where('created_at', '>=', $since)
            ->where('type', 'out')
            ->select([
                'hospital_id',
                'resource_id',
                DB::raw("DATE_TRUNC('hour', created_at) as hour"),
                DB::raw('SUM(quantity) as actual_consumption'),
            ])
            ->groupBy('hospital_id', 'resource_id', DB::raw("DATE_TRUNC('hour', created_at)"))
            ->get()
            ->keyBy(fn ($r) => "{$r->hospital_id}-{$r->resource_id}-{$r->hour}");

        // Match forecasts with actuals
        $errors = [];
        $absErrors = [];
        $actVals = [];

        foreach ($pastForecasts as $fc) {
            $key = "{$fc->hospital_id}-{$fc->resource_id}-{$fc->forecast_time}";
            $actual = $actuals->get($key);

            if ($actual) {
                $predicted = $fc->yhat;
                $real = $actual->actual_consumption;
                $error = $predicted - $real;

                $errors[] = $error;
                $absErrors[] = abs($error);
                $actVals[] = ['predicted' => $predicted, 'actual' => $real];
            }
        }

        if (count($actVals) < self::MIN_ROWS) {
            return null;
        }

        $mae = array_sum($absErrors) / count($absErrors);
        $meanActual = array_sum(array_column($actVals, 'actual')) / count($actVals);
        $mape = $meanActual > 0 ? $mae / $meanActual : 0;
        $bias = array_sum($errors) / count($errors);

        // R² calculation
        $ssRes = array_sum(array_map(fn ($v) => ($v['predicted'] - $v['actual']) ** 2, $actVals));
        $ssTot = array_sum(array_map(fn ($v) => ($v['actual'] - $meanActual) ** 2, $actVals));
        $r2 = $ssTot > 0 ? 1 - ($ssRes / $ssTot) : 0;

        return [
            'pairs' => count($actVals),
            'mae' => $mae,
            'mape' => $mape,
            'bias' => $bias,
            'r2' => $r2,
        ];
    }

    /**
     * Evaluate risk predictions against what actually happened.
     */
    private function evaluateRiskPredictions(int $days): ?array
    {
        $since = now()->subDays($days);

        // Get past risk predictions
        $risks = ForecastRisk::where('forecast_time', '<=', now())
            ->where('generated_at', '>=', $since)
            ->get();

        if ($risks->count() < self::MIN_ROWS) {
            return null;
        }

        // Check if stockouts actually occurred
        $stockouts = DB::table('resources')
            ->where('current_quantity', '<=', 0)
            ->select('hospital_id', 'id as resource_id')
            ->get()
            ->mapWithKeys(fn ($r) => ["{$r->hospital_id}-{$r->resource_id}" => true])
            ->toArray();

        $correct = 0;
        $falseAlarms = 0;
        $missedRisks = 0;
        $total = 0;

        foreach ($risks->groupBy(fn ($r) => "{$r->hospital_id}-{$r->resource_id}") as $key => $group) {
            $worstLevel = $group->sortByDesc('risk_prob')->first()->risk_level;
            $didStockOut = $stockouts[$key] ?? false;
            $total++;

            $predictedHigh = in_array($worstLevel, ['high', 'critical']);

            if ($predictedHigh && $didStockOut) {
                $correct++;
            } elseif (!$predictedHigh && !$didStockOut) {
                $correct++;
            } elseif ($predictedHigh && !$didStockOut) {
                $falseAlarms++;
            } elseif (!$predictedHigh && $didStockOut) {
                $missedRisks++;
            }
        }

        return [
            'total' => $total,
            'accuracy' => $total > 0 ? $correct / $total : 0,
            'false_alarms' => $falseAlarms,
            'missed_risks' => $missedRisks,
        ];
    }

    /**
     * Trigger Python model retraining.
     */
    private function triggerRetraining(): void
    {
        $projectRoot = base_path() . '/..';

        $venvPaths = [
            "{$projectRoot}/forecasting/.venv/bin/python",
            "{$projectRoot}/forecasting/.venv/Scripts/python.exe",
        ];

        $python = 'python3';
        foreach ($venvPaths as $path) {
            if (file_exists($path)) {
                $python = realpath($path);
                break;
            }
        }

        $cmd = "cd " . escapeshellarg($projectRoot)
            . " && " . escapeshellarg($python)
            . " -m forecasting.run_forecast --production --horizon 48";

        $this->info("  Executing: {$cmd}");

        $result = Process::timeout(300)->run($cmd);

        if ($result->successful()) {
            $this->info('  ✓ Retraining pipeline completed');
            Log::info('[ForecastMonitor] Retraining completed successfully');
        } else {
            $this->error('  ✗ Retraining failed: ' . $result->errorOutput());
            Log::error('[ForecastMonitor] Retraining failed', ['stderr' => $result->errorOutput()]);
        }
    }
}
