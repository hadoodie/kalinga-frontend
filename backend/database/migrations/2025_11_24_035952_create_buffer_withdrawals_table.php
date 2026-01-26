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
    
// 2. buffer_withdrawals — FINAL VERSION (Central Approval Workflow)
Schema::create('buffer_withdrawals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('buffer_stock_id')
          ->constrained('buffer_stocks')
          ->cascadeOnDelete();

    // Link to original request that triggered this
    $table->foreignId('request_id')
          ->nullable()
          ->constrained('requests')
          ->nullOnDelete();

    // Link to allocation created from buffer stock
    $table->foreignId('allocation_id')
          ->nullable()
          ->constrained('allocations')
          ->nullOnDelete();

    // Destination hospital receiving the stock
    $table->foreignId('hospital_id')
          ->constrained('hospitals')
          ->cascadeOnDelete();

    $table->decimal('quantity', 16, 4);
    
    // Approval workflow
    $table->foreignId('requested_by')->constrained('users');
    $table->foreignId('approved_by')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete();
          
    $table->timestamp('requested_at')->useCurrent();
    $table->timestamp('approved_at')->nullable();

    $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])
          ->default('pending')
          ->index();

    $table->text('reason');                                      // "No hospital surplus found"
    $table->text('approval_notes')->nullable();

    $table->jsonb('meta')->nullable();
    $table->timestamps();

    // Critical indexes
    $table->index(['buffer_stock_id', 'created_at']);
    $table->index('status');
    $table->index('hospital_id');
    $table->index('allocation_id');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('buffer_withdrawals');
    }
};