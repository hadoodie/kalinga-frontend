<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatabaseConnectionManager;

class CheckDatabaseStatus extends Command
{
    protected $signature = 'db:status 
                            {--force-reconnect : Force reconnection attempt to cloud database}';

    protected $description = 'Check database connection status and failover state';

    public function handle()
    {
        $this->info('🔍 Checking Database Connection Status...');
        $this->newLine();

        if ($this->option('force-reconnect')) {
            $this->info('🔄 Forcing reconnection attempt...');
            $reconnected = DatabaseConnectionManager::forceReconnect();
            
            if ($reconnected) {
                $this->info('✅ Successfully reconnected to cloud database');
            } else {
                $this->warn('❌ Cloud database still unavailable');
            }
            $this->newLine();
        }

        $status = DatabaseConnectionManager::getConnectionStatus();

        // Cloud Database Status
        $this->line('☁️  <info>Cloud Database (Supabase):</info>');
        $this->line('   Status: ' . ($status['cloud_available'] ? '<fg=green>● Online</>' : '<fg=red>● Offline</>'));
        $this->line('   Connection: pgsql_cloud');
        $this->newLine();

        // Local Database Status
        $this->line('💾 <info>Local Database (Backup):</info>');
        $this->line('   Status: ' . ($status['local_available'] ? '<fg=green>● Online</>' : '<fg=red>● Offline</>'));
        $this->line('   Connection: pgsql_local');
        $this->newLine();

        // Active Connection
        $this->line('🎯 <info>Active Connection:</info>');
        $connectionName = $status['active_connection'] === 'pgsql_cloud' ? 'Cloud (Supabase)' : 'Local (Backup)';
        $this->line("   Current: <comment>$connectionName</comment>");
        $this->newLine();

        // System Status
        $this->line('📊 <info>System Status:</info>');
        $statusColor = match ($status['status']) {
            'healthy' => 'green',
            'failover' => 'yellow',
            'critical' => 'red',
            default => 'white',
        };
        $statusText = match ($status['status']) {
            'healthy' => '✅ Healthy (Using Cloud)',
            'failover' => '⚠️  Failover Mode (Using Local Backup)',
            'critical' => '❌ Critical (All Connections Failed)',
            default => '❓ Unknown',
        };
        $this->line("   <fg=$statusColor>$statusText</>");
        
        if ($status['is_failover']) {
            $this->newLine();
            $this->warn('⚠️  System is in FAILOVER MODE');
            $this->warn('   - Application is using local backup database');
            $this->warn('   - Changes made will be local only');
            $this->warn('   - Run "php artisan db:sync-local-to-cloud" when cloud is restored');
        }

        $this->newLine();

        // Recommendations
        if (!$status['cloud_available'] && $status['local_available']) {
            $this->warn('💡 Recommendations:');
            $this->warn('   1. Check internet connection');
            $this->warn('   2. Verify Supabase service status');
            $this->warn('   3. Check cloud database credentials in .env');
            $this->warn('   4. Run "php artisan db:status --force-reconnect" to retry');
        } elseif (!$status['local_available'] && $status['cloud_available']) {
            $this->warn('💡 Recommendations:');
            $this->warn('   1. Check local PostgreSQL service is running');
            $this->warn('   2. Verify local database exists: psql -U postgres -l | grep db_kalinga');
            $this->warn('   3. Run migrations: php artisan migrate --database=pgsql_local');
        } elseif (!$status['cloud_available'] && !$status['local_available']) {
            $this->error('💡 CRITICAL: Both databases are offline!');
            $this->error('   1. Start local PostgreSQL service');
            $this->error('   2. Check internet connection for cloud access');
            $this->error('   3. Verify all database credentials');
        }

        return $status['cloud_available'] || $status['local_available'] ? 0 : 1;
    }
}
