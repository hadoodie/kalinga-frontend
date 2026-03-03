<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('road_blockades', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('start_lat', 10, 8);
            $table->decimal('start_lng', 11, 8);
            $table->decimal('end_lat', 10, 8)->nullable();
            $table->decimal('end_lng', 11, 8)->nullable();
            $table->string('road_name')->nullable();
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['active', 'resolved', 'investigating'])->default('active');
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('reported_at');
            $table->timestamp('resolved_at')->nullable();
            $table->json('affected_coordinates')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('road_blockades');
    }
};
