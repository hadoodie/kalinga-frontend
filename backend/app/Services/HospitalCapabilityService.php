<?php

namespace App\Services;

use App\Models\Hospital;
use Illuminate\Support\Collection;

class HospitalCapabilityService
{
    public function buildResourceProfile(Hospital $hospital): array
    {
        if (!$hospital->relationLoaded('resources')) {
            $hospital->load(['resources' => function ($query) {
                $query->select('id', 'hospital_id', 'name', 'category', 'quantity', 'is_critical');
            }]);
        }

        $resources = $hospital->resources instanceof Collection
            ? $hospital->resources
            : collect($hospital->resources ?? []);

        $available = $resources->filter(function ($resource) {
            return (float) ($resource->quantity ?? 0) > 0;
        });

        $totalQuantity = (float) $available->reduce(function ($carry, $resource) {
            return $carry + (float) ($resource->quantity ?? 0);
        }, 0);

        $criticalAvailable = $available->filter(function ($resource) {
            return (bool) ($resource->is_critical ?? false);
        })->count();

        $categoryCoverage = $available
            ->pluck('category')
            ->filter()
            ->map(function ($category) {
                return mb_strtolower((string) $category);
            })
            ->unique()
            ->count();

        $specializedAvailable = $available->filter(function ($resource) {
            $name = mb_strtolower((string) ($resource->name ?? ''));
            $category = mb_strtolower((string) ($resource->category ?? ''));

            return str_contains($name, 'icu')
                || str_contains($name, 'ventilator')
                || str_contains($name, 'dialysis')
                || str_contains($name, 'oxygen')
                || in_array($category, ['specialized items', 'equipment', 'icu', 'ventilator'], true);
        })->count();

        $capacity = max(0, (float) ($hospital->capacity ?? 0));

        $normalizedCapacity = $capacity > 0 ? min($capacity / 1000, 1.0) : 0.0;
        $normalizedQuantity = min($totalQuantity / 300, 1.0);
        $normalizedCategory = min($categoryCoverage / 8, 1.0);
        $normalizedCritical = min($criticalAvailable / 10, 1.0);
        $normalizedSpecialized = min($specializedAvailable / 5, 1.0);
        $normalizedEmergency = $hospital->emergency_services ? 1.0 : 0.0;

        $score = round(
            ($normalizedCapacity * 0.25)
            + ($normalizedQuantity * 0.2)
            + ($normalizedCategory * 0.15)
            + ($normalizedCritical * 0.2)
            + ($normalizedSpecialized * 0.1)
            + ($normalizedEmergency * 0.1),
            3
        );

        $topResources = $available
            ->sortByDesc(function ($resource) {
                return (float) ($resource->quantity ?? 0);
            })
            ->take(5)
            ->map(function ($resource) {
                return [
                    'id' => $resource->id,
                    'name' => $resource->name,
                    'category' => $resource->category,
                    'quantity' => (float) ($resource->quantity ?? 0),
                    'is_critical' => (bool) ($resource->is_critical ?? false),
                ];
            })
            ->values()
            ->all();

        return [
            'score' => $score,
            'available_resource_quantity' => round($totalQuantity, 2),
            'critical_resource_count' => $criticalAvailable,
            'category_coverage' => $categoryCoverage,
            'specialized_resource_count' => $specializedAvailable,
            'has_emergency_services' => (bool) $hospital->emergency_services,
            'capacity' => $capacity,
            'top_resources' => $topResources,
        ];
    }

    public function distanceScore(?float $distanceKm): float
    {
        if ($distanceKm === null) {
            return 0.35;
        }

        $normalized = 1 / (1 + max($distanceKm, 0.1) / 5);
        return round($normalized, 3);
    }

    public function priorityScore(float $capabilityScore, float $distanceScore): float
    {
        return round(($capabilityScore * 0.65) + ($distanceScore * 0.35), 3);
    }
}
