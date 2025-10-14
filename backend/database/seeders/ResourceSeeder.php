<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Resource;
use App\Models\Hospital;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        $hospital = Hospital::first();

        $resources = [
            // Evacuation Center - Food & Water
            ['name' => 'Rice', 'category' => 'Food & Water', 'unit' => 'kg', 'received' => 50, 'distributed' => 20, 'quantity' => 30, 'minimum_stock' => 40, 'location' => 'Evacuation Center', 'is_critical' => true, 'hospital_id' => $hospital?->id],
            ['name' => 'Canned Goods', 'category' => 'Food & Water', 'unit' => 'cans', 'received' => 100, 'distributed' => 10, 'quantity' => 90, 'minimum_stock' => 50, 'location' => 'Evacuation Center', 'hospital_id' => $hospital?->id],
            ['name' => 'Bottled Water', 'category' => 'Food & Water', 'unit' => 'bottles', 'received' => 500, 'distributed' => 200, 'quantity' => 300, 'minimum_stock' => 200, 'location' => 'Evacuation Center', 'is_critical' => false, 'hospital_id' => $hospital?->id],
            
            // Evacuation Center - Hygiene
            ['name' => 'Soap', 'category' => 'Hygiene', 'unit' => 'boxes', 'received' => 150, 'distributed' => 75, 'quantity' => 75, 'minimum_stock' => 60, 'location' => 'Evacuation Center', 'hospital_id' => $hospital?->id],
            ['name' => 'Shampoo', 'category' => 'Hygiene', 'unit' => 'sachets', 'received' => 100, 'distributed' => 50, 'quantity' => 50, 'minimum_stock' => 40, 'location' => 'Evacuation Center', 'hospital_id' => $hospital?->id],
            ['name' => 'Conditioner', 'category' => 'Hygiene', 'unit' => 'sachets', 'received' => 100, 'distributed' => 50, 'quantity' => 50, 'minimum_stock' => 40, 'location' => 'Evacuation Center', 'hospital_id' => $hospital?->id],
            ['name' => 'Toothpaste', 'category' => 'Hygiene', 'unit' => 'sachets', 'received' => 100, 'distributed' => 60, 'quantity' => 40, 'minimum_stock' => 35, 'location' => 'Evacuation Center', 'hospital_id' => $hospital?->id],
            ['name' => 'Toothbrush', 'category' => 'Hygiene', 'unit' => 'packs', 'received' => 300, 'distributed' => 60, 'quantity' => 240, 'minimum_stock' => 100, 'location' => 'Evacuation Center', 'hospital_id' => $hospital?->id],
            
            // Medical Facility - Medicine
            ['name' => 'Tylenol', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 90, 'quantity' => 10, 'minimum_stock' => 30, 'location' => 'Medical Facility', 'is_critical' => true, 'expiry_date' => now()->addMonths(8), 'hospital_id' => $hospital?->id],
            ['name' => 'Ibuprofen', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 50, 'distributed' => 40, 'quantity' => 10, 'minimum_stock' => 25, 'location' => 'Medical Facility', 'is_critical' => true, 'expiry_date' => now()->addMonths(10), 'hospital_id' => $hospital?->id],
            ['name' => 'Tempra', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 150, 'distributed' => 100, 'quantity' => 50, 'minimum_stock' => 40, 'location' => 'Medical Facility', 'expiry_date' => now()->addMonths(12), 'hospital_id' => $hospital?->id],
            ['name' => 'Bioflu', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 95, 'quantity' => 5, 'minimum_stock' => 30, 'location' => 'Medical Facility', 'is_critical' => true, 'expiry_date' => now()->addMonths(6), 'hospital_id' => $hospital?->id],
            ['name' => 'Neozep', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 100, 'quantity' => 0, 'minimum_stock' => 25, 'location' => 'Medical Facility', 'is_critical' => true, 'expiry_date' => now()->addMonths(7), 'hospital_id' => $hospital?->id],
            ['name' => 'Antibiotic', 'category' => 'Medicine', 'unit' => 'bottles', 'received' => 100, 'distributed' => 40, 'quantity' => 60, 'minimum_stock' => 50, 'location' => 'Medical Facility', 'requires_refrigeration' => true, 'expiry_date' => now()->addMonths(9), 'hospital_id' => $hospital?->id],
            
            // Medical Facility - First Aid Kit
            ['name' => 'Tweezers', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Medical Facility', 'hospital_id' => $hospital?->id],
            ['name' => 'Triangular Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Medical Facility', 'hospital_id' => $hospital?->id],
            ['name' => 'Adhesive Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 10, 'quantity' => 10, 'minimum_stock' => 8, 'location' => 'Medical Facility', 'hospital_id' => $hospital?->id],
            ['name' => 'Roller Bandage', 'category' => 'First Aid Kit', 'unit' => 'pieces', 'received' => 20, 'distributed' => 0, 'quantity' => 20, 'minimum_stock' => 10, 'location' => 'Medical Facility', 'hospital_id' => $hospital?->id],
            ['name' => 'Betadine', 'category' => 'First Aid Kit', 'unit' => 'bottles', 'received' => 50, 'distributed' => 50, 'quantity' => 0, 'minimum_stock' => 15, 'location' => 'Medical Facility', 'is_critical' => true, 'hospital_id' => $hospital?->id],
            ['name' => 'Band Aid', 'category' => 'First Aid Kit', 'unit' => 'packs', 'received' => 100, 'distributed' => 65, 'quantity' => 45, 'minimum_stock' => 40, 'location' => 'Medical Facility', 'hospital_id' => $hospital?->id],
        ];

        foreach ($resources as $resource) {
            $res = Resource::create($resource);
            $res->updateStatus();
        }
    }
}