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
                            {--skip-confirm : Skip confirmation prompt}
                            {--preserve-existing : Keep local records and only insert missing rows}';

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
        'personal_access_tokens',
        'notifications',
        'hospitals',
        'vehicles',
        'resources',
        'resource_requests',
        'road_blockades',
        'appointments',
        'lab_results',
        'test_results',
        'test_result_details',
        'diagnoses',
        'medications',
        'immunizations',
        'allergies',
        'messages',
        'message_attachments',
        'conversation_members',
        'conversations',
    ];

    /**
     * Tables to skip when auto-detecting.
     */
    protected array $excludedTables = [
        'migrations',
        'password_resets',
        'failed_jobs',
        'job_batches',
        'cache',
        'cache_locks',
    ];

    protected bool $preserveExisting = false;

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
        $tables = $this->resolveTables();
        $this->info('🗂️  Tables to sync: ' . implode(', ', $tables));

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

        $this->preserveExisting = (bool) $this->option('preserve-existing');
        if ($this->preserveExisting) {
            $this->info('🛡️  Preserve-existing mode enabled — will skip rows already present locally.');
        }

        $foreignKeysDisabled = false;

        try {
            $foreignKeysDisabled = $this->disableForeignKeyChecks();

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
        } finally {
            if ($foreignKeysDisabled) {
                $this->enableForeignKeyChecks();
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        $this->newLine();
        $this->info("✅ Sync completed successfully!");
        $this->info("📊 Total records synced: {$totalSynced}");
        $this->info("⏱️  Time taken: {$duration} seconds");

        return Command::SUCCESS;
    }

    protected function disableForeignKeyChecks(): bool
    {
        try {
            DB::connection('pgsql_local')->statement("SET session_replication_role = 'replica'");
            $this->info('🔧 Foreign key constraints temporarily disabled on local database.');
            return true;
        } catch (\Throwable $e) {
            $this->warn('⚠️  Unable to disable foreign keys automatically: ' . $e->getMessage());
            return false;
        }
    }

    protected function enableForeignKeyChecks(): void
    {
        try {
            DB::connection('pgsql_local')->statement("SET session_replication_role = 'origin'");
            $this->info('🔒 Foreign key constraints restored.');
        } catch (\Throwable $e) {
            $this->warn('⚠️  Failed to restore foreign key constraints automatically: ' . $e->getMessage());
        }
    }

    /**
     * Resolve list of tables to sync.
     */
    protected function resolveTables(): array
    {
        $requested = array_filter((array) $this->option('tables'));
        if (!empty($requested)) {
            return $requested;
        }

        try {
            $result = DB::connection('pgsql_cloud')->select(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            );

            $tables = collect($result)
                ->pluck('tablename')
                ->reject(function ($table) {
                    return in_array($table, $this->excludedTables, true);
                })
                ->values()
                ->all();

            if (!empty($tables)) {
                return $tables;
            }
        } catch (\Throwable $e) {
            $this->warn('⚠️  Unable to auto-detect tables: ' . $e->getMessage());
        }

        $this->info('ℹ️  Falling back to default table list.');
        return $this->defaultTables;
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

        $supportsAppend = false;
        $primaryColumns = [];

        if ($this->preserveExisting) {
            $primaryColumns = $this->getPrimaryKeyColumns('pgsql_local', $table);
            if (count($primaryColumns) === 1) {
                $supportsAppend = true;
            } else {
                $this->warn("  ⚠️  Append mode not supported for '{$table}'. Performing full replace.");
            }
        }

        $inserted = 0;

        if (!$supportsAppend) {
            // Replace mode: clear local table first
            DB::connection('pgsql_local')->table($table)->truncate();
        }

        $existingKeys = [];
        $primaryColumn = $supportsAppend ? $primaryColumns[0] : null;

        if ($supportsAppend && $primaryColumn) {
            $existing = DB::connection('pgsql_local')
                ->table($table)
                ->pluck($primaryColumn)
                ->all();
            $existingKeys = array_fill_keys($existing, true);
        }

        // Insert data in chunks for better performance
        $chunks = $cloudData->chunk(100);
        foreach ($chunks as $chunk) {
            $rows = json_decode(json_encode($chunk), true);

            if ($supportsAppend && $primaryColumn) {
                $rows = array_values(array_filter($rows, function ($row) use (&$existingKeys, $primaryColumn) {
                    if (!array_key_exists($primaryColumn, $row)) {
                        return false;
                    }
                    $key = $row[$primaryColumn];
                    if (isset($existingKeys[$key])) {
                        return false;
                    }
                    $existingKeys[$key] = true;
                    return true;
                }));
            }

            if (empty($rows)) {
                continue;
            }

            DB::connection('pgsql_local')->table($table)->insert($rows);
            $inserted += count($rows);
        }

        $syncedCount = $supportsAppend ? $inserted : $count;

        $this->info(sprintf(
            '  ✅ Synced %d records%s',
            $syncedCount,
            $supportsAppend ? ' (new rows only)' : ''
        ));

        return $syncedCount;
    }

    protected function getPrimaryKeyColumns(string $connection, string $table): array
    {
        try {
            $result = DB::connection($connection)->select(
                'SELECT a.attname AS column_name
                 FROM pg_index i
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                 WHERE i.indrelid = ?::regclass AND i.indisprimary = true',
                [$table]
            );

            return collect($result)
                ->pluck('column_name')
                ->filter()
                ->values()
                ->all();
        } catch (\Throwable $e) {
            $this->warn('  ⚠️  Unable to determine primary key for ' . $table . ': ' . $e->getMessage());
            return [];
        }
    }
}
