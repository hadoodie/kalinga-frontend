<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiContextService
{
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key') ?? '';
        $this->baseUrl = rtrim(
            config('services.gemini.base_url') ?? 'https://generativelanguage.googleapis.com/v1beta',
            '/'
        );
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Generate context from Gemini given a prompt.
     * Returns array with 'success' and either 'data' or 'error'.
     */
    public function generate(string $prompt, array $options = []): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Gemini API key not configured',
            ];
        }

        $model = $options['model'] ?? 'gemini-2.0-flash-lite';
        $maxTokens = $options['max_tokens'] ?? 512;
        $temperature = $options['temperature'] ?? 0.2;

        $endpoint = sprintf('%s/models/%s:generateContent?key=%s', $this->baseUrl, $model, $this->apiKey);

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens,
            ],
        ];

        try {
            $response = Http::acceptJson()->post($endpoint, $payload);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'status' => $response->status(),
                    'error' => $response->body(),
                ];
            }

            $body = $response->json();

            // Attempt to parse a useful text result. Adjust according to actual Gemini response.
            $generatedText = null;
            if (isset($body['candidates'][0]['content']['parts'][0]['text'])) {
                $generatedText = $body['candidates'][0]['content']['parts'][0]['text'];
            } elseif (isset($body['output']) && is_string($body['output'])) {
                $generatedText = $body['output'];
            } elseif (isset($body['result'])) {
                $generatedText = $body['result'];
            } else {
                // Fallback: stringify
                $generatedText = json_encode($body);
            }

            return [
                'success' => true,
                'data' => [
                    'raw' => $body,
                    'text' => $generatedText,
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
