<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Services\DatabaseConnectionManager;

class SyncLocalToCloud extends Command
{
    protected $signature = 'db:sync-local-to-cloud 
                            {--tables=* : Specific tables to sync (optional)}
                            {--skip-confirm : Skip confirmation prompt}';

    protected $description = 'Sync data from local database to cloud database (Supabase) after connection is restored';

    private array $defaultTables = [
        'users',
        'resources',
        'resource_requests',
        'vehicles',
        'hospitals',
        'personal_access_tokens',
    ];

    public function handle()
    {
        $this->info('🔄 Starting Local to Cloud Database Sync...');
        $this->newLine();

        // Check if cloud is available
        if (!DatabaseConnectionManager::isCloudAvailable()) {
            $this->error('❌ Cloud database is not available. Cannot sync.');
            $this->warn('Please check your internet connection and Supabase status.');
            return 1;
        }

        if (!DatabaseConnectionManager::isLocalAvailable()) {
            $this->error('❌ Local database is not available.');
            return 1;
        }

        $this->info('🔍 Checking database connections...');
        $this->info('✅ Cloud database connected');
        $this->info('✅ Local database connected');
        $this->newLine();

        // Get tables to sync
        $tables = $this->option('tables') ?: $this->defaultTables;

        // Confirm before proceeding
        if (!$this->option('skip-confirm')) {
            $this->warn('⚠️  WARNING: This will overwrite cloud data with local data!');
            $this->warn('Tables to sync: ' . implode(', ', $tables));
            $this->newLine();
            
            if (!$this->confirm('Do you want to continue?')) {
                $this->info('Sync cancelled.');
                return 0;
            }
            $this->newLine();
        }

        $startTime = microtime(true);
        $totalRecords = 0;

        foreach ($tables as $table) {
            try {
                $totalRecords += $this->syncTable($table);
            } catch (\Exception $e) {
                $this->error("  ❌ Error syncing table '$table': " . $e->getMessage());
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        $this->newLine();
        $this->info('✅ Sync completed successfully!');
        $this->info("📊 Total records synced: $totalRecords");
        $this->info("⏱️  Time taken: {$duration} seconds");

        return 0;
    }

    private function syncTable(string $table): int
    {
        $this->info("📦 Syncing table: $table");

        // Check if table exists in both databases
        if (!$this->tableExists('pgsql_local', $table)) {
            $this->warn("  ⚠️  Table '$table' does not exist in local database");
            return 0;
        }

        if (!$this->tableExists('pgsql_cloud', $table)) {
            $this->warn("  ⚠️  Table '$table' does not exist in cloud database");
            return 0;
        }

        // Get data from local database
        $records = DB::connection('pgsql_local')->table($table)->get();

        if ($records->isEmpty()) {
            $this->info("  ℹ️  No data to sync for '$table'");
            return 0;
        }

        $count = $records->count();

        // Clear cloud table and insert local data
        DB::connection('pgsql_cloud')->table($table)->truncate();

        // Insert in chunks for better performance
        $chunks = $records->chunk(100);
        foreach ($chunks as $chunk) {
            DB::connection('pgsql_cloud')->table($table)->insert(
                $chunk->map(fn($record) => (array) $record)->toArray()
            );
        }

        $this->info("  ✅ Synced $count records");
        return $count;
    }

    private function tableExists(string $connection, string $table): bool
    {
        return Schema::connection($connection)->hasTable($table);
    }
}
