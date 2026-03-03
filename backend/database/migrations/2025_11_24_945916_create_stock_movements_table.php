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
    
   // 1. stock_movements — FINAL VERSION (Delivery Confirmation + Manual Adjustments)
Schema::create('stock_movements', function (Blueprint $table) {
    $table->id();
    
    // The actual inventory item being moved
    $table->foreignId('resource_id')
          ->constrained('resources')
          ->cascadeOnDelete();

    // Link to allocation when this movement came from a transfer (Phase 5 POD)
    $table->foreignId('allocation_id')
          ->nullable()
          ->constrained('allocations')
          ->nullOnDelete();

    // Source & destination for audit clarity
    $table->foreignId('hospital_id')
          ->constrained('hospitals')
          ->cascadeOnDelete();

    // Exact type — matches your ResourceMgmt.jsx logic
    $table->enum('type', [
        'in',                    // Received from allocation/supplier
        'out',                   // Dispatched via allocation
        'adjustment',            // Manual stock correction
        'expired',               // Expired items removed
        'damaged',               // Damaged items written off
        'donation_in',           // External donation received
        'donation_out'           // Donated to another facility
    ])->index();

    $table->decimal('quantity', 14, 4)->unsigned();
    $table->decimal('balance_after', 14, 4);

    $table->foreignId('performed_by')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete();

    $table->string('reason')->nullable();        // "POD confirmed", "Monthly expiry check"
    $table->text('notes')->nullable();           // Free-form notes

    $table->timestamps();

    // Critical indexes used in ResourceMgmt.jsx
    $table->index(['resource_id', 'created_at']);
    $table->index(['hospital_id', 'created_at']);
    $table->index('type');
    $table->index('allocation_id');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
