<?php

namespace App\Console\Commands;

use App\Models\ForecastDemand;
use App\Models\ForecastRisk;
use App\Services\AutoReorderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class RunForecasts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'forecasts:run
                            {--mode=production : Run mode: production|demo}
                            {--horizon=48 : Forecast horizon in hours}
                            {--auto-reorder : Auto-create supply requests for critical items}
                            {--narrative : Generate AI narrative summary}
                            {--dry-run : Print what would happen without writing to DB}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the Kalinga AI demand & risk forecasting pipeline';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $mode = $this->option('mode');
        $horizon = (int) $this->option('horizon');
        $autoReorder = $this->option('auto-reorder');
        $narrative = $this->option('narrative');
        $dryRun = $this->option('dry-run');

        $this->info('═══════════════════════════════════════════════');
        $this->info('  Kalinga Forecasting Pipeline');
        $this->info("  Mode: {$mode} | Horizon: {$horizon}h");
        $this->info('═══════════════════════════════════════════════');

        $startTime = microtime(true);

        // ── Step 1: Run the Python pipeline ──────────────────
        $this->info("\n[1/4] Running Python forecast pipeline...");

        $pythonCmd = $this->buildPythonCommand($mode, $horizon);

        if ($dryRun) {
            $this->warn("  [DRY-RUN] Would execute: {$pythonCmd}");
        } else {
            $result = Process::timeout(300)->run($pythonCmd);

            if (!$result->successful()) {
                $this->error('  ✗ Python pipeline failed:');
                $this->error($result->errorOutput());
                Log::error('Forecast pipeline failed', [
                    'exit_code' => $result->exitCode(),
                    'stderr' => $result->errorOutput(),
                ]);
                return Command::FAILURE;
            }

            $this->line($result->output());
        }

        // ── Step 2: Verify results ──────────────────────────
        $this->info("\n[2/4] Verifying forecast results...");

        $demandCount = ForecastDemand::latestRun()->count();
        $riskCount = ForecastRisk::latestRun()->count();
        $highRiskCount = ForecastRisk::latestRun()
            ->whereIn('risk_level', ['high', 'critical'])
            ->count();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Demand Predictions', number_format($demandCount)],
                ['Risk Predictions', number_format($riskCount)],
                ['High/Critical Risks', number_format($highRiskCount)],
            ]
        );

        if ($demandCount === 0 && !$dryRun) {
            $this->error('  ✗ No demand predictions generated');
            return Command::FAILURE;
        }

        // ── Step 3: Auto-reorder (optional) ─────────────────
        if ($autoReorder && $highRiskCount > 0) {
            $this->info("\n[3/4] Running auto-reorder for critical items...");

            if ($dryRun) {
                $this->warn("  [DRY-RUN] Would auto-create requests for {$highRiskCount} risk items");
            } else {
                try {
                    $reorderService = app(AutoReorderService::class);
                    $created = $reorderService->processHighRiskItems();
                    $this->info("  ✓ Created {$created} supply requests");
                } catch (\Exception $e) {
                    $this->error("  ✗ Auto-reorder failed: {$e->getMessage()}");
                    Log::error('Auto-reorder failed', ['error' => $e->getMessage()]);
                }
            }
        } else {
            $this->info("\n[3/4] Auto-reorder: " . ($autoReorder ? 'No high-risk items' : 'Skipped'));
        }

        // ── Step 4: AI narrative (optional) ─────────────────
        if ($narrative) {
            $this->info("\n[4/4] Generating AI narrative summary...");

            if ($dryRun) {
                $this->warn('  [DRY-RUN] Would generate Gemini narrative');
            } else {
                try {
                    $narrativeService = app(\App\Services\ForecastNarrativeService::class);
                    $summary = $narrativeService->generateExecutiveSummary();

                    if ($summary['success']) {
                        $this->info('  ✓ Narrative generated');
                        $this->line('  ' . str_replace("\n", "\n  ", $summary['text']));
                    } else {
                        $this->warn("  ⚠ Narrative: {$summary['error']}");
                    }
                } catch (\Exception $e) {
                    $this->warn("  ⚠ Narrative failed: {$e->getMessage()}");
                }
            }
        } else {
            $this->info("\n[4/4] AI narrative: Skipped");
        }

        $elapsed = round(microtime(true) - $startTime, 1);
        $this->newLine();
        $this->info("✅ Pipeline complete in {$elapsed}s");

        Log::info('Forecast pipeline completed', [
            'mode' => $mode,
            'horizon' => $horizon,
            'demand_count' => $demandCount,
            'risk_count' => $riskCount,
            'high_risk_count' => $highRiskCount,
            'elapsed_seconds' => $elapsed,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Build the Python command to run the forecast pipeline.
     */
    private function buildPythonCommand(string $mode, int $horizon): string
    {
        $projectRoot = base_path() . '/..';
        $python = $this->findPython();

        $args = [
            $python,
            '-m', 'forecasting.run_forecast',
            "--{$mode}",
            '--horizon', (string) $horizon,
        ];

        return 'cd ' . escapeshellarg($projectRoot) . ' && ' . implode(' ', array_map('escapeshellarg', $args));
    }

    /**
     * Find the Python executable (venv preferred).
     */
    private function findPython(): string
    {
        $projectRoot = base_path() . '/..';

        // Check venv first
        $venvPaths = [
            "{$projectRoot}/forecasting/.venv/bin/python",
            "{$projectRoot}/forecasting/.venv/Scripts/python.exe",
            "{$projectRoot}/.venv/bin/python",
        ];

        foreach ($venvPaths as $path) {
            if (file_exists($path)) {
                return realpath($path);
            }
        }

        // Fall back to system Python
        return PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
    }
}
