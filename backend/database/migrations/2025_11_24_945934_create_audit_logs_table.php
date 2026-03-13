<?php
// database/migrations/2025_11_19_055137_create_audit_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_logs')) {
        return;
    }
    
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    
    $table->foreignId('user_id')
          ->nullable()
          ->constrained('users')
          ->onDelete('set null');

    // Human-readable action — matches your frontend badges
    $table->string('action'); // e.g., "allocation_confirmed", "delivery_verified", "stock_adjusted"

    $table->text('details')->nullable();
    $table->jsonb('before')->nullable();  // Previous state
    $table->jsonb('after')->nullable();   // New state
    $table->jsonb('meta')->nullable();

    // Polymorphic — can track changes on ANY model (allocation, request, asset, etc.)
    $table->nullablemorphs('auditable');

    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();

    $table->timestamps();

    // Indexes used in your audit sidebar and compliance reports
    $table->index('action');
    $table->index('created_at');
    $table->index('user_id');
  
});
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};