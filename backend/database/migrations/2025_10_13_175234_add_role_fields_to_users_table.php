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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['patient', 'responder', 'admin', 'logistics'])->default('patient')->after('email');
            $table->string('phone', 20)->nullable()->after('password');
            $table->string('profile_image')->nullable()->after('phone');
            $table->text('address')->nullable()->after('profile_image');
            $table->string('barangay', 100)->nullable()->after('address');
            $table->string('city', 100)->nullable()->after('barangay');
            $table->string('zip_code', 10)->nullable()->after('city');
            $table->string('id_type', 50)->nullable()->after('zip_code');
            $table->string('id_image_path')->nullable()->after('id_type');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('id_image_path');
            $table->boolean('is_active')->default(true)->after('verification_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'phone',
                'profile_image',
                'address',
                'barangay',
                'city',
                'zip_code',
                'id_type',
                'id_image_path',
                'verification_status',
                'is_active'
            ]);
        });
    }
};
