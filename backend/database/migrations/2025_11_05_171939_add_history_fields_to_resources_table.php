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
        Schema::table('resources', function (Blueprint $table) {
            $table->date('last_stock_movement_date')->nullable()->after('requires_refrigeration');
            $table->date('last_status_change_date')->nullable()->after('last_stock_movement_date');
            $table->date('significant_quantity_date')->nullable()->after('last_status_change_date');
            $table->date('expiry_alert_date')->nullable()->after('significant_quantity_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn([
                'last_stock_movement_date',
                'last_status_change_date',
                'significant_quantity_date', 
                'expiry_alert_date'
            ]);
        });
    }
};