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
        Schema::create('incident_websocket_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_name', 120)->default('IncidentUpdated');
            $table->bigInteger('client_received_at_ms');
            $table->bigInteger('incident_reported_at_ms')->nullable();
            $table->integer('propagation_delay_ms')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['incident_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('event_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_websocket_metrics');
    }
};
