<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\DatabaseConnectionManager;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automatic Database Replication Schedule
// Sync cloud database to local backup every minute (for testing/development)
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(function () {
        // Only sync if cloud is available
        return DatabaseConnectionManager::isCloudAvailable();
    })
    ->onSuccess(function () {
        info('Cloud to local sync completed successfully at ' . now());
    })
    ->onFailure(function () {
        info('Cloud to local sync failed at ' . now());
    });

// Automatic Local to Cloud Sync (Bidirectional)
// Syncs local changes back to cloud when connection is restored
Schedule::command('db:sync-local-to-cloud --skip-confirm')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(function () {
        // Only sync if:
        // 1. Cloud is now available
        // 2. We were previously in failover mode (has local changes to sync)
        $wasInFailover = cache()->has('db_failover_status');
        $cloudNowAvailable = DatabaseConnectionManager::isCloudAvailable();
        
        if ($wasInFailover && $cloudNowAvailable) {
            info('Detected cloud reconnection after failover, initiating local to cloud sync');
            return true;
        }
        
        return false;
    })
    ->onSuccess(function () {
        info('Local to cloud sync completed successfully at ' . now());
        cache()->forget('db_failover_status'); // Clear failover flag after successful sync
    })
    ->onFailure(function () {
        info('Local to cloud sync failed at ' . now());
    });

// Periodic connection health check
Schedule::call(function () {
    $status = DatabaseConnectionManager::getConnectionStatus();
    info('Database health check: ' . json_encode($status));
})->everyTenMinutes();

// ═══════════════════════════════════════════════════════════
// AI Forecasting Pipeline Schedule
// ═══════════════════════════════════════════════════════════

// Run demand & risk forecasts every 2 hours
Schedule::command('forecasts:run --mode=production --auto-reorder --narrative')
    ->everyTwoHours()
    ->withoutOverlapping()
    ->when(function () {
        return config('app.forecast_enabled', true);
    })
    ->onSuccess(function () {
        info('Forecast pipeline completed at ' . now());
    })
    ->onFailure(function () {
        info('Forecast pipeline failed at ' . now());
    });

// Monitor forecast accuracy daily at 6 AM
Schedule::command('forecasts:monitor --retrain --days=7')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->when(function () {
        return config('app.forecast_enabled', true);
    })
    ->onSuccess(function () {
        info('Forecast monitoring completed at ' . now());
    });

// Prune old forecast data weekly (retention read from FORECAST_RETENTION_DAYS env)
Schedule::command('forecasts:prune')
    ->weekly()
    ->sundays()
    ->at('03:00')
    ->withoutOverlapping()
    ->when(function () {
        return config('app.forecast_enabled', true);
    })
    ->onSuccess(function () {
        info('Forecast data pruned at ' . now());
    });

// Logistics Auto-Verify (Fallback to prevent Dead Ends in Delivered)
Schedule::command('logistics:auto-verify')
    ->hourly()
    ->withoutOverlapping()
    ->onSuccess(function () {
        info('Logistics auto-verify routine executed at ' . now());
    });
