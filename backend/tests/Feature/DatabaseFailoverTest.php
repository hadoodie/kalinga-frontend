<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use App\Services\DatabaseConnectionManager;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DatabaseFailoverTest extends TestCase
{
    /**
     * Test that connection manager detects cloud availability
     */
    public function test_cloud_availability_check()
    {
        $isAvailable = DatabaseConnectionManager::isCloudAvailable();
        
        $this->assertIsBool($isAvailable);
        
        if ($isAvailable) {
            $this->assertTrue($isAvailable, 'Cloud database should be available');
        }
    }

    /**
     * Test that connection manager detects local availability
     */
    public function test_local_availability_check()
    {
        $isAvailable = DatabaseConnectionManager::isLocalAvailable();
        
        $this->assertIsBool($isAvailable);
        $this->assertTrue($isAvailable, 'Local database should be available for tests');
    }

    /**
     * Test getting active connection
     */
    public function test_get_active_connection()
    {
        $connection = DatabaseConnectionManager::getActiveConnection();
        
        $this->assertContains($connection, ['pgsql_cloud', 'pgsql_local']);
    }

    /**
     * Test connection status array structure
     */
    public function test_connection_status_structure()
    {
        $status = DatabaseConnectionManager::getConnectionStatus();
        
        $this->assertIsArray($status);
        $this->assertArrayHasKey('cloud_available', $status);
        $this->assertArrayHasKey('local_available', $status);
        $this->assertArrayHasKey('active_connection', $status);
        $this->assertArrayHasKey('is_failover', $status);
        $this->assertArrayHasKey('status', $status);
        
        $this->assertContains($status['status'], ['healthy', 'failover', 'critical']);
    }

    /**
     * Test failover cache mechanism
     */
    public function test_failover_cache()
    {
        // Clear any existing failover status
        Cache::forget('db_failover_status');
        Cache::forget('db_failover_status_last_check');
        
        $initialStatus = DatabaseConnectionManager::getConnectionStatus();
        $this->assertFalse($initialStatus['is_failover']);
        
        // Simulate failover by setting cache
        Cache::put('db_failover_status', 'local', now()->addHours(1));
        
        $failoverStatus = DatabaseConnectionManager::getConnectionStatus();
        $this->assertTrue($failoverStatus['is_failover']);
        
        // Clean up
        Cache::forget('db_failover_status');
        Cache::forget('db_failover_status_last_check');
    }

    /**
     * Test force reconnect functionality
     */
    public function test_force_reconnect()
    {
        // Set failover status
        Cache::put('db_failover_status', 'local', now()->addHours(1));
        
        // Force reconnect
        $reconnected = DatabaseConnectionManager::forceReconnect();
        
        $this->assertIsBool($reconnected);
        
        // Cache should be cleared
        $this->assertFalse(Cache::has('db_failover_status'));
        
        // Clean up
        Cache::forget('db_failover_status_last_check');
    }

    /**
     * Test middleware applies database connection
     */
    public function test_middleware_applies_connection()
    {
        // Make a request (middleware will be applied)
        $response = $this->get('/up'); // Health check endpoint
        
        $response->assertStatus(200);
        
        // Check debug headers if app is in debug mode
        if (config('app.debug')) {
            $this->assertTrue(
                $response->headers->has('X-Database-Connection') || 
                $response->headers->has('x-database-connection')
            );
        }
    }
}
