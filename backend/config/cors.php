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
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'], // changed to '*' to ensure all methods work

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'https://kalinga-frontend.onrender.com', // <--- THIS WAS MISSING
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
        'http://localhost:4174',
        'http://localhost:4000',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:4174',
        'http://127.0.0.1:4000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // changed to '*' to avoid header blocking

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Enable for cookie-based authentication

];