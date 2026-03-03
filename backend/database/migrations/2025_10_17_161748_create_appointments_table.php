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
        Schema::table('appointments', function (Blueprint $table) {
            $table->renameColumn('provider_name', 'hospital');
            $table->renameColumn('provider_specialty', 'service');
            $table->renameColumn('reason', 'complaint');

            $table->string('patient_name')->nullable()->after('user_id'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('patient_name');
            $table->renameColumn('hospital', 'provider_name');
            $table->renameColumn('service', 'provider_specialty');
            $table->renameColumn('complaint', 'reason');
        });
    }
};