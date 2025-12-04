<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\IncidentResponderAssignment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SmartRoutingService
{
    protected GeminiContextService $gemini;

    public function __construct(GeminiContextService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Get AI-powered responder recommendations for an incident.
     *
     * @param Incident $incident
     * @param float|null $incidentLat
     * @param float|null $incidentLng
     * @param int $limit
     * @return array
     */
    public function getSmartRecommendations(
        Incident $incident,
        ?float $incidentLat = null,
        ?float $incidentLng = null,
        int $limit = 5
    ): array {
        // Get available responders
        $responders = $this->getAvailableResponders();

        if ($responders->isEmpty()) {
            return [
                'success' => true,
                'recommendations' => [],
                'ai_analysis' => null,
                'meta' => [
                    'reason' => 'no_available_responders',
                    'total_responders' => 0,
                ],
            ];
        }

        // Calculate base metrics for each responder
        $scoredResponders = $this->calculateResponderScores(
            $responders,
            $incident,
            $incidentLat,
            $incidentLng
        );

        // Get AI analysis for enhanced routing
        $aiAnalysis = $this->getAIRoutingAnalysis($incident, $scoredResponders->take(10)->values()->all());

        // Merge AI insights with calculated scores
        $finalRecommendations = $this->mergeAIInsights($scoredResponders, $aiAnalysis);

        return [
            'success' => true,
            'recommendations' => $finalRecommendations->take($limit)->values()->all(),
            'ai_analysis' => $aiAnalysis,
            'meta' => [
                'total_available_responders' => $responders->count(),
                'incident_type' => $incident->type,
                'has_coordinates' => $incidentLat !== null && $incidentLng !== null,
            ],
        ];
    }

    /**
     * Get available responders (not currently assigned to active incidents).
     */
    protected function getAvailableResponders(): Collection
    {
        return User::where('role', 'responder')
            ->where('is_active', true)
            ->where('availability', 'available')
            ->with(['responderAssignments' => function ($query) {
                $query->whereNotIn('status', [
                    IncidentResponderAssignment::STATUS_COMPLETED,
                    IncidentResponderAssignment::STATUS_CANCELLED,
                ]);
            }])
            ->get();
    }

    /**
     * Calculate comprehensive scores for each responder.
     */
    protected function calculateResponderScores(
        Collection $responders,
        Incident $incident,
        ?float $incidentLat,
        ?float $incidentLng
    ): Collection {
        return $responders->map(function (User $responder) use ($incident, $incidentLat, $incidentLng) {
            // Get cached location if available
            $cachedLocation = $this->getResponderCachedLocation($responder->id);

            $responderLat = $cachedLocation['latitude'] ?? null;
            $responderLng = $cachedLocation['longitude'] ?? null;

            // Calculate distance score (0-100, higher is better/closer)
            $distance = null;
            $distanceScore = 50; // Default middle score if no location
            if ($incidentLat && $incidentLng && $responderLat && $responderLng) {
                $distance = $this->calculateDistance($responderLat, $responderLng, $incidentLat, $incidentLng);
                // Score decreases as distance increases (inverse relationship)
                // 0km = 100, 5km = 80, 10km = 60, 20km+ = 20
                $distanceScore = max(20, 100 - ($distance * 4));
            }

            // Calculate workload score (0-100, higher is better/less busy)
            $activeAssignments = $responder->responderAssignments->count();
            $workloadScore = max(0, 100 - ($activeAssignments * 25)); // Each active assignment reduces score

            // Calculate experience/history score based on incident type
            $experienceScore = $this->calculateExperienceScore($responder, $incident->type);

            // Calculate response time history
            $responseTimeScore = $this->calculateResponseTimeScore($responder);

            // Weighted composite score
            $compositeScore = (
                ($distanceScore * 0.35) +      // 35% weight on proximity
                ($workloadScore * 0.25) +       // 25% weight on availability
                ($experienceScore * 0.25) +     // 25% weight on experience
                ($responseTimeScore * 0.15)     // 15% weight on response speed
            );

            return [
                'responder_id' => $responder->id,
                'name' => $responder->name,
                'email' => $responder->email,
                'phone' => $responder->phone,
                'profile_image' => $responder->profile_image,
                'current_location' => $cachedLocation,
                'distance_km' => $distance,
                'active_assignments' => $activeAssignments,
                'scores' => [
                    'distance' => round($distanceScore, 2),
                    'workload' => round($workloadScore, 2),
                    'experience' => round($experienceScore, 2),
                    'response_time' => round($responseTimeScore, 2),
                    'composite' => round($compositeScore, 2),
                ],
                'ai_recommendation' => null, // Will be filled by AI analysis
                'ai_reasoning' => null,
            ];
        })->sortByDesc(function ($r) {
            return $r['scores']['composite'];
        })->values();
    }

    /**
     * Get responder's cached location.
     */
    protected function getResponderCachedLocation(int $responderId): array
    {
        // Check all incident caches for this responder's latest location
        $cachePattern = "responder_location:*:{$responderId}";
        
        // For simplicity, we'll check a general responder location cache
        $cached = Cache::get("responder_current_location:{$responderId}");
        
        if ($cached) {
            return [
                'latitude' => $cached['latitude'] ?? null,
                'longitude' => $cached['longitude'] ?? null,
                'updated_at' => $cached['updated_at'] ?? null,
            ];
        }

        return ['latitude' => null, 'longitude' => null, 'updated_at' => null];
    }

    /**
     * Calculate experience score based on incident type history.
     */
    protected function calculateExperienceScore(User $responder, ?string $incidentType): float
    {
        if (!$incidentType) {
            return 50; // Default middle score
        }

        // Count completed incidents of this type
        $completedSameType = IncidentResponderAssignment::where('responder_id', $responder->id)
            ->where('status', IncidentResponderAssignment::STATUS_COMPLETED)
            ->whereHas('incident', function ($query) use ($incidentType) {
                $query->where('type', $incidentType);
            })
            ->count();

        // More experience = higher score (capped at 100)
        return min(100, 50 + ($completedSameType * 5));
    }

    /**
     * Calculate response time score based on historical performance.
     */
    protected function calculateResponseTimeScore(User $responder): float
    {
        // Get average response time from recent completed assignments
        $recentAssignments = IncidentResponderAssignment::where('responder_id', $responder->id)
            ->where('status', IncidentResponderAssignment::STATUS_COMPLETED)
            ->whereNotNull('assigned_at')
            ->whereNotNull('acknowledged_at')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        if ($recentAssignments->isEmpty()) {
            return 50; // Default middle score for new responders
        }

        $totalResponseTime = 0;
        $validCount = 0;

        foreach ($recentAssignments as $assignment) {
            if ($assignment->assigned_at && $assignment->acknowledged_at) {
                $responseMinutes = $assignment->assigned_at->diffInMinutes($assignment->acknowledged_at);
                $totalResponseTime += $responseMinutes;
                $validCount++;
            }
        }

        if ($validCount === 0) {
            return 50;
        }

        $avgResponseMinutes = $totalResponseTime / $validCount;

        // Score based on average response time (faster = higher score)
        // < 2 min = 100, 5 min = 80, 10 min = 60, 15+ min = 40
        if ($avgResponseMinutes <= 2) {
            return 100;
        } elseif ($avgResponseMinutes <= 5) {
            return 90;
        } elseif ($avgResponseMinutes <= 10) {
            return 70;
        } elseif ($avgResponseMinutes <= 15) {
            return 50;
        }

        return 40;
    }

    /**
     * Get AI analysis for routing decision.
     */
    protected function getAIRoutingAnalysis(Incident $incident, array $topResponders): ?array
    {
        if (!$this->gemini->isConfigured()) {
            return null;
        }

        $prompt = $this->buildRoutingPrompt($incident, $topResponders);

        try {
            $result = $this->gemini->generate($prompt, [
                'max_tokens' => 800,
                'temperature' => 0.3,
            ]);

            if (!$result['success']) {
                Log::warning('Smart routing AI analysis failed', ['error' => $result['error'] ?? 'Unknown']);
                return null;
            }

            return $this->parseAIRoutingResponse($result['data']['text'] ?? '');
        } catch (\Exception $e) {
            Log::error('Smart routing AI exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Build the AI prompt for routing analysis.
     */
    protected function buildRoutingPrompt(Incident $incident, array $topResponders): string
    {
        $responderSummary = collect($topResponders)->map(function ($r, $index) {
            return sprintf(
                "Responder %d: ID=%d, Name=%s, Distance=%.1fkm, ActiveAssignments=%d, CompositeScore=%.1f",
                $index + 1,
                $r['responder_id'],
                $r['name'],
                $r['distance_km'] ?? -1,
                $r['active_assignments'],
                $r['scores']['composite']
            );
        })->implode("\n");

        return <<<PROMPT
You are an emergency dispatch AI assistant. Analyze this incident and responder data to provide routing recommendations.

INCIDENT DETAILS:
- Type: {$incident->type}
- Description: {$incident->description}
- Location: {$incident->location}
- Status: {$incident->status}
- Responders Required: {$incident->responders_required}

AVAILABLE RESPONDERS (top candidates by composite score):
{$responderSummary}

TASK:
1. Analyze the incident severity and type
2. Evaluate each responder's suitability
3. Provide a JSON response with your recommendations

Respond ONLY with valid JSON in this exact format:
{
  "incident_priority": "critical|high|medium|low",
  "recommended_responder_ids": [id1, id2],
  "reasoning": "Brief explanation of why these responders are best suited",
  "special_considerations": "Any special notes about this incident type",
  "estimated_response_quality": "excellent|good|adequate|limited"
}
PROMPT;
    }

    /**
     * Parse AI response for routing recommendations.
     */
    protected function parseAIRoutingResponse(string $response): ?array
    {
        // Try to extract JSON from response
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $response, $matches);

        if (!$jsonMatch) {
            return null;
        }

        $parsed = json_decode($matches[0], true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return [
            'incident_priority' => $parsed['incident_priority'] ?? 'medium',
            'recommended_responder_ids' => $parsed['recommended_responder_ids'] ?? [],
            'reasoning' => $parsed['reasoning'] ?? null,
            'special_considerations' => $parsed['special_considerations'] ?? null,
            'estimated_response_quality' => $parsed['estimated_response_quality'] ?? 'adequate',
        ];
    }

    /**
     * Merge AI insights with calculated recommendations.
     */
    protected function mergeAIInsights(Collection $scoredResponders, ?array $aiAnalysis): Collection
    {
        if (!$aiAnalysis) {
            return $scoredResponders;
        }

        $aiRecommendedIds = $aiAnalysis['recommended_responder_ids'] ?? [];

        return $scoredResponders->map(function ($responder) use ($aiRecommendedIds, $aiAnalysis) {
            $isAIRecommended = in_array($responder['responder_id'], $aiRecommendedIds);

            // Boost score for AI-recommended responders
            if ($isAIRecommended) {
                $responder['scores']['composite'] = min(100, $responder['scores']['composite'] + 10);
                $responder['ai_recommendation'] = 'recommended';
                $responder['ai_reasoning'] = $aiAnalysis['reasoning'] ?? null;
            } else {
                $responder['ai_recommendation'] = 'alternative';
            }

            return $responder;
        })->sortByDesc(function ($r) {
            return $r['scores']['composite'];
        })->values();
    }

    /**
     * Auto-assign the best responder to an incident.
     */
    public function autoAssignBestResponder(Incident $incident): ?array
    {
        [$incidentLat, $incidentLng] = $this->extractCoordinates($incident->latlng);

        $recommendations = $this->getSmartRecommendations(
            $incident,
            $incidentLat,
            $incidentLng,
            1
        );

        if (empty($recommendations['recommendations'])) {
            return null;
        }

        return $recommendations['recommendations'][0];
    }

    /**
     * Calculate distance between two points using Haversine formula.
     */
    protected function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Extract coordinates from latlng string.
     */
    protected function extractCoordinates(?string $latlng): array
    {
        if (!$latlng) {
            return [null, null];
        }

        $parts = explode(',', $latlng);
        if (count($parts) !== 2) {
            return [null, null];
        }

        $lat = is_numeric($parts[0]) ? (float) $parts[0] : null;
        $lng = is_numeric($parts[1]) ? (float) $parts[1] : null;

        return [$lat, $lng];
    }
}
