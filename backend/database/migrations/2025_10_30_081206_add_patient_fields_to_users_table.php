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
            // Add fields that match your React state
            $table->string('patientId')->nullable()->unique()->after('id');
            $table->date('dob')->nullable()->after('email'); // Date of Birth
            $table->string('bloodType')->nullable()->after('dob');
            $table->date('admitted')->nullable()->after('phone');
            $table->string('emergencyContactName')->nullable()->after('zip_code');
            $table->string('emergencyContactPhone')->nullable()->after('emergencyContactName');

            // Note: Your React state has 'address', but your User model already has 'address', 
            // 'barangay', 'city', 'zip_code'. You'll need to decide how to map these.
            // For simplicity, I'm assuming the existing 'address' field is what you want.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
