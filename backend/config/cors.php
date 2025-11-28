<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To apply these settings, make sure 'HandleCors' middleware is in your
    | global middleware stack in app/Http/Kernel.php (it usually is by default).
    |
    */

    'paths' => ['api/*', 'vitals*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'], // Allow POST, GET, OPTIONS, PUT, DELETE

    'allowed_origins' => ['*'], // Allow requests from ANY IP (React on laptop/phone)

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // Allow Content-Type header

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
