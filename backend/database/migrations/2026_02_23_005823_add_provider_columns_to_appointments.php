<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
         Schema::table('appointments', function (Blueprint $table) {
            // Add these columns to store the provider and location details
            $table->string('provider_name')->nullable();
            $table->string('provider_specialty')->nullable();
            $table->string('location')->nullable();
            $table->text('instructions')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // This allows you to "undo" the migration if needed
            $table->dropColumn(['provider_name', 'provider_specialty', 'location', 'instructions']);
        });
    }
};
