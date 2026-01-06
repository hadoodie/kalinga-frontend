<?php

namespace App\Observers;

use App\Models\MaintenanceLog;

class MaintenanceLogObserver
{
    public function created(MaintenanceLog $log)
    {
        $log->maintenance_code = 'MTN-' . str_pad($log->id, 5, '0', STR_PAD_LEFT); // MTN-00001
        $log->saveQuietly();
    }
}