<?php

namespace Tests\Feature;

use App\Services\GeminiContextService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeminiContextServiceTest extends TestCase
{
    public function test_generate_returns_parsed_text_on_success()
    {
        // Arrange: fake the external HTTP call
        Http::fake([
            'https://api.example/models/gemini-2.0-flash-lite:generateContent*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => '{"summary":"ok","symptoms":["cough"],"hazards":[],"location":[],"urgencyCue":null}'],
                            ],
                            'role' => 'model',
                        ],
                    ],
                ],
            ], 200),
        ]);

        // Ensure config is set for tests
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.base_url' => 'https://api.example',
        ]);

        $svc = new GeminiContextService();

        // Act
        $result = $svc->generate('hello world');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('data', $result);
        $this->assertStringContainsString('summary', $result['data']['text']);
    }

    public function test_generate_returns_error_when_not_configured()
    {
        config(['services.gemini.key' => null]);

        $svc = new GeminiContextService();
        $result = $svc->generate('prompt');

        $this->assertFalse($result['success']);
        $this->assertEquals('Gemini API key not configured', $result['error']);
    }
}
