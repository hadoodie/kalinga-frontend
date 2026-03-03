<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class DatabaseConnectionManager
{
    private const CLOUD_CONNECTION = 'pgsql_cloud';
    private const LOCAL_CONNECTION = 'pgsql_local';
    private const FAILOVER_CACHE_KEY = 'db_failover_status';
    private const CONNECTION_CHECK_INTERVAL = 60; // seconds

    /**
     * Get the active database connection (cloud or local based on availability)
     */
    public static function getActiveConnection(): string
    {
        // Check if we're already in failover mode
        $failoverStatus = Cache::get(self::FAILOVER_CACHE_KEY);
        
        if ($failoverStatus === 'local') {
            // Try to reconnect to cloud periodically
            if (self::shouldRetryCloudConnection()) {
                if (self::isCloudAvailable()) {
                    Log::info('Cloud database reconnected, switching back from local');
                    Cache::forget(self::FAILOVER_CACHE_KEY);
                    Cache::forget(self::FAILOVER_CACHE_KEY . '_last_check');
                    return self::CLOUD_CONNECTION;
                }
            }
            return self::LOCAL_CONNECTION;
        }

        // Try cloud first
        if (self::isCloudAvailable()) {
            return self::CLOUD_CONNECTION;
        }

        // Fallback to local
        Log::warning('Cloud database unavailable, switching to local database');
        Cache::put(self::FAILOVER_CACHE_KEY, 'local', now()->addHours(24));
        Cache::put(self::FAILOVER_CACHE_KEY . '_last_check', now(), now()->addHours(24));
        
        return self::LOCAL_CONNECTION;
    }

    /**
     * Check if cloud database is available
     */
    public static function isCloudAvailable(): bool
    {
        try {
            DB::connection(self::CLOUD_CONNECTION)->getPdo();
            DB::connection(self::CLOUD_CONNECTION)->select('SELECT 1');
            return true;
        } catch (Exception $e) {
            Log::debug('Cloud database check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if local database is available
     */
    public static function isLocalAvailable(): bool
    {
        try {
            DB::connection(self::LOCAL_CONNECTION)->getPdo();
            DB::connection(self::LOCAL_CONNECTION)->select('SELECT 1');
            return true;
        } catch (Exception $e) {
            Log::debug('Local database check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if we should retry cloud connection
     */
    private static function shouldRetryCloudConnection(): bool
    {
        $lastCheck = Cache::get(self::FAILOVER_CACHE_KEY . '_last_check');
        
        if (!$lastCheck) {
            return true;
        }

        return now()->diffInSeconds($lastCheck) >= self::CONNECTION_CHECK_INTERVAL;
    }

    /**
     * Get connection status
     */
    public static function getConnectionStatus(): array
    {
        $cloudAvailable = self::isCloudAvailable();
        $localAvailable = self::isLocalAvailable();
        $activeConnection = self::getActiveConnection();
        $isFailover = Cache::has(self::FAILOVER_CACHE_KEY);

        return [
            'cloud_available' => $cloudAvailable,
            'local_available' => $localAvailable,
            'active_connection' => $activeConnection,
            'is_failover' => $isFailover,
            'status' => $cloudAvailable ? 'healthy' : ($localAvailable ? 'failover' : 'critical'),
        ];
    }

    /**
     * Force reconnection attempt
     */
    public static function forceReconnect(): bool
    {
        Cache::forget(self::FAILOVER_CACHE_KEY);
        Cache::forget(self::FAILOVER_CACHE_KEY . '_last_check');
        
        return self::isCloudAvailable();
    }
}
