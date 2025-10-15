<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SyncCloudToLocal extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:sync-cloud-to-local 
                            {--tables=* : Specific tables to sync (optional)}
                            {--skip-confirm : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync data from cloud database (Supabase) to local database for backup';

    /**
     * Tables to sync (all tables by default)
     */
    protected array $defaultTables = [
        'users',
        'resources',
        'resource_requests',
        'vehicles',
        'hospitals',
        'personal_access_tokens',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Starting Cloud to Local Database Sync...');
        $this->newLine();

        // Check connections
        if (!$this->checkConnections()) {
            return Command::FAILURE;
        }

        // Get tables to sync
        $tables = $this->option('tables') ?: $this->defaultTables;

        // Confirm before proceeding
        if (!$this->option('skip-confirm')) {
            if (!$this->confirm('This will overwrite local data with cloud data. Continue?', true)) {
                $this->warn('Sync cancelled.');
                return Command::SUCCESS;
            }
        }

        $this->newLine();
        $startTime = microtime(true);
        $totalSynced = 0;

        // Sync each table
        foreach ($tables as $table) {
            try {
                $count = $this->syncTable($table);
                $totalSynced += $count;
            } catch (\Exception $e) {
                $this->error("❌ Failed to sync table '{$table}': {$e->getMessage()}");
                continue;
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        $this->newLine();
        $this->info("✅ Sync completed successfully!");
        $this->info("📊 Total records synced: {$totalSynced}");
        $this->info("⏱️  Time taken: {$duration} seconds");

        return Command::SUCCESS;
    }

    /**
     * Check if both database connections are available
     */
    protected function checkConnections(): bool
    {
        $this->info('🔍 Checking database connections...');

        // Check cloud connection
        try {
            DB::connection('pgsql_cloud')->getPdo();
            $this->info('✅ Cloud database connected');
        } catch (\Exception $e) {
            $this->error('❌ Cloud database connection failed: ' . $e->getMessage());
            return false;
        }

        // Check local connection
        try {
            DB::connection('pgsql_local')->getPdo();
            $this->info('✅ Local database connected');
        } catch (\Exception $e) {
            $this->error('❌ Local database connection failed: ' . $e->getMessage());
            $this->warn('💡 Make sure local PostgreSQL is running and database exists');
            return false;
        }

        return true;
    }

    /**
     * Sync a single table from cloud to local
     */
    protected function syncTable(string $table): int
    {
        $this->line("📦 Syncing table: {$table}");

        // Check if table exists in cloud
        if (!Schema::connection('pgsql_cloud')->hasTable($table)) {
            $this->warn("  ⚠️  Table '{$table}' does not exist in cloud database. Skipping...");
            return 0;
        }

        // Fetch all data from cloud
        $cloudData = DB::connection('pgsql_cloud')->table($table)->get();
        $count = $cloudData->count();

        if ($count === 0) {
            $this->line("  ℹ️  No data to sync for '{$table}'");
            return 0;
        }

        // Create table in local if it doesn't exist
        if (!Schema::connection('pgsql_local')->hasTable($table)) {
            $this->warn("  ⚠️  Table '{$table}' does not exist in local database.");
            $this->warn("  💡 Please run migrations on local database first.");
            return 0;
        }

        // Clear local table
        DB::connection('pgsql_local')->table($table)->truncate();

        // Insert data in chunks for better performance
        $chunks = $cloudData->chunk(100);
        foreach ($chunks as $chunk) {
            DB::connection('pgsql_local')->table($table)->insert(
                json_decode(json_encode($chunk), true)
            );
        }

        $this->info("  ✅ Synced {$count} records");

        return $count;
    }
}
