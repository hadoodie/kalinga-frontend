<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automatic Database Replication Schedule
// Sync cloud database to local backup every hour
Schedule::command('db:sync-cloud-to-local --skip-confirm')
    ->hourly()
    ->withoutOverlapping()
    ->onSuccess(function () {
        info('Database sync completed successfully at ' . now());
    })
    ->onFailure(function () {
        info('Database sync failed at ' . now());
    });
