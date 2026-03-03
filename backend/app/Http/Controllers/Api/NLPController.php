<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\Message;
use App\Services\MessageNLPService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * NLPController - AI-powered message analysis endpoints.
 * 
 * Provides urgency detection, symptom extraction, and sentiment analysis
 * for emergency chat messages and SOS communications.
 */
class NLPController extends Controller
{
    public function __construct(private MessageNLPService $nlpService)
    {
    }

    /**
     * Analyze a single message for urgency, symptoms, and sentiment.
     * 
     * POST /api/nlp/analyze-message
     */
    public function analyzeMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'incident_type' => ['nullable', 'string'],
            'incident_id' => ['nullable', 'integer', 'exists:incidents,id'],
        ]);

        $context = [
            'incident_type' => $validated['incident_type'] ?? null,
        ];

        // If incident_id provided, get additional context
        if (!empty($validated['incident_id'])) {
            $incident = Incident::find($validated['incident_id']);
            if ($incident) {
                $context['incident_type'] = $incident->type;
                $context['incident_status'] = $incident->status;
                $context['previous_summary'] = $incident->metadata['conversation_insights']['summary'] ?? null;
            }
        }

        $analysis = $this->nlpService->analyzeMessage($validated['message'], $context);

        return response()->json([
            'success' => true,
            'data' => $analysis,
            'meta' => [
                'ai_enabled' => $analysis['ai_enhanced'] ?? false,
                'requires_attention' => ($analysis['urgency']['score'] ?? 0) >= 75,
            ],
        ]);
    }

    /**
     * Quick urgency check for real-time message filtering.
     * 
     * POST /api/nlp/urgency-check
     */
    public function urgencyCheck(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $result = $this->nlpService->quickUrgencyCheck($validated['message']);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Analyze a conversation (multiple messages) for aggregate insights.
     * 
     * POST /api/nlp/analyze-conversation
     */
    public function analyzeConversation(Request $request)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:50'],
            'messages.*' => ['required', 'string', 'max:5000'],
            'incident_type' => ['nullable', 'string'],
            'incident_id' => ['nullable', 'integer', 'exists:incidents,id'],
        ]);

        $context = [
            'incident_type' => $validated['incident_type'] ?? null,
        ];

        // Get incident context if provided
        if (!empty($validated['incident_id'])) {
            $incident = Incident::find($validated['incident_id']);
            if ($incident) {
                $context['incident_type'] = $incident->type;
                $context['incident_status'] = $incident->status;
            }
        }

        $analysis = $this->nlpService->analyzeConversation($validated['messages'], $context);

        return response()->json([
            'success' => true,
            'data' => $analysis,
            'meta' => [
                'message_count' => count($validated['messages']),
                'escalation_recommended' => $analysis['escalation_recommended'],
            ],
        ]);
    }

    /**
     * Analyze messages for a specific incident from the database.
     * 
     * GET /api/nlp/incident/{incident}/analysis
     */
    public function analyzeIncidentMessages(Request $request, Incident $incident)
    {
        // Get recent messages for this incident
        $messages = Message::where('incident_id', $incident->id)
            ->orderBy('created_at')
            ->limit(50)
            ->pluck('message')
            ->filter()
            ->values()
            ->toArray();

        if (empty($messages)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message_count' => 0,
                    'overall_urgency' => ['level' => 'low', 'score' => 0],
                    'aggregated_symptoms' => [],
                    'aggregated_hazards' => [],
                    'ai_summary' => null,
                    'escalation_recommended' => false,
                ],
                'meta' => [
                    'incident_id' => $incident->id,
                    'incident_type' => $incident->type,
                ],
            ]);
        }

        $context = [
            'incident_type' => $incident->type,
            'incident_status' => $incident->status,
        ];

        $analysis = $this->nlpService->analyzeConversation($messages, $context);

        return response()->json([
            'success' => true,
            'data' => $analysis,
            'meta' => [
                'incident_id' => $incident->id,
                'incident_type' => $incident->type,
                'incident_status' => $incident->status,
            ],
        ]);
    }

    /**
     * Bulk analyze messages for urgency scoring (for notification prioritization).
     * 
     * POST /api/nlp/bulk-urgency
     */
    public function bulkUrgencyAnalysis(Request $request)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.id' => ['required'],
            'messages.*.text' => ['required', 'string', 'max:5000'],
        ]);

        $results = [];

        foreach ($validated['messages'] as $item) {
            $urgency = $this->nlpService->quickUrgencyCheck($item['text']);
            $results[] = [
                'id' => $item['id'],
                'urgency' => $urgency,
            ];
        }

        // Sort by urgency score descending
        usort($results, fn($a, $b) => $b['urgency']['score'] <=> $a['urgency']['score']);

        return response()->json([
            'success' => true,
            'data' => $results,
            'meta' => [
                'total' => count($results),
                'critical_count' => count(array_filter($results, fn($r) => $r['urgency']['score'] >= 100)),
                'high_priority_count' => count(array_filter($results, fn($r) => $r['urgency']['score'] >= 75)),
            ],
        ]);
    }
}
