<?php

namespace Database\Seeders;

use App\Models\Hospital;
use App\Models\Resource;
use Illuminate\Database\Seeder;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        // Keep IDs stable for forecast/history relations: do not truncate resources.
        mt_srand(20260414);

        $hospitals = Hospital::query()->where('is_active', 'true')->get();

        $profiles = [
            // Tertiary / regional medical centers
            'RIZ-NTRH-001' => ['tier' => 'tertiary', 'load' => 0.86],
            'NCR-RMC-001' => ['tier' => 'tertiary', 'load' => 0.91],
            'NCR-ARMMC-001' => ['tier' => 'tertiary', 'load' => 0.89],

            // Provincial main and strong secondary centers
            'RIZ-RPHS-MOR-001' => ['tier' => 'secondary', 'load' => 0.83],
            'RIZ-RPHS-CAY-001' => ['tier' => 'secondary', 'load' => 0.84],
            'RIZ-ANG-001' => ['tier' => 'secondary', 'load' => 0.80],

            // Annex / satellite facilities
            'RIZ-RPHS-ANT1-001' => ['tier' => 'annex', 'load' => 0.77],
            'RIZ-RPHS-ANT2-001' => ['tier' => 'annex', 'load' => 0.78],
            'RIZ-RPHS-ANT3-001' => ['tier' => 'annex', 'load' => 0.74],
            'RIZ-RPHS-BIN-001' => ['tier' => 'annex', 'load' => 0.79],
            'RIZ-RPHS-TAN-001' => ['tier' => 'annex', 'load' => 0.76],

            // Additional Montalban / QC / San Mateo hospitals
            'RIZ-MONTALBAN-MHC-001' => ['tier' => 'annex', 'load' => 0.80],
            'RIZ-HVILL-001' => ['tier' => 'annex', 'load' => 0.77],
            'RIZ-NMEDCARE-001' => ['tier' => 'annex', 'load' => 0.79],
            'NCR-RMBGH-001' => ['tier' => 'secondary', 'load' => 0.85],
            'RIZ-SMMC-001' => ['tier' => 'secondary', 'load' => 0.84],
            'NCR-SLH-001' => ['tier' => 'secondary', 'load' => 0.82],
            'NCR-CHMC-001' => ['tier' => 'secondary', 'load' => 0.86],
        ];

        foreach ($hospitals as $hospital) {
            $profile = $profiles[$hospital->code] ?? ['tier' => 'secondary', 'load' => 0.80];
            $resources = $this->buildResourceSet($hospital, $profile['tier'], $profile['load']);

            foreach ($resources as $resource) {
                $resourceModel = Resource::updateOrCreate(
                    [
                        'hospital_id' => $hospital->id,
                        'name' => $resource['name'],
                    ],
                    $resource,
                );

                $resourceModel->updateStatus();
            }
        }
    }

    private function buildResourceSet(Hospital $hospital, string $tier, float $load): array
    {
        $tierMultiplier = match ($tier) {
            'tertiary' => 1.30,
            'secondary' => 0.95,
            'annex' => 0.60,
            default => 0.90,
        };

        $resourceTemplates = [
            [
                'name' => 'Trauma Bed Capacity',
                'category' => 'Specialized Items',
                'unit' => 'beds',
                'base' => 140,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => null,
            ],
            [
                'name' => 'ICU Ventilator Units',
                'category' => 'Specialized Items',
                'unit' => 'units',
                'base' => 48,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => null,
            ],
            [
                'name' => 'Emergency Oxygen Cylinders',
                'category' => 'Specialized Items',
                'unit' => 'cylinders',
                'base' => 220,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => null,
            ],
            [
                'name' => 'Blood Units (O-Negative)',
                'category' => 'Medicine',
                'unit' => 'units',
                'base' => 120,
                'critical' => true,
                'requires_refrigeration' => true,
                'expiry_months' => 2,
            ],
            [
                'name' => 'Packed Red Cells',
                'category' => 'Medicine',
                'unit' => 'bags',
                'base' => 180,
                'critical' => true,
                'requires_refrigeration' => true,
                'expiry_months' => 1,
            ],
            [
                'name' => 'IV Fluids (Normal Saline)',
                'category' => 'Specialized Items',
                'unit' => 'bags',
                'base' => 700,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => 18,
            ],
            [
                'name' => 'Emergency Antibiotics',
                'category' => 'Medicine',
                'unit' => 'vials',
                'base' => 320,
                'critical' => true,
                'requires_refrigeration' => true,
                'expiry_months' => 10,
            ],
            [
                'name' => 'Burn Dressing Kits',
                'category' => 'First Aid Kit',
                'unit' => 'kits',
                'base' => 180,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => 14,
            ],
            [
                'name' => 'Trauma First Aid Kits',
                'category' => 'First Aid Kit',
                'unit' => 'kits',
                'base' => 240,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => 16,
            ],
            [
                'name' => 'PPE Sets (Level 3)',
                'category' => 'Specialized Items',
                'unit' => 'sets',
                'base' => 460,
                'critical' => false,
                'requires_refrigeration' => false,
                'expiry_months' => 20,
            ],
            [
                'name' => 'Ambulance Fuel Reserve',
                'category' => 'Specialized Items',
                'unit' => 'liters',
                'base' => 1500,
                'critical' => false,
                'requires_refrigeration' => false,
                'expiry_months' => null,
            ],
            [
                'name' => 'Portable Cardiac Monitors',
                'category' => 'Specialized Items',
                'unit' => 'units',
                'base' => 26,
                'critical' => true,
                'requires_refrigeration' => false,
                'expiry_months' => null,
            ],
        ];

        $resources = [];

        foreach ($resourceTemplates as $template) {
            $received = $this->scaledQuantity($template['base'], $tierMultiplier, 0.85, 1.15);

            // Higher load means more distributed, less currently available stock.
            $distributedFactor = $this->bounded(
                $load + $this->randomFloat(-0.08, 0.06),
                0.45,
                0.96,
            );
            $distributed = (int) floor($received * $distributedFactor);
            $quantity = max(0, $received - $distributed);

            $minimumStock = max(1, (int) floor($received * ($template['critical'] ? 0.30 : 0.20)));

            $expiryDate = null;
            $expiryAlertDate = null;
            if ($template['expiry_months']) {
                $expiryDate = now()->addMonths($template['expiry_months'])->subDays(mt_rand(0, 45));
                $expiryAlertDate = (clone $expiryDate)->subDays(30);
            }

            $resources[] = [
                'name' => $template['name'],
                'category' => $template['category'],
                'unit' => $template['unit'],
                'received' => $received,
                'distributed' => $distributed,
                'quantity' => $quantity,
                'minimum_stock' => $minimumStock,
                'location' => $hospital->name,
                'hospital_id' => $hospital->id,
                // Supabase PgBouncer-safe bool literals.
                'is_critical' => $template['critical'] ? 'true' : 'false',
                'requires_refrigeration' => $template['requires_refrigeration'] ? 'true' : 'false',
                'expiry_date' => $expiryDate,
                'last_stock_movement_date' => now()->subDays(mt_rand(0, 10)),
                'last_status_change_date' => now()->subDays(mt_rand(0, 15)),
                'significant_quantity_date' => now()->subDays(mt_rand(0, 20)),
                'expiry_alert_date' => $expiryAlertDate,
            ];
        }

        return $resources;
    }

    private function scaledQuantity(int $base, float $multiplier, float $minRand, float $maxRand): int
    {
        $rand = $this->randomFloat($minRand, $maxRand);
        return max(1, (int) round($base * $multiplier * $rand));
    }

    private function randomFloat(float $min, float $max): float
    {
        return $min + (mt_rand() / mt_getrandmax()) * ($max - $min);
    }

    private function bounded(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }
}
