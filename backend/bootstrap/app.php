<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Removed statefulApi() to make API truly stateless (token-based)
        // statefulApi() adds session and CSRF middleware which we don't need
        
        // Add database failover middleware globally
        $middleware->append(\App\Http\Middleware\DatabaseFailoverMiddleware::class);
        
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return JSON for API requests instead of HTML error pages
        $exceptions->shouldRenderJsonWhen(function ($request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Ensure CORS headers are present even on exception responses.
        // Without this, a 500 crash before HandleCors runs causes the browser
        // to report a CORS error instead of the actual server error.
        $exceptions->renderable(function (\Throwable $e, $request) {
            $origin = $request->header('Origin');
            if (!$origin) return null;

            $allowedOrigins = config('cors.allowed_origins', []);
            if (!in_array($origin, $allowedOrigins)) return null;

            // Only intercept API / JSON requests
            if (!$request->is('api/*') && !$request->is('sanctum/*') && !$request->expectsJson()) {
                return null;
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            return response()->json(
                ['message' => $e->getMessage() ?: 'Server error'],
                $status
            )->withHeaders([
                'Access-Control-Allow-Origin'      => $origin,
                'Access-Control-Allow-Credentials' => 'false',
                'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Methods'     => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            ]);
        });

        // Log unexpected exceptions with context
        $exceptions->reportable(function (\Throwable $e) {
            if ($e instanceof \Illuminate\Database\QueryException) {
                \Log::error('Database query failed', [
                    'message' => $e->getMessage(),
                    'sql'     => $e->getSql() ?? null,
                ]);
            }
        });
    })->create();
