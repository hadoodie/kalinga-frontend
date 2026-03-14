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
        Schema::table('hospitals', function (Blueprint $table) {
            
            // Surge Capacity (Form 1)

            if (!Schema::hasColumn('hospitals', 'routine_bed_capacity')) {
                $table->integer('routine_bed_capacity')->nullable()->after('capacity');
            }
            if (!Schema::hasColumn('hospitals', 'maximum_bed_capacity')) {
                $table->integer('maximum_bed_capacity')->nullable()->after('routine_bed_capacity');
            }
            if (!Schema::hasColumn('hospitals', 'routine_staff_count')) {
                $table->integer('routine_staff_count')->nullable()->after('maximum_bed_capacity');
            }
            if (!Schema::hasColumn('hospitals', 'maximum_staff_count')) {
                $table->integer('maximum_staff_count')->nullable()->after('routine_staff_count');
            }
            if (!Schema::hasColumn('hospitals', 'current_occupancy')) {
                $table->integer('current_occupancy')->default(0)->after('maximum_staff_count');
            }

            // HSI Status
            if (!Schema::hasColumn('hospitals', 'current_safety_index')) {
                $table->decimal('current_safety_index', 5, 2)->nullable()->after('current_occupancy');
            }
            if (!Schema::hasColumn('hospitals', 'safety_category')) {
                $table->string('safety_category')->nullable()->after('current_safety_index');
                $table->index('safety_category'); // Safely bundle the index with the column
            }
            if (!Schema::hasColumn('hospitals', 'last_hsi_assessment_at')) {
                $table->timestamp('last_hsi_assessment_at')->nullable()->after('safety_category');
            }

            // Disaster Mode
            if (!Schema::hasColumn('hospitals', 'disaster_mode_active')) {
                $table->boolean('disaster_mode_active')->default(false)->after('last_hsi_assessment_at');
                $table->index('disaster_mode_active'); // Safely bundle the index with the column
            }
            if (!Schema::hasColumn('hospitals', 'disaster_mode_activated_at')) {
                $table->timestamp('disaster_mode_activated_at')->nullable()->after('disaster_mode_active');
            }
            if (!Schema::hasColumn('hospitals', 'current_surge_multiplier')) {
                $table->decimal('current_surge_multiplier', 5, 2)->default(1.00)->after('disaster_mode_activated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            
            // 1. Drop columns that have indexes attached first to prevent constraint errors
            if (Schema::hasColumn('hospitals', 'safety_category')) {
                $table->dropIndex(['safety_category']);
                $table->dropColumn('safety_category');
            }
            
            if (Schema::hasColumn('hospitals', 'disaster_mode_active')) {
                $table->dropIndex(['disaster_mode_active']);
                $table->dropColumn('disaster_mode_active');
            }

            // 2. Safely check and drop the remaining columns
            $columnsToDrop = [
                'routine_bed_capacity',
                'maximum_bed_capacity',
                'routine_staff_count',
                'maximum_staff_count',
                'current_occupancy',
                'current_safety_index',
                'last_hsi_assessment_at',
                'disaster_mode_activated_at',
                'current_surge_multiplier'
            ];

            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('hospitals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};