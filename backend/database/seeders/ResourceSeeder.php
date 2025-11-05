<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Resource;
use App\Models\Hospital;
use App\Models\User;
use App\Models\StockMovement;
use Carbon\Carbon;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        Resource::truncate();
        StockMovement::truncate();
        
        $hospitals = Hospital::all();
        $users = User::all();
        
        $central = $hospitals->firstWhere('name', 'Central General Hospital');
        $emergency = $hospitals->firstWhere('name', 'Emergency Field Hospital');
        $stLukes = $hospitals->firstWhere('name', "St. Luke's Medical Center");

        // Get actual user IDs
        $adminUser = $users->firstWhere('email', 'admin@kalinga.com');
        $logisticsUser = $users->firstWhere('email', 'logistics_verified@kalinga.com');

        $resources = [
            // Central General Hospital - Medicine
            [
                'name' => 'Tylenol', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 100, 'distributed' => 90, 'quantity' => 10, 
                'minimum_stock' => 30, 'location' => 'Central General Hospital', 
                'is_critical' => true, 'expiry_date' => now()->addMonths(8), 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(2),
                'last_status_change_date' => now()->subDays(1),
                'significant_quantity_date' => now()->subDays(5),
                'expiry_alert_date' => now()->addMonths(8)->subDays(30),
            ],
            [
                'name' => 'Ibuprofen', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 50, 'distributed' => 40, 'quantity' => 10, 
                'minimum_stock' => 25, 'location' => 'Central General Hospital', 
                'is_critical' => true, 'expiry_date' => now()->addMonths(10), 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(3),
                'last_status_change_date' => now()->subDays(2),
                'significant_quantity_date' => now()->subDays(7),
                'expiry_alert_date' => now()->addMonths(10)->subDays(30),
            ],
            [
                'name' => 'Tempra', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 150, 'distributed' => 100, 'quantity' => 50, 
                'minimum_stock' => 40, 'location' => 'Central General Hospital', 
                'expiry_date' => now()->addMonths(12), 'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(1),
                'last_status_change_date' => now()->subDays(10),
                'significant_quantity_date' => now()->subDays(15),
                'expiry_alert_date' => now()->addMonths(12)->subDays(30),
            ],
            [
                'name' => 'Bioflu', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 100, 'distributed' => 95, 'quantity' => 5, 
                'minimum_stock' => 30, 'location' => 'Central General Hospital', 
                'is_critical' => true, 'expiry_date' => now()->addMonths(6), 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(5),
                'last_status_change_date' => now()->subDays(3),
                'significant_quantity_date' => now()->subDays(8),
                'expiry_alert_date' => now()->addMonths(6)->subDays(30),
            ],
            [
                'name' => 'Neozep', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 100, 'distributed' => 100, 'quantity' => 0, 
                'minimum_stock' => 25, 'location' => 'Central General Hospital', 
                'is_critical' => true, 'expiry_date' => now()->addMonths(7), 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(1),
                'last_status_change_date' => now()->subDays(1),
                'significant_quantity_date' => now()->subDays(2),
                'expiry_alert_date' => now()->addMonths(7)->subDays(30),
            ],
            [
                'name' => 'Antibiotic', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 100, 'distributed' => 40, 'quantity' => 60, 
                'minimum_stock' => 50, 'location' => 'Central General Hospital', 
                'requires_refrigeration' => true, 'expiry_date' => now()->addMonths(9), 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(7),
                'last_status_change_date' => now()->subDays(20),
                'significant_quantity_date' => now()->subDays(25),
                'expiry_alert_date' => now()->addMonths(9)->subDays(30),
            ],
            
            // Central General Hospital - First Aid Kit
            [
                'name' => 'Tweezers', 'category' => 'First Aid Kit', 'unit' => 'pieces', 
                'received' => 20, 'distributed' => 0, 'quantity' => 20, 
                'minimum_stock' => 10, 'location' => 'Central General Hospital', 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(15),
                'last_status_change_date' => now()->subDays(30),
                'significant_quantity_date' => null,
                'expiry_alert_date' => null,
            ],
            [
                'name' => 'Triangular Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 
                'received' => 20, 'distributed' => 0, 'quantity' => 20, 
                'minimum_stock' => 10, 'location' => 'Central General Hospital', 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(12),
                'last_status_change_date' => now()->subDays(25),
                'significant_quantity_date' => null,
                'expiry_alert_date' => null,
            ],
            [
                'name' => 'Adhesive Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 
                'received' => 20, 'distributed' => 10, 'quantity' => 10, 
                'minimum_stock' => 8, 'location' => 'Central General Hospital', 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(8),
                'last_status_change_date' => now()->subDays(8),
                'significant_quantity_date' => now()->subDays(8),
                'expiry_alert_date' => null,
            ],
            [
                'name' => 'Roller Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 
                'received' => 20, 'distributed' => 0, 'quantity' => 20, 
                'minimum_stock' => 10, 'location' => 'Central General Hospital', 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(18),
                'last_status_change_date' => now()->subDays(35),
                'significant_quantity_date' => null,
                'expiry_alert_date' => null,
            ],
            [
                'name' => 'Betadine', 'category' => 'First Aid Kit', 'unit' => 'bottles', 
                'received' => 50, 'distributed' => 50, 'quantity' => 0, 
                'minimum_stock' => 15, 'location' => 'Central General Hospital', 
                'is_critical' => true, 'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(2),
                'last_status_change_date' => now()->subDays(2),
                'significant_quantity_date' => now()->subDays(2),
                'expiry_alert_date' => null,
            ],
            [
                'name' => 'Band Aid', 'category' => 'First Aid Kit', 'unit' => 'packs', 
                'received' => 100, 'distributed' => 65, 'quantity' => 45, 
                'minimum_stock' => 40, 'location' => 'Central General Hospital', 
                'hospital_id' => $central?->id,
                'last_stock_movement_date' => now()->subDays(4),
                'last_status_change_date' => now()->subDays(4),
                'significant_quantity_date' => now()->subDays(4),
                'expiry_alert_date' => null,
            ],

            // Emergency Field Hospital - Medicine
            [
                'name' => 'Tylenol', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 200, 'distributed' => 90, 'quantity' => 110, 
                'minimum_stock' => 40, 'location' => 'Emergency Field Hospital', 
                'is_critical' => true, 'expiry_date' => now()->addMonths(8), 
                'hospital_id' => $emergency?->id,
                'last_stock_movement_date' => now()->subDays(1),
                'last_status_change_date' => now()->subDays(15),
                'significant_quantity_date' => null,
                'expiry_alert_date' => now()->addMonths(8)->subDays(30),
            ],
            [
                'name' => 'Ibuprofen', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 100, 'distributed' => 40, 'quantity' => 60, 
                'minimum_stock' => 35, 'location' => 'Emergency Field Hospital', 
                'is_critical' => true, 'expiry_date' => now()->addMonths(10), 
                'hospital_id' => $emergency?->id,
                'last_stock_movement_date' => now()->subDays(3),
                'last_status_change_date' => now()->subDays(20),
                'significant_quantity_date' => null,
                'expiry_alert_date' => now()->addMonths(10)->subDays(30),
            ],
            [
                'name' => 'Tempra', 'category' => 'Medicine', 'unit' => 'bottles', 
                'received' => 100, 'distributed' => 100, 'quantity' => 0, 
                'minimum_stock' => 45, 'location' => 'Emergency Field Hospital', 
                'expiry_date' => now()->addMonths(12), 'hospital_id' => $emergency?->id,
                'last_stock_movement_date' => now()->subDays(2),
                'last_status_change_date' => now()->subDays(2),
                'significant_quantity_date' => now()->subDays(2),
                'expiry_alert_date' => now()->addMonths(12)->subDays(30),
            ],

            // Add more resources as needed from your original seeder...
        ];

        $createdResources = [];
        foreach ($resources as $resource) {
            $res = Resource::create($resource);
            $res->updateStatus();
            $createdResources[] = $res;
            
            // Create extensive stock movements for 2025
            $this->createExtensiveStockMovements($res, $adminUser?->id);
        }
    }

    /**
     * Create extensive stock movements throughout 2025
     */
    private function createExtensiveStockMovements(Resource $resource, $userId = null)
    {
        $movements = [];
        $currentQuantity = $resource->quantity;
        
        // Create 8-12 movements per resource spread throughout 2025
        $movementCount = rand(8, 12);
        
        // Start from January 2025
        $startDate = Carbon::create(2025, 1, 1);
        
        for ($i = 0; $i < $movementCount; $i++) {
            // Spread movements throughout 2025 (Jan to Dec)
            $daysOffset = rand(0, 364); // Random day in 2025
            $movementDate = $startDate->copy()->addDays($daysOffset);
            
            // Alternate between in and out movements
            $movementType = $i % 2 === 0 ? 'in' : 'out';
            
            // Generate realistic quantities based on resource type
            if ($movementType === 'in') {
                $quantity = $this->getStockInQuantity($resource->category);
                $reason = $this->getStockInReason();
                $newQuantity = $currentQuantity + $quantity;
            } else {
                $quantity = $this->getStockOutQuantity($resource->category, $currentQuantity);
                $reason = $this->getStockOutReason();
                $newQuantity = max(0, $currentQuantity - $quantity);
            }
            
            $movements[] = [
                'resource_id' => $resource->id,
                'movement_type' => $movementType,
                'quantity' => $quantity,
                'previous_quantity' => $currentQuantity,
                'new_quantity' => $newQuantity,
                'reason' => $reason,
                'performed_by' => $userId,
                'created_at' => $movementDate,
                'updated_at' => $movementDate,
            ];
            
            $currentQuantity = $newQuantity;
        }

        // Insert all movements
        StockMovement::insert($movements);
    }

    /**
     * Get realistic stock in quantities based on category
     */
    private function getStockInQuantity($category)
    {
        return match($category) {
            'Medicine' => rand(20, 100),
            'First Aid Kit' => rand(10, 50),
            'Specialized Items' => rand(5, 25),
            default => rand(10, 60)
        };
    }

    /**
     * Get realistic stock out quantities based on category and current stock
     */
    private function getStockOutQuantity($category, $currentQuantity)
    {
        $maxOut = min($currentQuantity, match($category) {
            'Medicine' => rand(5, 40),
            'First Aid Kit' => rand(2, 20),
            'Specialized Items' => rand(1, 10),
            default => rand(3, 25)
        });
        
        return max(1, $maxOut);
    }

    /**
     * Get realistic stock in reasons
     */
    private function getStockInReason()
    {
        $reasons = [
            'Stock replenishment from supplier',
            'Emergency shipment received',
            'Monthly supply delivery',
            'Donation from partner organization',
            'Transfer from central warehouse',
            'New shipment arrival',
            'Quarterly stock refresh',
            'Bulk purchase delivery'
        ];
        
        return $reasons[array_rand($reasons)];
    }

    /**
     * Get realistic stock out reasons
     */
    private function getStockOutReason()
    {
        $reasons = [
            'Distribution to patients',
            'Emergency response usage',
            'Routine medical procedures',
            'Transfer to other facility',
            'Daily consumption',
            'Scheduled distribution',
            'Emergency kit restocking',
            'Patient discharge supplies'
        ];
        
        return $reasons[array_rand($reasons)];
    }
}