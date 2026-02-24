<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hourly demand forecasts per hospital + resource.
     * Written by the Python forecasting pipeline (forecasting/run_forecast.py).
     * Read by ForecastController → React logistics dashboard.
     */
    public function up(): void
    {
        Schema::create('forecast_demand_hourly', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hospital_id')
                  ->constrained('hospitals')
                  ->cascadeOnDelete();

            $table->foreignId('resource_id')
                  ->constrained('resources')
                  ->cascadeOnDelete();

            // The hour being forecast (e.g. "2026-02-06 14:00:00")
            $table->timestamp('forecast_time');

            // How many hours ahead this prediction is (1 … 48)
            $table->smallInteger('horizon_h')->default(1);

            // Point forecast + confidence band
            $table->decimal('yhat', 12, 4)->default(0);       // predicted demand (units)
            $table->decimal('yhat_lower', 12, 4)->nullable();  // 10th percentile
            $table->decimal('yhat_upper', 12, 4)->nullable();  // 90th percentile

            // Feature snapshot (what the model saw when it made this prediction)
            $table->jsonb('feature_snapshot')->nullable();

            // Model provenance
            $table->string('model_version', 32)->default('v0.1');
            $table->timestamp('generated_at')->useCurrent();

            $table->timestamps();

            // Query patterns: "give me the forecast for hospital X, resource Y, next 48h"
            $table->index(['hospital_id', 'resource_id', 'forecast_time'], 'fdh_lookup');
            $table->index(['forecast_time', 'horizon_h'], 'fdh_horizon');
            $table->index('generated_at', 'fdh_freshness');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forecast_demand_hourly');
    }
};
