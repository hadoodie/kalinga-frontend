<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        if (Schema::hasTable('stock_movements')) {
        return;
    }
    
// 2. delivery_performance — KPI & Analytics (Phase 8)
Schema::create('delivery_performance', function (Blueprint $table) {
    $table->id();
    $table->foreignId('allocation_id')
          ->unique()
          ->constrained('allocations')
          ->cascadeOnDelete();

    // So you know which vehicle/responder was used
    $table->foreignId('asset_id')
          ->nullable()
          ->constrained('assets')
          ->nullOnDelete();
    $table->foreignId('responder_id')
          ->nullable()
          ->constrained('responders')
          ->nullOnDelete();

    $table->timestamp('dispatched_at')->nullable();
    $table->timestamp('arrived_at')->nullable();
    $table->timestamp('verified_at')->nullable(); // Phase 5 POD

    $table->integer('planned_duration_minutes')->nullable();
    $table->integer('actual_duration_minutes')->nullable();
    $table->decimal('distance_km', 8, 2)->nullable();

    $table->boolean('on_time')->default(false);
    $table->boolean('cold_chain_compliant')->default(true);
    $table->integer('temperature_violations')->default(0);
    $table->integer('seal_breaches')->default(0);

    $table->text('issues')->nullable();
    $table->jsonb('meta')->nullable();

    $table->timestamps();

    // For AnalyticsDashboard.jsx
    $table->index('dispatched_at');
    $table->index('on_time');
    $table->index('cold_chain_compliant');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_performance');
    }
};