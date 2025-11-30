<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            
            // We check if the column exists first. If not, we add it.
            
            if (!Schema::hasColumn('appointments', 'service')) {
                $table->string('service')->nullable();
            }

            if (!Schema::hasColumn('appointments', 'complaint')) {
                $table->text('complaint')->nullable();
            }

            if (!Schema::hasColumn('appointments', 'location')) {
                $table->string('location')->nullable();
            }

            if (!Schema::hasColumn('appointments', 'contact_phone')) {
                $table->string('contact_phone')->nullable();
            }

            if (!Schema::hasColumn('appointments', 'contact_email')) {
                $table->string('contact_email')->nullable();
            }

            if (!Schema::hasColumn('appointments', 'instructions')) {
                $table->text('instructions')->nullable();
            }
            
            // Redundant check for patient_name just in case
            if (!Schema::hasColumn('appointments', 'patient_name')) {
                $table->string('patient_name')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'service', 'complaint', 'location', 
                'contact_phone', 'contact_email', 
                'instructions', 'patient_name'
            ]);
        });
    }
};
