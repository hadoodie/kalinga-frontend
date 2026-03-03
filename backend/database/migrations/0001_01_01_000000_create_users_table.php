<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates three tables:
     * 1. users — main user records with profile, verification, and status data
     * 2. password_reset_tokens — stores password reset tokens
     * 3. sessions — manages user sessions for Laravel authentication
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // Primary key
            $table->id();

            // Basic identity
            $table->string('name');
            $table->string('email')->unique();

            // Authentication
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();

            // Role and profile details
            $table->enum('role', ['patient', 'responder', 'admin', 'logistics'])
                ->default('patient')
                ->comment('User role or account type');
            $table->string('phone', 20)->nullable()->comment('Contact number');
            $table->string('profile_image')->nullable()->comment('Profile picture path');
            $table->text('address')->nullable()->comment('Full address');
            $table->string('barangay', 100)->nullable()->comment('Barangay name');
            $table->string('city', 100)->nullable()->comment('City or municipality');
            $table->string('zip_code', 10)->nullable()->comment('ZIP or postal code');

            // ID and verification
            $table->string('id_type', 50)->nullable()->comment('Type of valid ID provided');
            $table->string('id_image_path')->nullable()->comment('File path to ID image');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])
                ->nullable()
                ->default(null)
                ->comment('Account verification status');
            $table->boolean('is_active')
                ->default(true)
                ->comment('True if user account is active');

            // Timestamps for record creation and update
            $table->timestamps();
        });

        // Password reset table
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Session tracking table
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops all created tables.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
