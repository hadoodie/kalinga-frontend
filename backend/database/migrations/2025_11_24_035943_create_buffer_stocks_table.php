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
    
// 1. buffer_stocks — FINAL VERSION (National Strategic Reserve)
Schema::create('buffer_stocks', function (Blueprint $table) {
    $table->id();
    $table->string('name');                                      // "Paracetamol 500mg"
    $table->string('sku')->unique();                             // "BUF-PAR-500-001"
    $table->string('category');                                   // "Medicine", "PPE", "IV Fluids"
    $table->string('unit')->default('unit');                     // "tablet", "box", "vial"

    // CRITICAL: This makes buffer stock work with Phase 3 vehicle matching
    $table->enum('handling_class', [
        'General', 'Cold Chain', 'Narcotics', 'High-Value'
    ])->index();

    $table->decimal('quantity', 16, 4)->default(0);
    $table->decimal('minimum_level', 16, 4)->default(1000);
    $table->decimal('critical_level', 16, 4)->default(500);       // Triggers red alert

    $table->boolean('requires_refrigeration')->default(false);
    $table->date('expiry_date')->nullable();
    $table->string('batch_number')->nullable();
    $table->string('manufacturer')->nullable();

    $table->jsonb('meta')->nullable();
    $table->timestamps();

    // Indexes used in BufferStockManagement.jsx
    $table->index('handling_class');
    $table->index('category');
    $table->index('expiry_date');
    $table->index('quantity');
    $table->index('sku');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('buffer_stocks');
    }
};