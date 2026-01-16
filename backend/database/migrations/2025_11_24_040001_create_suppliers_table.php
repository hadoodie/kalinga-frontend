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
    
// suppliers — PERFECT
Schema::create('suppliers', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('contact_person')->nullable();
    $table->string('email')->nullable();
    $table->string('phone')->nullable();
    $table->text('address')->nullable();
    
    // Dynamic reliability scoring (exactly how DOH ranks suppliers)
    $table->decimal('average_delivery_days', 4, 1)->default(3.0);
    $table->decimal('reliability_score', 3, 2)->default(1.00); // 0.00 – 1.00
    $table->integer('total_orders')->default(0);
    $table->integer('on_time_deliveries')->default(0);
    
    $table->boolean('is_active')->default(true);
    
    // Critical for Phase 3 vehicle matching
    $table->jsonb('capabilities')->nullable(); // ["cold_chain", "narcotics_license"]
    
    $table->jsonb('meta')->nullable();
    $table->timestamps();

    $table->index('reliability_score');
    $table->index('is_active');
    $table->index('name');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};