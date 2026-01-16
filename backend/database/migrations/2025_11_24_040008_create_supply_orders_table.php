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
    
       // supply_orders — PERFECT
Schema::create('supply_orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
    
    // What was ordered
    $table->string('resource_name');                    // "N95 Mask", "Remdesivir"
    $table->string('resource_sku')->nullable();          // For future linking
    
    $table->decimal('quantity_ordered', 14, 4);
    $table->decimal('quantity_received', 14, 4)->default(0);
    $table->decimal('unit_price', 14, 4)->nullable();
    $table->decimal('total_cost', 16, 4)->storedAs('quantity_received * unit_price');

    $table->enum('status', [
        'pending', 'confirmed', 'partially_received', 
        'received', 'cancelled', 'failed'
    ])->default('pending')->index();

    $table->date('expected_delivery_date')->nullable();
    $table->date('actual_delivery_date')->nullable();

    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();

    $table->text('notes')->nullable();
    $table->jsonb('meta')->nullable();
    $table->timestamps();

    $table->index('status');
    $table->index('expected_delivery_date');
    $table->index('supplier_id');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('supply_orders');
    }
};