<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'hospital')) {
                $table->string('hospital')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'appointment_date')) {
                $table->dateTime('appointment_date')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'status')) {
                $table->string('status')->default('pending');
            }
            if (!Schema::hasColumn('appointments', 'provider_name')) {
                $table->string('provider_name')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'provider_specialty')) {
                $table->string('provider_specialty')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'hospital', 
                'appointment_date', 
                'status', 
                'provider_name', 
                'provider_specialty'
            ]);
        });
    }
};