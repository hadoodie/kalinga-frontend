<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = \App\Models\User::first();
    $req = \Illuminate\Http\Request::create('/api/broadcasting/auth', 'POST', [
        'channel_name' => 'presence-online',
        'socket_id' => '123.123'
    ]);
    $req->setUserResolver(function() use ($user) { return $user; });
    $res = \Illuminate\Support\Facades\Broadcast::auth($req);
    dump($res);
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
