<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add new fields
        Schema::table('resources', function (Blueprint $table) {
            if (!Schema::hasColumn('resources', 'received')) {
                $table->decimal('received', 12, 2)->default(0);
            }
            if (!Schema::hasColumn('resources', 'distributed')) {
                $table->decimal('distributed', 12, 2)->default(0);
            }

            if (!Schema::hasColumn('resources', 'requires_cold_chain')) {
                $table->boolean('requires_cold_chain')->default(false);
            }
            if (!Schema::hasColumn('resources', 'is_narcotic')) {
                $table->boolean('is_narcotic')->default(false);
            }
            if (!Schema::hasColumn('resources', 'is_high_value')) {
                $table->boolean('is_high_value')->default(false);
            }

            if (!Schema::hasColumn('resources', 'last_stock_movement_date')) {
                $table->date('last_stock_movement_date')->nullable();
            }
            if (!Schema::hasColumn('resources', 'last_status_change_date')) {
                $table->date('last_status_change_date')->nullable();
            }
            if (!Schema::hasColumn('resources', 'significant_quantity_date')) {
                $table->date('significant_quantity_date')->nullable();
            }
            if (!Schema::hasColumn('resources', 'expiry_alert_date')) {
                $table->date('expiry_alert_date')->nullable();
            }

            // Indexes
            $table->index(['hospital_id', 'name'], 'resources_hospital_name_index');
            $table->index('is_critical', 'resources_is_critical_index');
            $table->index('minimum_stock', 'resources_minimum_stock_index');
        });

        // Update hospital_id foreign key separately
        Schema::table('resources', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->foreign('hospital_id')
                  ->references('id')
                  ->on('hospitals')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('resources_hospital_name_index');
            $table->dropIndex('resources_is_critical_index');
            $table->dropIndex('resources_minimum_stock_index');

            // Drop added fields safely
            foreach ([
                'received',
                'distributed',
                'requires_cold_chain',
                'is_narcotic',
                'is_high_value',
                'last_stock_movement_date',
                'last_status_change_date',
                'significant_quantity_date',
                'expiry_alert_date',
            ] as $column) {
                if (Schema::hasColumn('resources', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        // Restore hospital_id foreign key to set null
        Schema::table('resources', function (Blueprint $table) {
            $table->dropForeign(['hospital_id']);
            $table->foreign('hospital_id')
                  ->references('id')
                  ->on('hospitals')
                  ->nullOnDelete();
        });
    }
};
