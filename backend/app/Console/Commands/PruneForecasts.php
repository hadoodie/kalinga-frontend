<?php

namespace App\Console\Commands;

use App\Models\ForecastDemand;
use App\Models\ForecastRisk;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PruneForecasts extends Command
{
    protected $signature = 'forecasts:prune
                            {--days= : Delete forecasts older than this many days (default: FORECAST_RETENTION_DAYS env)}
                            {--dry-run : Preview what would be deleted without actually deleting}';

    protected $description = 'Prune old forecast data to keep the database lean';

    public function handle(): int
    {
        $days   = (int) ($this->option('days') ?? env('FORECAST_RETENTION_DAYS', 30));
        $dryRun = $this->option('dry-run');
        $cutoff = now()->subDays($days);

        $demandCount = ForecastDemand::where('generated_at', '<', $cutoff)->count();
        $riskCount   = ForecastRisk::where('generated_at', '<', $cutoff)->count();
        $total       = $demandCount + $riskCount;

        if ($total === 0) {
            $this->info("No forecast data older than {$days} days. Nothing to prune.");
            return Command::SUCCESS;
        }

        $this->table(
            ['Table', 'Rows to delete'],
            [
                ['forecast_demand_hourly', number_format($demandCount)],
                ['forecast_risk_hourly', number_format($riskCount)],
                ['Total', number_format($total)],
            ]
        );

        if ($dryRun) {
            $this->warn("[DRY-RUN] Would delete {$total} rows older than {$days} days.");
            return Command::SUCCESS;
        }

        ForecastDemand::where('generated_at', '<', $cutoff)->delete();
        ForecastRisk::where('generated_at', '<', $cutoff)->delete();

        $this->info("Pruned {$total} forecast rows older than {$days} days.");
        Log::info("Forecast prune completed", ['days' => $days, 'deleted' => $total]);

        return Command::SUCCESS;
    }
}
