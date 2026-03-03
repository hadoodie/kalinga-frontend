<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       // database/migrations/2025_11_24_000004_create_responders_table.php

Schema::create('responders', function (Blueprint $table) {
    $table->id();
    $table->string('responder_code')->unique(); // "RSP-001", "RSP-042"
    
    // 1-to-1 with users table (a user can be a responder)
    $table->foreignId('user_id')
          ->unique()
          ->constrained('users')
          ->cascadeOnDelete();

    // Human-readable name fallback (in case user record is soft-deleted)
    $table->string('full_name');
    $table->string('contact_number');

    // License & certifications
    $table->string('license_number')->nullable();
    $table->jsonb('certifications')->nullable(); // ["Cold Chain Trained", "Narcotics Handler"]

    // CRITICAL: What this responder can handle (Phase 3 matching)
    $table->jsonb('handling_capabilities')->default('[]');
    // Example: ["General", "Cold Chain", "Narcotics", "High-Value"]

    // Current assignment
    $table->foreignId('current_asset_id')
          ->nullable()
          ->constrained('assets')
          ->nullOnDelete(); // ← FIXED: references correct table

    // Status EXACTLY as your frontend expects
    $table->enum('status', [
        'Available',      // Green dot
        'On Duty',        // Yellow - currently assigned
        'Off Duty',       // Gray
        'On Leave',       // Red
        'Suspended'
    ])->default('Available')->index();

    // Audit
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();

    // Performance indexes
    $table->index('current_asset_id');
    $table->index('responder_code');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('responders');
    }
};
