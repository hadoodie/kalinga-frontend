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
        // kpi_snapshots — EXACTLY what the DOH Secretary sees every morning
Schema::create('kpi_snapshots', function (Blueprint $table) {
    $table->id();
    $table->date('snapshot_date')->unique();                    // One row per day
    $table->integer('total_requests');
    $table->integer('fulfilled_requests');
    $table->integer('avg_response_time_minutes');                // Phase 2 speed
    $table->integer('avg_delivery_time_minutes');                // Phase 4 speed
    $table->decimal('cold_chain_compliance_rate', 5, 2)->default(100.00);
    $table->decimal('on_time_delivery_rate', 5, 2)->default(100.00);
    $table->integer('buffer_utilization_count');
    $table->integer('external_procurement_count');
    $table->integer('active_allocations');
    $table->integer('temperature_violations');
    $table->integer('seal_breaches');
    $table->jsonb('meta')->nullable();
    $table->timestamps();

    $table->index('snapshot_date');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_snapshots');
    }
};