<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Resource;
use App\Models\Hospital;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        Resource::truncate();
        
        $hospitals = Hospital::all();
        
        $central = $hospitals->firstWhere('name', 'Central General Hospital');
        $emergency = $hospitals->firstWhere('name', 'Emergency Field Hospital');
        $stLukes = $hospitals->firstWhere('name', "St. Luke's Medical Center");

        $resources = [
            // Central General Hospital - Medicine
            ['name' => 'Tylenol', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 90, 'quantity' => 10, 'minimum_stock' => 30, 'location' => 'Central General Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(8), 'hospital_id' => $central?->id],
            ['name' => 'Ibuprofen', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 50, 'distributed' => 40, 'quantity' => 10, 'minimum_stock' => 25, 'location' => 'Central General Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(10), 'hospital_id' => $central?->id],
            ['name' => 'Tempra', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 40, 'location' => 'Central General Hospital', 'expiry_date' => now()->addMonths(12), 'hospital_id' => $central?->id],
            ['name' => 'Bioflu', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 95, 'quantity' => 5, 'minimum_stock' => 30, 'location' => 'Central General Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(6), 'hospital_id' => $central?->id],
            ['name' => 'Neozep', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 100, 'quantity' => 0, 'minimum_stock' => 25, 'location' => 'Central General Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(7), 'hospital_id' => $central?->id],
            ['name' => 'Antibiotic', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 40, 'quantity' => 60, 'minimum_stock' => 50, 'location' => 'Central General Hospital', 'requires_refrigeration' => true, 'expiry_date' => now()->addMonths(9), 'hospital_id' => $central?->id],
            
            // Central General Hospital - First Aid Kit
            ['name' => 'Tweezers', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Central General Hospital', 'hospital_id' => $central?->id],
            ['name' => 'Triangular Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Central General Hospital', 'hospital_id' => $central?->id],
            ['name' => 'Adhesive Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 10, 'quantity' => 10, 'minimum_stock' => 8, 'location' => 'Central General Hospital', 'hospital_id' => $central?->id],
            ['name' => 'Roller Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Central General Hospital', 'hospital_id' => $central?->id],
            ['name' => 'Betadine', 'category' => 'First Aid Kit', 'unit' => 'bottles', 'received' => 50, 'distributed' => 50, 'quantity' => 0, 'minimum_stock' => 15, 'location' => 'Central General Hospital', 'is_critical' => true, 'hospital_id' => $central?->id],
            ['name' => 'Band Aid', 'category' => 'First Aid Kit', 'unit' => 'packs', 'received' => 100, 'distributed' => 65, 'quantity' => 45, 'minimum_stock' => 40, 'location' => 'Central General Hospital', 'hospital_id' => $central?->id],

            // Emergency Field Hospital - Medicine
            ['name' => 'Tylenol', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 200, 'distributed' => 90, 'quantity' => 110, 'minimum_stock' => 40, 'location' => 'Emergency Field Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(8), 'hospital_id' => $emergency?->id],
            ['name' => 'Ibuprofen', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 40, 'quantity' => 60, 'minimum_stock' => 35, 'location' => 'Emergency Field Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(10), 'hospital_id' => $emergency?->id],
            ['name' => 'Tempra', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 100, 'quantity' => 0, 'minimum_stock' => 45, 'location' => 'Emergency Field Hospital', 'expiry_date' => now()->addMonths(12), 'hospital_id' => $emergency?->id],
            ['name' => 'Bioflu', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 20, 'location' => 'Emergency Field Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(6), 'hospital_id' => $emergency?->id],
            ['name' => 'Neozep', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 15, 'location' => 'Emergency Field Hospital', 'is_critical' => true, 'expiry_date' => now()->addMonths(7), 'hospital_id' => $emergency?->id],
            ['name' => 'Antibiotic', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 200, 'distributed' => 100, 'quantity' => 100, 'minimum_stock' => 30, 'location' => 'Emergency Field Hospital', 'requires_refrigeration' => true, 'expiry_date' => now()->addMonths(9), 'hospital_id' => $emergency?->id],
            
            // Emergency Field Hospital - First Aid Kit
            ['name' => 'Tweezers', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 10, 'distributed' => 0, 'quantity' => 10, 'minimum_stock' => 10, 'location' => 'Emergency Field Hospital', 'hospital_id' => $emergency?->id],
            ['name' => 'Triangular Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 30, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Emergency Field Hospital', 'hospital_id' => $emergency?->id],
            ['name' => 'Adhesive Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 10, 'distributed' => 10, 'quantity' => 0, 'minimum_stock' => 8, 'location' => 'Emergency Field Hospital', 'is_critical' => true, 'hospital_id' => $emergency?->id],
            ['name' => 'Roller Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Emergency Field Hospital', 'hospital_id' => $emergency?->id],
            ['name' => 'Betadine', 'category' => 'First Aid Kit', 'unit' => 'bottles', 'received' => 20, 'distributed' => 20, 'quantity' => 0, 'minimum_stock' => 15, 'location' => 'Emergency Field Hospital', 'is_critical' => true, 'hospital_id' => $emergency?->id],
            ['name' => 'Band Aid', 'category' => 'First Aid Kit', 'unit' => 'packs', 'received' => 100, 'distributed' => 65, 'quantity' => 45, 'minimum_stock' => 40, 'location' => 'Emergency Field Hospital', 'hospital_id' => $emergency?->id],

            // St. Luke's Medical Center - Medicine
            ['name' => 'Tempra', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 100, 'quantity' => 0, 'minimum_stock' => 45, 'location' => "St. Luke's Medical Center", 'expiry_date' => now()->addMonths(12), 'hospital_id' => $stLukes?->id],
            ['name' => 'Bioflu', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 20, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'expiry_date' => now()->addMonths(6), 'hospital_id' => $stLukes?->id],
            ['name' => 'Neozep', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 15, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'expiry_date' => now()->addMonths(7), 'hospital_id' => $stLukes?->id],
            ['name' => 'Antibiotic', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 200, 'distributed' => 100, 'quantity' => 100, 'minimum_stock' => 30, 'location' => "St. Luke's Medical Center", 'requires_refrigeration' => true, 'expiry_date' => now()->addMonths(9), 'hospital_id' => $stLukes?->id],

            // St. Luke's Medical Center - First Aid Kit
            ['name' => 'Tweezers', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 10, 'distributed' => 0, 'quantity' => 10, 'minimum_stock' => 10, 'location' => "St. Luke's Medical Center", 'hospital_id' => $stLukes?->id],
            ['name' => 'Triangular Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 30, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => "St. Luke's Medical Center", 'hospital_id' => $stLukes?->id],
            ['name' => 'Adhesive Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 10, 'distributed' => 10, 'quantity' => 0, 'minimum_stock' => 8, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'hospital_id' => $stLukes?->id],
            ['name' => 'Roller Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => "St. Luke's Medical Center", 'hospital_id' => $stLukes?->id],
            ['name' => 'Betadine', 'category' => 'First Aid Kit', 'unit' => 'bottles', 'received' => 20, 'distributed' => 20, 'quantity' => 0, 'minimum_stock' => 15, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'hospital_id' => $stLukes?->id],
            ['name' => 'Band Aid', 'category' => 'First Aid Kit', 'unit' => 'packs', 'received' => 100, 'distributed' => 65, 'quantity' => 45, 'minimum_stock' => 40, 'location' => "St. Luke's Medical Center", 'hospital_id' => $stLukes?->id],

            // St. Luke's Medical Center - Specialized Items
            ['name' => 'Implants', 'category' => 'Specialized Items', 'unit' => 'pieces', 'received' => 100, 'distributed' => 100, 'quantity' => 0, 'minimum_stock' => 45, 'location' => "St. Luke's Medical Center", 'expiry_date' => now()->addMonths(12), 'hospital_id' => $stLukes?->id],
            ['name' => 'Sterile Kits', 'category' => 'Specialized Items', 'unit' => 'pieces', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 20, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'expiry_date' => now()->addMonths(6), 'hospital_id' => $stLukes?->id],
            ['name' => 'Surgical Drapes', 'category' => 'Specialized Items', 'unit' => 'pieces', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 15, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'expiry_date' => now()->addMonths(7), 'hospital_id' => $stLukes?->id],
            ['name' => 'Catheters', 'category' => 'Specialized Items', 'unit' => 'pieces', 'received' => 200, 'distributed' => 100, 'quantity' => 100, 'minimum_stock' => 30, 'location' => "St. Luke's Medical Center", 'requires_refrigeration' => true, 'expiry_date' => now()->addMonths(9), 'hospital_id' => $stLukes?->id],
            ['name' => 'Advanced Ventilator', 'category' => 'Specialized Items', 'unit' => 'units', 'received' => 10, 'distributed' => 5, 'quantity' => 5, 'minimum_stock' => 3, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'hospital_id' => $stLukes?->id],
            ['name' => 'Dialysis Machine', 'category' => 'Specialized Items', 'unit' => 'units', 'received' => 8, 'distributed' => 6, 'quantity' => 2, 'minimum_stock' => 4, 'location' => "St. Luke's Medical Center", 'is_critical' => true, 'hospital_id' => $stLukes?->id],
            ['name' => 'Surgical Microscope', 'category' => 'Specialized Items', 'unit' => 'units', 'received' => 5, 'distributed' => 3, 'quantity' => 2, 'minimum_stock' => 2, 'location' => "St. Luke's Medical Center", 'hospital_id' => $stLukes?->id],
        ];

        foreach ($resources as $resource) {
            $res = Resource::create($resource);
            $res->updateStatus();
        }
    }
}