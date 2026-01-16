<?php

namespace App\Observers;

use App\Models\Asset;

class AssetObserver
{
    public function creating(Asset $asset)
    {
        // Not possible here — $asset->id is still null
    }

    public function created(Asset $asset)
    {
        // This runs AFTER the record is saved → $asset->id exists
        $asset->asset_code = 'AST-' . str_pad($asset->id, 5, '0', STR_PAD_LEFT); // AST-00001
        $asset->saveQuietly(); // bypasses events to prevent loop
    }
}