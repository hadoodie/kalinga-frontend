<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiContextService;
use Illuminate\Http\Request;

class GeminiController extends Controller
{
    protected GeminiContextService $service;

    public function __construct(GeminiContextService $service)
    {
        $this->service = $service;
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'prompt' => 'required|string',
        ]);

        if (!$this->service->isConfigured()) {
            return response()->json([
                'success' => false,
                'error' => 'Gemini API not configured on server',
            ], 500);
        }

        $prompt = $validated['prompt'];
        $options = $request->input('options', []);

        $result = $this->service->generate($prompt, $options);

        if (!$result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }
}
