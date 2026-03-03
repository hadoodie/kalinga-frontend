<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('route_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_identifier')->nullable();
            $table->decimal('start_lat', 10, 7);
            $table->decimal('start_lng', 10, 7);
            $table->decimal('dest_lat', 10, 7);
            $table->decimal('dest_lng', 10, 7);
            $table->json('route_path');
            $table->json('deviations')->nullable();
            $table->json('metadata')->nullable();
            $table->double('distance')->nullable();
            $table->double('duration')->nullable();
            $table->unsignedInteger('deviation_count')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_recalculated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_logs');
    }
};
