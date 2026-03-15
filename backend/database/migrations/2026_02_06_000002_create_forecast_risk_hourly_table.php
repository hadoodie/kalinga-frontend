<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hourly inventory-risk (stockout probability) per hospital + resource.
     * Written by the Python forecasting pipeline (forecasting/run_forecast.py).
     * Read by ForecastController → React logistics dashboard.
     */
    public function up(): void
    {
        Schema::create('forecast_risk_hourly', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hospital_id')
                  ->constrained('hospitals')
                  ->cascadeOnDelete();

            $table->foreignId('resource_id')
                  ->constrained('resources')
                  ->cascadeOnDelete();

            // The hour this risk applies to
            $table->timestamp('forecast_time');

            // How many hours ahead (1 … 48)
            $table->smallInteger('horizon_h')->default(1);

            // Core risk metrics
            $table->decimal('risk_prob', 5, 4)->default(0);        // 0.0000 – 1.0000
            $table->decimal('projected_stock', 12, 4)->nullable();  // predicted remaining qty
            $table->decimal('days_until_stockout', 8, 2)->nullable();

            // Categorical risk level (for quick filtering / UI badges)
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])
                  ->default('low')
                  ->index();

            // What drove the risk score
            $table->jsonb('risk_factors')->nullable();

            // Model provenance
            $table->string('model_version', 32)->default('v0.1');
            $table->timestamp('generated_at')->useCurrent();

            $table->timestamps();

            // Query patterns
            $table->index(['hospital_id', 'resource_id', 'forecast_time'], 'frh_lookup');
            $table->index(['risk_level', 'forecast_time'], 'frh_risk_filter');
            $table->index('generated_at', 'frh_freshness');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forecast_risk_hourly');
    }
};
