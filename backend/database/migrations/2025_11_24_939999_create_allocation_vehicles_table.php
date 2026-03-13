<?php
// database/migrations/2025_11_24_000005_create_allocation_vehicles_table.php

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
    
        Schema::create('allocation_vehicles', function (Blueprint $table) {
            $table->id();
            
            // Links to the allocation (Phase 2)
            $table->foreignId('allocation_id')
                  ->constrained('allocations')
                  ->cascadeOnDelete();

            // Links to the vehicle (your assets table)
            $table->foreignId('asset_id')
                  ->constrained('assets')
                  ->cascadeOnDelete();

            // Links to the responder (your responders table)
            $table->foreignId('responder_id')
                  ->nullable()
                  ->constrained('responders')
                  ->nullOnDelete();

            // Who assigned this logistics combo
            $table->foreignId('assigned_by')
                  ->constrained('users');

            $table->timestamp('assigned_at')->useCurrent();

            // Optional notes (e.g., "Use backup generator", "Escort required")
            $table->text('notes')->nullable();

            $table->timestamps();

            // One vehicle per allocation (standard DOH rule)
            $table->unique(['allocation_id', 'asset_id']);

            // Fast lookup for "which assets are currently assigned?"
            $table->index('asset_id');
            $table->index('responder_id');
            $table->index('assigned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_vehicles');
    }
};