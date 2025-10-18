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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('provider_name');
            $table->string('provider_specialty');
            $table->dateTime('appointment_at');
            $table->string('reason');
            $table->string('location');
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->text('instructions')->nullable();
            $table->enum('status', ['upcoming', 'past']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
