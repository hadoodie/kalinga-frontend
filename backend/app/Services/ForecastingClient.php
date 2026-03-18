<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * ForecastingClient — HTTP client for the FastAPI forecasting microservice.
 *
 * Used when FORECAST_API_URL is set (i.e., on Render where FastAPI is a
 * separate web service). When the URL is empty, RunForecasts.php falls
 * back to running the Python pipeline as a local subprocess.
 *
 * Endpoints consumed:
 *   GET  /api/v1/health          — Liveness probe
 *   POST /api/v1/predict         — Batch demand + risk predictions
 *   POST /api/v1/run-pipeline    — Trigger full ETL→predict→write cycle
 *   POST /api/v1/models/reload   — Hot-reload model artifacts
 */
class ForecastingClient
{
    protected ?string $baseUrl;
    protected string $prefix;
    protected int $timeout;
    protected bool $enabled;

    public function __construct()
    {
        $this->baseUrl = config('services.forecasting.base_url');
        $this->prefix  = rtrim(config('services.forecasting.api_prefix', '/api/v1'), '/');
        $this->timeout = (int) config('services.forecasting.timeout', 300);
        $this->enabled = (bool) config('services.forecasting.enabled', true);
    }

    // ── Helpers ──────────────────────────────────────────────

    /**
     * Is this client configured (URL set)?
     * When false, the caller should use the local subprocess instead.
     */
    public function isConfigured(): bool
    {
        return $this->enabled && !empty($this->baseUrl);
    }

    /**
     * Build the full URL for an endpoint path.
     */
    protected function url(string $path): string
    {
        return rtrim($this->baseUrl, '/') . $this->prefix . '/' . ltrim($path, '/');
    }

    // ── Health ───────────────────────────────────────────────

    /**
     * GET /api/v1/health
     *
     * @return array{status: string, models_loaded: bool, reachable: bool}
     */
    public function healthCheck(): array
    {
        if (!$this->isConfigured()) {
            return ['status' => 'not_configured', 'reachable' => false];
        }

        try {
            $response = Http::timeout(10)->get($this->url('health'));

            if ($response->successful()) {
                return array_merge($response->json(), ['reachable' => true]);
            }

            return [
                'status'      => 'error',
                'reachable'   => true,
                'http_status' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::warning('[ForecastingClient] Health check failed', [
                'url'   => $this->url('health'),
                'error' => $e->getMessage(),
            ]);
            return ['status' => 'unreachable', 'reachable' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Cached availability check (60 s TTL).
     */
    public function isAvailable(): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        return Cache::remember('forecasting_service_available', 60, function () {
            return ($this->healthCheck()['reachable'] ?? false) === true;
        });
    }

    // ── Run full pipeline ────────────────────────────────────

    /**
     * POST /api/v1/run-pipeline
     *
     * Tells FastAPI to execute the full ETL→predict→DB-write cycle.
     * This is the Render-mode replacement for `python -m forecasting.run_forecast`.
     *
     * @param string $mode       "production" or "demo"
     * @param int    $horizon    Forecast horizon in hours
     * @return array{success: bool, demand_rows?: int, risk_rows?: int, elapsed_s?: float, error?: string}
     */
    public function runPipeline(string $mode = 'production', int $horizon = 48): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'FastAPI URL not configured'];
        }

        try {
            Log::info('[ForecastingClient] Triggering remote pipeline', compact('mode', 'horizon'));

            $response = Http::timeout($this->timeout)
                ->post($this->url('run-pipeline'), [
                    'mode'    => $mode,
                    'horizon' => $horizon,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('[ForecastingClient] Remote pipeline complete', [
                    'demand_rows' => $data['demand_rows'] ?? 0,
                    'risk_rows'   => $data['risk_rows'] ?? 0,
                    'elapsed_s'   => $data['elapsed_s'] ?? null,
                ]);
                return array_merge(['success' => true], $data);
            }

            Log::error('[ForecastingClient] Pipeline request failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return ['success' => false, 'error' => "HTTP {$response->status()}: {$response->body()}"];
        } catch (\Exception $e) {
            Log::error('[ForecastingClient] Pipeline request exception', [
                'error' => $e->getMessage(),
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    // ── Predict (batch) ──────────────────────────────────────

    /**
     * POST /api/v1/predict
     *
     * Send feature rows and get demand + risk predictions back.
     * Use this for real-time / on-demand predictions.
     *
     * @param array $featureRows Array of feature row dicts
     * @return array|null Parsed JSON response or null on failure
     */
    public function predict(array $featureRows): ?array
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeout)
                ->post($this->url('predict'), [
                    'features' => $featureRows,
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('[ForecastingClient] Predict failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('[ForecastingClient] Predict exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ── Models ───────────────────────────────────────────────

    /**
     * POST /api/v1/models/reload
     */
    public function reloadModels(): array
    {
        if (!$this->isConfigured()) {
            return ['success' => false, 'error' => 'Not configured'];
        }

        try {
            $response = Http::timeout(30)->post($this->url('models/reload'));
            return $response->successful()
                ? array_merge(['success' => true], $response->json())
                : ['success' => false, 'error' => "HTTP {$response->status()}"];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
