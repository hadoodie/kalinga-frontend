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
    
// 1. delivery_logs — REAL-TIME TRACKING (LiveTracking.jsx + ConditionAlerts.jsx)
Schema::create('delivery_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('allocation_id')->constrained('allocations')->cascadeOnDelete();

    // FIXED: references correct table
    $table->foreignId('asset_id')
          ->nullable()
          ->constrained('assets')
          ->nullOnDelete();

    // So you can show "Driver: Juan Dela Cruz" on the map
    $table->foreignId('responder_id')
          ->nullable()
          ->constrained('responders')
          ->nullOnDelete();

    // GPS + Cold Chain + Security
    $table->decimal('latitude', 10, 8);
    $table->decimal('longitude', 11, 8);
    $table->decimal('temperature', 5, 2)->nullable();     // e.g., 4.2°C
    $table->decimal('humidity', 5, 2)->nullable();
    $table->boolean('seal_intact')->default(true);
    $table->boolean('shock_detected')->default(false);
    $table->integer('speed_kph')->nullable();

    // Free-form notes from driver
    $table->text('notes')->nullable();

    // Full sensor snapshot (for future IoT devices)
    $table->jsonb('condition_snapshot')->nullable();

    $table->timestamp('logged_at')->useCurrent();
    $table->timestamps();

    // Critical indexes for real-time dashboard
    $table->index(['allocation_id', 'logged_at']);
});
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_logs');
    }
};