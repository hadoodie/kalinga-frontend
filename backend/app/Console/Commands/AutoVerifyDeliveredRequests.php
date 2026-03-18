<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Request as SupplyRequest;
use Carbon\Carbon;
use App\Http\Controllers\Api\LogisticsStatusController;
use Illuminate\Http\Request;

class AutoVerifyDeliveredRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logistics:auto-verify';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically verified delivered requests that have been idle for more than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Find requests that are delivered but haven't been updated in 24 hours
        $cutoff = Carbon::now()->subHours(24);
        
        $idleRequests = SupplyRequest::where('status', 'delivered')
            ->where('updated_at', '<=', $cutoff)
            ->get();

        if ($idleRequests->isEmpty()) {
            $this->info('No idle delivered requests to verify.');
            return;
        }

        $logisticsController = new LogisticsStatusController();

        $count = 0;
        foreach ($idleRequests as $supplyRequest) {
            try {
                // Mock an HTTP request to reuse the central controller logic
                $mockRequest = Request::create('/api/logistics/requests/' . $supplyRequest->id . '/status', 'PATCH', [
                    'status' => 'verified'
                ]);
                $logisticsController->updateStatus($mockRequest, $supplyRequest->id);
                $count++;
            } catch (\Exception $e) {
                $this->error('Failed to auto-verify request ID ' . $supplyRequest->id . ': ' . $e->getMessage());
            }
        }

        $this->info("Successfully auto-verified {$count} requests.");
    }
}
