<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\Message;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * MessageNLPService - AI-powered natural language processing for emergency messages.
 * 
 * Provides urgency detection, symptom extraction, sentiment analysis, and 
 * contextual understanding for chat and SOS messages.
 */
class MessageNLPService
{
    protected GeminiContextService $gemini;

    /**
     * Urgency levels with associated keywords and indicators.
     */
    private const URGENCY_PATTERNS = [
        'critical' => [
            'keywords' => [
                'dying', 'unconscious', 'not breathing', "can't breathe", 'cardiac arrest',
                'heart attack', 'massive bleeding', 'severe burns', 'explosion', 'trapped',
                'drowning', 'choking', 'stroke', 'seizure', 'overdose', 'gunshot', 'stabbed',
                'anaphylaxis', 'help now', 'emergency', 'life threatening', 'critical condition'
            ],
            'weight' => 100,
        ],
        'high' => [
            'keywords' => [
                'hurry', 'urgent', 'bleeding', 'broken bone', 'fracture', 'difficulty breathing',
                'chest pain', 'severe pain', 'lost consciousness', 'head injury', 'burns',
                'fire', 'flood', 'accident', 'crash', 'collapsed', 'injured badly', 'please help',
                'need help', 'ambulance', 'unconscious moments ago', 'convulsions'
            ],
            'weight' => 75,
        ],
        'medium' => [
            'keywords' => [
                'pain', 'hurt', 'injured', 'sick', 'fever', 'vomiting', 'dizzy', 'fell',
                'cut', 'wound', 'sprained', 'swelling', 'headache', 'nausea', 'can\'t walk',
                'allergic reaction', 'bite', 'sting', 'rash', 'weakness', 'fainting'
            ],
            'weight' => 50,
        ],
        'low' => [
            'keywords' => [
                'minor', 'small cut', 'slight pain', 'feeling unwell', 'check up', 'advice',
                'question', 'information', 'scheduled', 'follow up', 'routine'
            ],
            'weight' => 25,
        ],
    ];

    /**
     * Medical symptom categories for extraction.
     */
    private const SYMPTOM_CATEGORIES = [
        'respiratory' => [
            'breathing difficulty', 'shortness of breath', 'wheezing', 'coughing', 'choking',
            'asthma', 'hyperventilating', 'gasping', 'chest tightness', 'smoke inhalation'
        ],
        'cardiovascular' => [
            'chest pain', 'heart racing', 'palpitations', 'irregular heartbeat', 'cardiac',
            'heart attack', 'high blood pressure', 'low blood pressure', 'fainting'
        ],
        'neurological' => [
            'headache', 'migraine', 'dizziness', 'confusion', 'unconscious', 'seizure',
            'numbness', 'tingling', 'paralysis', 'stroke', 'memory loss', 'disoriented'
        ],
        'trauma' => [
            'bleeding', 'wound', 'cut', 'fracture', 'broken', 'sprain', 'bruise', 'burn',
            'laceration', 'puncture', 'crush', 'amputation', 'head injury', 'concussion'
        ],
        'gastrointestinal' => [
            'nausea', 'vomiting', 'diarrhea', 'abdominal pain', 'stomach', 'food poisoning',
            'dehydration', 'blood in stool', 'cramping', 'bloating'
        ],
        'allergic' => [
            'allergic reaction', 'anaphylaxis', 'swelling', 'hives', 'rash', 'itching',
            'difficulty swallowing', 'tongue swelling', 'throat closing'
        ],
        'psychological' => [
            'anxiety', 'panic attack', 'depression', 'suicidal', 'self harm', 'agitated',
            'confused', 'hallucinating', 'violent', 'threatening'
        ],
    ];

    /**
     * Environmental hazard keywords.
     */
    private const HAZARD_KEYWORDS = [
        'fire' => ['fire', 'burning', 'flames', 'smoke', 'inferno', 'blaze'],
        'flood' => ['flood', 'flooding', 'water rising', 'submerged', 'drowning'],
        'structural' => ['collapse', 'building falling', 'debris', 'rubble', 'trapped under'],
        'chemical' => ['chemical', 'toxic', 'gas leak', 'hazmat', 'poisonous', 'fumes'],
        'electrical' => ['electrocution', 'electrical fire', 'power line', 'shock'],
        'violence' => ['attack', 'assault', 'weapon', 'gun', 'knife', 'threatening'],
        'vehicle' => ['car accident', 'crash', 'collision', 'vehicle', 'motorcycle', 'hit by car'],
        'natural' => ['earthquake', 'typhoon', 'landslide', 'storm', 'lightning'],
    ];

    public function __construct(GeminiContextService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Analyze a message for urgency, symptoms, sentiment, and context.
     *
     * @param string $messageText The message content to analyze
     * @param array $context Additional context (incident type, previous messages, etc.)
     * @return array Analysis results
     */
    public function analyzeMessage(string $messageText, array $context = []): array
    {
        $text = $this->normalizeText($messageText);

        if (empty($text)) {
            return $this->emptyAnalysis();
        }

        // Rule-based analysis (fast, always available)
        $ruleBasedAnalysis = $this->performRuleBasedAnalysis($text);

        // AI-enhanced analysis (if Gemini is configured)
        $aiAnalysis = null;
        if ($this->gemini->isConfigured() && $this->shouldUseAI($ruleBasedAnalysis, $context)) {
            $aiAnalysis = $this->performAIAnalysis($text, $context, $ruleBasedAnalysis);
        }

        // Merge and return combined analysis
        return $this->mergeAnalyses($ruleBasedAnalysis, $aiAnalysis);
    }

    /**
     * Analyze multiple messages for conversation-level insights.
     *
     * @param array $messages Array of message texts
     * @param array $context Additional context
     * @return array Conversation-level analysis
     */
    public function analyzeConversation(array $messages, array $context = []): array
    {
        if (empty($messages)) {
            return $this->emptyConversationAnalysis();
        }

        $combinedText = implode("\n", array_map(fn($m) => $this->normalizeText($m), $messages));
        $individualAnalyses = array_map(fn($m) => $this->analyzeMessage($m, $context), $messages);

        // Aggregate urgency (take highest)
        $maxUrgency = 'low';
        $maxUrgencyScore = 0;
        foreach ($individualAnalyses as $analysis) {
            if ($analysis['urgency']['score'] > $maxUrgencyScore) {
                $maxUrgency = $analysis['urgency']['level'];
                $maxUrgencyScore = $analysis['urgency']['score'];
            }
        }

        // Aggregate symptoms (unique)
        $allSymptoms = [];
        foreach ($individualAnalyses as $analysis) {
            foreach ($analysis['symptoms'] as $category => $symptoms) {
                if (!isset($allSymptoms[$category])) {
                    $allSymptoms[$category] = [];
                }
                $allSymptoms[$category] = array_unique(array_merge($allSymptoms[$category], $symptoms));
            }
        }

        // Aggregate hazards (unique)
        $allHazards = [];
        foreach ($individualAnalyses as $analysis) {
            $allHazards = array_unique(array_merge($allHazards, $analysis['hazards']));
        }

        // AI summary if available
        $aiSummary = null;
        if ($this->gemini->isConfigured() && count($messages) >= 2) {
            $aiSummary = $this->generateConversationSummary($messages, $context);
        }

        return [
            'message_count' => count($messages),
            'overall_urgency' => [
                'level' => $maxUrgency,
                'score' => $maxUrgencyScore,
            ],
            'aggregated_symptoms' => $allSymptoms,
            'aggregated_hazards' => $allHazards,
            'ai_summary' => $aiSummary,
            'escalation_recommended' => $maxUrgencyScore >= 75,
            'individual_analyses' => $individualAnalyses,
        ];
    }

    /**
     * Quick urgency check for real-time filtering.
     *
     * @param string $messageText
     * @return array Urgency level and score
     */
    public function quickUrgencyCheck(string $messageText): array
    {
        $text = $this->normalizeText($messageText);
        $urgency = $this->detectUrgency($text);

        return [
            'level' => $urgency['level'],
            'score' => $urgency['score'],
            'requires_immediate_attention' => $urgency['score'] >= 75,
            'keywords_found' => $urgency['keywords'],
        ];
    }

    /**
     * Perform rule-based analysis (fast, deterministic).
     */
    protected function performRuleBasedAnalysis(string $text): array
    {
        return [
            'urgency' => $this->detectUrgency($text),
            'symptoms' => $this->extractSymptoms($text),
            'hazards' => $this->detectHazards($text),
            'sentiment' => $this->analyzeSentiment($text),
            'entities' => $this->extractEntities($text),
            'source' => 'rule_based',
        ];
    }

    /**
     * Perform AI-enhanced analysis using Gemini.
     */
    protected function performAIAnalysis(string $text, array $context, array $ruleBasedAnalysis): ?array
    {
        $cacheKey = 'nlp_analysis:' . md5($text . json_encode($context));
        
        // Check cache first (10 minute TTL)
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        $prompt = $this->buildAnalysisPrompt($text, $context, $ruleBasedAnalysis);

        try {
            $result = $this->gemini->generate($prompt, [
                'max_tokens' => 600,
                'temperature' => 0.2,
            ]);

            if (!$result['success']) {
                Log::warning('NLP AI analysis failed', ['error' => $result['error'] ?? 'Unknown']);
                return null;
            }

            $parsed = $this->parseAIResponse($result['data']['text'] ?? '');

            if ($parsed) {
                Cache::put($cacheKey, $parsed, now()->addMinutes(10));
            }

            return $parsed;
        } catch (\Exception $e) {
            Log::error('NLP AI analysis exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Build the AI analysis prompt.
     */
    protected function buildAnalysisPrompt(string $text, array $context, array $ruleBasedAnalysis): string
    {
        $incidentType = $context['incident_type'] ?? 'unknown';
        $previousSummary = $context['previous_summary'] ?? 'N/A';
        $detectedSymptoms = implode(', ', $this->flattenSymptoms($ruleBasedAnalysis['symptoms'])) ?: 'none detected';
        $detectedHazards = implode(', ', $ruleBasedAnalysis['hazards']) ?: 'none detected';

        return <<<PROMPT
You are an emergency medical triage AI assistant. Analyze this emergency message for critical information.

MESSAGE: "{$text}"

CONTEXT:
- Incident Type: {$incidentType}
- Previous Analysis: {$previousSummary}
- Rule-detected symptoms: {$detectedSymptoms}
- Rule-detected hazards: {$detectedHazards}

TASKS:
1. Assess urgency level (critical/high/medium/low)
2. Extract medical symptoms not detected by rules
3. Identify any hidden distress signals or coded language
4. Determine if immediate dispatch escalation is needed
5. Suggest specific questions for responders to ask

Respond ONLY with valid JSON in this exact format:
{
  "urgency_assessment": {
    "level": "critical|high|medium|low",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
  },
  "additional_symptoms": ["symptom1", "symptom2"],
  "hidden_signals": "any distress signals or concerns not obvious",
  "escalation_needed": true|false,
  "recommended_questions": ["question1", "question2"],
  "medical_priority": "immediate|urgent|standard|non-urgent",
  "special_considerations": "any special notes for responders"
}
PROMPT;
    }

    /**
     * Parse AI response JSON.
     */
    protected function parseAIResponse(string $response): ?array
    {
        $jsonMatch = preg_match('/\{[\s\S]*\}/', $response, $matches);

        if (!$jsonMatch) {
            return null;
        }

        $parsed = json_decode($matches[0], true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return [
            'urgency_assessment' => $parsed['urgency_assessment'] ?? null,
            'additional_symptoms' => $parsed['additional_symptoms'] ?? [],
            'hidden_signals' => $parsed['hidden_signals'] ?? null,
            'escalation_needed' => $parsed['escalation_needed'] ?? false,
            'recommended_questions' => $parsed['recommended_questions'] ?? [],
            'medical_priority' => $parsed['medical_priority'] ?? 'standard',
            'special_considerations' => $parsed['special_considerations'] ?? null,
            'source' => 'ai_enhanced',
        ];
    }

    /**
     * Detect urgency level from text.
     */
    protected function detectUrgency(string $text): array
    {
        $detectedLevel = 'low';
        $maxScore = 0;
        $matchedKeywords = [];

        foreach (self::URGENCY_PATTERNS as $level => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (str_contains($text, strtolower($keyword))) {
                    if ($config['weight'] > $maxScore) {
                        $maxScore = $config['weight'];
                        $detectedLevel = $level;
                    }
                    $matchedKeywords[] = $keyword;
                }
            }
        }

        // Boost urgency if multiple high-urgency keywords found
        if (count($matchedKeywords) >= 3 && $maxScore < 100) {
            $maxScore = min(100, $maxScore + 15);
        }

        // Check for urgency indicators (caps, exclamation marks, repeated words)
        $capsRatio = $this->calculateCapsRatio($text);
        if ($capsRatio > 0.5) {
            $maxScore = min(100, $maxScore + 10);
        }

        $exclamationCount = substr_count($text, '!');
        if ($exclamationCount >= 2) {
            $maxScore = min(100, $maxScore + 5);
        }

        return [
            'level' => $detectedLevel,
            'score' => $maxScore,
            'keywords' => array_unique($matchedKeywords),
            'indicators' => [
                'caps_ratio' => $capsRatio,
                'exclamation_count' => $exclamationCount,
            ],
        ];
    }

    /**
     * Extract medical symptoms from text.
     */
    protected function extractSymptoms(string $text): array
    {
        $symptoms = [];

        foreach (self::SYMPTOM_CATEGORIES as $category => $keywords) {
            $found = [];
            foreach ($keywords as $keyword) {
                if (str_contains($text, strtolower($keyword))) {
                    $found[] = $keyword;
                }
            }
            if (!empty($found)) {
                $symptoms[$category] = $found;
            }
        }

        return $symptoms;
    }

    /**
     * Detect environmental hazards from text.
     */
    protected function detectHazards(string $text): array
    {
        $hazards = [];

        foreach (self::HAZARD_KEYWORDS as $hazardType => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, strtolower($keyword))) {
                    $hazards[] = $hazardType;
                    break;
                }
            }
        }

        return array_unique($hazards);
    }

    /**
     * Analyze sentiment of the message.
     */
    protected function analyzeSentiment(string $text): array
    {
        $distressIndicators = ['help', 'please', 'scared', 'afraid', 'worried', 'panic', 'terrified', 'desperate'];
        $calmIndicators = ['okay', 'fine', 'stable', 'better', 'improving', 'calm'];
        $negativeIndicators = ['worse', 'bad', 'terrible', 'critical', 'dying', 'failing'];

        $distressCount = 0;
        $calmCount = 0;
        $negativeCount = 0;

        foreach ($distressIndicators as $word) {
            if (str_contains($text, $word)) {
                $distressCount++;
            }
        }

        foreach ($calmIndicators as $word) {
            if (str_contains($text, $word)) {
                $calmCount++;
            }
        }

        foreach ($negativeIndicators as $word) {
            if (str_contains($text, $word)) {
                $negativeCount++;
            }
        }

        $sentiment = 'neutral';
        if ($distressCount > $calmCount && $distressCount > 0) {
            $sentiment = 'distressed';
        } elseif ($negativeCount > $calmCount && $negativeCount > 0) {
            $sentiment = 'negative';
        } elseif ($calmCount > $distressCount) {
            $sentiment = 'calm';
        }

        return [
            'overall' => $sentiment,
            'distress_level' => min(100, $distressCount * 20 + $negativeCount * 15),
            'indicators' => [
                'distress_words' => $distressCount,
                'calm_words' => $calmCount,
                'negative_words' => $negativeCount,
            ],
        ];
    }

    /**
     * Extract entities (numbers, locations, names) from text.
     */
    protected function extractEntities(string $text): array
    {
        $entities = [
            'numbers' => [],
            'ages' => [],
            'quantities' => [],
        ];

        // Extract numbers
        preg_match_all('/\b(\d+)\b/', $text, $numbers);
        $entities['numbers'] = array_unique($numbers[1] ?? []);

        // Extract age mentions
        preg_match_all('/(\d+)\s*(?:years?\s*old|y\/o|yo)/i', $text, $ages);
        $entities['ages'] = array_unique($ages[1] ?? []);

        // Extract quantities with units
        preg_match_all('/(\d+)\s*(?:people|persons|victims|patients|injured)/i', $text, $quantities);
        $entities['quantities'] = array_unique($quantities[0] ?? []);

        return $entities;
    }

    /**
     * Determine if AI analysis should be used.
     */
    protected function shouldUseAI(array $ruleBasedAnalysis, array $context): bool
    {
        // Always use AI for high/critical urgency
        if ($ruleBasedAnalysis['urgency']['score'] >= 50) {
            return true;
        }

        // Use AI for distressed sentiment
        if ($ruleBasedAnalysis['sentiment']['distress_level'] >= 40) {
            return true;
        }

        // Use AI if multiple symptoms detected
        $symptomCount = array_sum(array_map('count', $ruleBasedAnalysis['symptoms']));
        if ($symptomCount >= 2) {
            return true;
        }

        // Use AI for SOS-triggered incidents
        if (($context['incident_type'] ?? '') === 'sos') {
            return true;
        }

        return false;
    }

    /**
     * Merge rule-based and AI analyses.
     */
    protected function mergeAnalyses(array $ruleBasedAnalysis, ?array $aiAnalysis): array
    {
        $result = $ruleBasedAnalysis;
        $result['ai_enhanced'] = $aiAnalysis !== null;

        if ($aiAnalysis) {
            // Use AI urgency if higher confidence
            if (isset($aiAnalysis['urgency_assessment'])) {
                $aiUrgency = $aiAnalysis['urgency_assessment'];
                $aiUrgencyScore = $this->urgencyLevelToScore($aiUrgency['level'] ?? 'low');
                
                if ($aiUrgencyScore > $result['urgency']['score']) {
                    $result['urgency']['level'] = $aiUrgency['level'];
                    $result['urgency']['score'] = $aiUrgencyScore;
                    $result['urgency']['ai_reasoning'] = $aiUrgency['reasoning'] ?? null;
                }
            }

            // Add AI-detected symptoms
            if (!empty($aiAnalysis['additional_symptoms'])) {
                $result['symptoms']['ai_detected'] = $aiAnalysis['additional_symptoms'];
            }

            // Add AI insights
            $result['ai_insights'] = [
                'hidden_signals' => $aiAnalysis['hidden_signals'] ?? null,
                'escalation_needed' => $aiAnalysis['escalation_needed'] ?? false,
                'recommended_questions' => $aiAnalysis['recommended_questions'] ?? [],
                'medical_priority' => $aiAnalysis['medical_priority'] ?? 'standard',
                'special_considerations' => $aiAnalysis['special_considerations'] ?? null,
            ];
        }

        return $result;
    }

    /**
     * Generate AI summary for a conversation.
     */
    protected function generateConversationSummary(array $messages, array $context): ?string
    {
        $messagesText = implode("\n", array_map(function ($m, $i) {
            return "Message " . ($i + 1) . ": " . $m;
        }, $messages, array_keys($messages)));

        $prompt = <<<PROMPT
You are an emergency dispatch AI. Summarize this emergency conversation for responders.

CONVERSATION:
{$messagesText}

Provide a brief (2-3 sentences) tactical summary covering:
1. Main emergency/situation
2. Victim status if known
3. Key information for responders

Be concise and factual. Response should be plain text, not JSON.
PROMPT;

        try {
            $result = $this->gemini->generate($prompt, [
                'max_tokens' => 200,
                'temperature' => 0.3,
            ]);

            return $result['success'] ? ($result['data']['text'] ?? null) : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Convert urgency level to score.
     */
    protected function urgencyLevelToScore(string $level): int
    {
        return match (strtolower($level)) {
            'critical' => 100,
            'high' => 75,
            'medium' => 50,
            'low' => 25,
            default => 0,
        };
    }

    /**
     * Calculate ratio of uppercase characters.
     */
    protected function calculateCapsRatio(string $text): float
    {
        $letters = preg_replace('/[^a-zA-Z]/', '', $text);
        if (empty($letters)) {
            return 0;
        }
        $uppercase = preg_replace('/[^A-Z]/', '', $text);
        return strlen($uppercase) / strlen($letters);
    }

    /**
     * Normalize text for analysis.
     */
    protected function normalizeText(string $text): string
    {
        return trim($text);
    }

    /**
     * Flatten symptoms array for display.
     */
    protected function flattenSymptoms(array $symptoms): array
    {
        $flat = [];
        foreach ($symptoms as $category => $items) {
            foreach ($items as $item) {
                $flat[] = $item;
            }
        }
        return $flat;
    }

    /**
     * Return empty analysis structure.
     */
    protected function emptyAnalysis(): array
    {
        return [
            'urgency' => ['level' => 'low', 'score' => 0, 'keywords' => []],
            'symptoms' => [],
            'hazards' => [],
            'sentiment' => ['overall' => 'neutral', 'distress_level' => 0],
            'entities' => ['numbers' => [], 'ages' => [], 'quantities' => []],
            'source' => 'empty',
            'ai_enhanced' => false,
        ];
    }

    /**
     * Return empty conversation analysis structure.
     */
    protected function emptyConversationAnalysis(): array
    {
        return [
            'message_count' => 0,
            'overall_urgency' => ['level' => 'low', 'score' => 0],
            'aggregated_symptoms' => [],
            'aggregated_hazards' => [],
            'ai_summary' => null,
            'escalation_recommended' => false,
            'individual_analyses' => [],
        ];
    }
}
