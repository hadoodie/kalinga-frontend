<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Services\DatabaseConnectionManager;
use Symfony\Component\HttpFoundation\Response;

class DatabaseFailoverMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the active connection (cloud or local based on availability)
        $activeConnection = DatabaseConnectionManager::getActiveConnection();
        
        // Set the default connection dynamically
        Config::set('database.default', $activeConnection);
        DB::setDefaultConnection($activeConnection);

        // Add connection info to response headers (for debugging)
        $response = $next($request);
        
        if (config('app.debug')) {
            $response->headers->set('X-Database-Connection', $activeConnection);
            $status = DatabaseConnectionManager::getConnectionStatus();
            $response->headers->set('X-Database-Status', $status['status']);
        }

        return $response;
    }
}
