<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $req = \Illuminate\Http\Request::create('/api/incidents/1/status', 'POST', ['status' => 'needs_support']);
    $req->setUserResolver(function() { return \App\Models\User::first(); });
    
    $controller = app(\App\Http\Controllers\Api\IncidentApiController::class);
    $incident = \App\Models\Incident::first();
    
    if (!$incident) {
        echo "No incident to test.";
        exit;
    }
    
    $controller->updateStatus($req, $incident);
    echo "SUCCESS\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
