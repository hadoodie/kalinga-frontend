<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        if (Schema::hasTable('allocations')) {
        return;
    }
    
        // database/migrations/2025_11_24_000003_create_allocations_tables.php

Schema::create('allocations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('request_id')->constrained('requests')->cascadeOnDelete();
    $table->foreignId('source_hospital_id')->constrained('hospitals')->restrictOnDelete();
    $table->foreignId('destination_hospital_id')->constrained('hospitals')->restrictOnDelete();

    // CRITICAL: What is being moved?
    $table->string('resource_type');                    // e.g., "Paracetamol 500mg", "IV Fluid 1000ml"
    $table->decimal('quantity', 12, 4)->unsigned();     // Allow fractions (e.g., 0.5 box)

    // EXACTLY matches your frontend + Phase 3 matching
    $table->enum('handling_class', [
        'General', 'Cold Chain', 'Narcotics', 'High-Value'
    ])->index();

    // Official 8-phase status flow (non-negotiable)
    $table->enum('status', [
        'planned', 'confirmed', 'logistics_assigned', 
        'in_transit', 'delivered', 'verified', 'failed', 'cancelled'
    ])->default('planned')->index();

    // Logistics assignment (Phase 3)
    $table->foreignId('responder_id')->nullable()->constrained('users')->nullOnDelete();

    // Audit trail — who did what and when
    $table->foreignId('created_by')->constrained('users');
    $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();

    $table->timestamp('confirmed_at')->nullable();
    $table->timestamp('assigned_at')->nullable();
    $table->timestamp('dispatched_at')->nullable();
    $table->timestamp('delivered_at')->nullable();
    $table->timestamp('verified_at')->nullable();

    // For future extensions (e.g., notes, special instructions)
    $table->jsonb('meta')->nullable();

    $table->timestamps();

    // Performance indexes (used in every coordination screen)
    $table->index(['status', 'created_at']);
    $table->index(['source_hospital_id', 'status']);
    $table->index(['destination_hospital_id', 'status']);
    $table->index('request_id');
});

// FIXED: references correct `assets` table
Schema::create('allocation_vehicles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('allocation_id')->constrained('allocations')->cascadeOnDelete();
    $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete(); // ← FIXED
    $table->foreignId('assigned_by')->constrained('users');
    $table->timestamp('assigned_at')->useCurrent();
    $table->timestamps();

    $table->unique(['allocation_id', 'asset_id']); // One asset per allocation (for now)
});
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_vehicles');
        Schema::dropIfExists('allocations');
    }
};
