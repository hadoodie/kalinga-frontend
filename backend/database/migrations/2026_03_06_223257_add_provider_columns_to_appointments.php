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
            if (Schema::hasColumn('appointments', 'hospital')) {
                $table->dropColumn('hospital');
            }
            if (Schema::hasColumn('appointments', 'appointment_date')) {
                $table->dropColumn('appointment_date');
            }
            if (Schema::hasColumn('appointments', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('appointments', 'provider_name')) {
                $table->dropColumn('provider_name');
            }
            if (Schema::hasColumn('appointments', 'provider_specialty')) {
                $table->dropColumn('provider_specialty');
            }
        });
    }
};