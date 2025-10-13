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
            // Food
            ['name' => 'Rice 25kg', 'category' => 'food', 'unit' => 'kg', 'quantity' => 500, 'minimum_stock' => 100, 'location' => 'Aisle 1, Shelf A', 'is_critical' => true, 'hospital_id' => $hospital?->id],
            ['name' => 'Canned Goods (Assorted)', 'category' => 'food', 'unit' => 'cans', 'quantity' => 1000, 'minimum_stock' => 200, 'location' => 'Aisle 1, Shelf B', 'hospital_id' => $hospital?->id],
            ['name' => 'Instant Noodles', 'category' => 'food', 'unit' => 'packs', 'quantity' => 2000, 'minimum_stock' => 500, 'location' => 'Aisle 1, Shelf C', 'hospital_id' => $hospital?->id],
            // Water
            ['name' => 'Bottled Water 500ml', 'category' => 'water', 'unit' => 'bottles', 'quantity' => 3000, 'minimum_stock' => 1000, 'location' => 'Aisle 2, Shelf A', 'is_critical' => true, 'hospital_id' => $hospital?->id],
            ['name' => 'Water Purification Tablets', 'category' => 'water', 'unit' => 'boxes', 'quantity' => 50, 'minimum_stock' => 20, 'location' => 'Aisle 2, Shelf B', 'hospital_id' => $hospital?->id],
            // Medical
            ['name' => 'First Aid Kit', 'category' => 'medical', 'unit' => 'kits', 'quantity' => 100, 'minimum_stock' => 30, 'location' => 'Medical Storage', 'is_critical' => true, 'hospital_id' => $hospital?->id],
            ['name' => 'Paracetamol 500mg', 'category' => 'medical', 'unit' => 'boxes', 'quantity' => 200, 'minimum_stock' => 50, 'location' => 'Medical Storage', 'expiry_date' => now()->addYear(), 'hospital_id' => $hospital?->id],
            ['name' => 'Antibiotics', 'category' => 'medical', 'unit' => 'boxes', 'quantity' => 80, 'minimum_stock' => 30, 'location' => 'Medical Storage', 'requires_refrigeration' => true, 'is_critical' => true, 'expiry_date' => now()->addMonths(6), 'hospital_id' => $hospital?->id],
            // Clothing
            ['name' => 'Blankets', 'category' => 'clothing', 'unit' => 'pieces', 'quantity' => 500, 'minimum_stock' => 100, 'location' => 'Aisle 3, Shelf A', 'hospital_id' => $hospital?->id],
            ['name' => 'T-Shirts (Assorted Sizes)', 'category' => 'clothing', 'unit' => 'pieces', 'quantity' => 300, 'minimum_stock' => 100, 'location' => 'Aisle 3, Shelf B', 'hospital_id' => $hospital?->id],
            // Shelter
            ['name' => 'Tents (4-person)', 'category' => 'shelter', 'unit' => 'units', 'quantity' => 50, 'minimum_stock' => 20, 'location' => 'Warehouse B', 'hospital_id' => $hospital?->id],
            ['name' => 'Tarpaulins', 'category' => 'shelter', 'unit' => 'sheets', 'quantity' => 200, 'minimum_stock' => 50, 'location' => 'Warehouse B', 'hospital_id' => $hospital?->id],
            // Equipment
            ['name' => 'Flashlights', 'category' => 'equipment', 'unit' => 'pieces', 'quantity' => 150, 'minimum_stock' => 50, 'location' => 'Equipment Room', 'hospital_id' => $hospital?->id],
            ['name' => 'Batteries (AA)', 'category' => 'equipment', 'unit' => 'packs', 'quantity' => 300, 'minimum_stock' => 100, 'location' => 'Equipment Room', 'hospital_id' => $hospital?->id],
            ['name' => 'Portable Radio', 'category' => 'equipment', 'unit' => 'units', 'quantity' => 30, 'minimum_stock' => 10, 'location' => 'Equipment Room', 'hospital_id' => $hospital?->id],
        ];

        foreach ($resources as $resource) {
            $res = Resource::create($resource);
            $res->updateStatus();
        }
    }
}