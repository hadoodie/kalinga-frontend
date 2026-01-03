<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add HSI-related fields to existing hospitals table
     */
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            
            // Safety Check: Only run if the first new column doesn't exist yet
            if (!Schema::hasColumn('hospitals', 'routine_bed_capacity')) {
                
                // Surge Capacity (Form 1)
                $table->integer('routine_bed_capacity')->nullable()->after('capacity');
                $table->integer('maximum_bed_capacity')->nullable()->after('routine_bed_capacity');
                $table->integer('routine_staff_count')->nullable()->after('maximum_bed_capacity');
                $table->integer('maximum_staff_count')->nullable()->after('routine_staff_count');
                $table->integer('current_occupancy')->default(0)->after('maximum_staff_count');
                
                // HSI Status
                $table->decimal('current_safety_index', 5, 2)->nullable()->after('current_occupancy');
                
                $table->string('safety_category')->nullable()->after('current_safety_index');
                
                $table->timestamp('last_hsi_assessment_at')->nullable()->after('safety_category');
                
                // Disaster Mode
                $table->boolean('disaster_mode_active')->default(false)->after('last_hsi_assessment_at');
                $table->timestamp('disaster_mode_activated_at')->nullable()->after('disaster_mode_active');
                $table->decimal('current_surge_multiplier', 5, 2)->default(1.00)->after('disaster_mode_activated_at');
                
                // Indexes
                $table->index('safety_category');
                $table->index('disaster_mode_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            // Safety Check: Only try to drop if the column actually exists
            if (Schema::hasColumn('hospitals', 'routine_bed_capacity')) {
                $table->dropIndex(['safety_category']);
                $table->dropIndex(['disaster_mode_active']);
                
                $table->dropColumn([
                    'routine_bed_capacity',
                    'maximum_bed_capacity',
                    'routine_staff_count',
                    'maximum_staff_count',
                    'current_occupancy',
                    'current_safety_index',
                    'safety_category',
                    'last_hsi_assessment_at',
                    'disaster_mode_active',
                    'disaster_mode_activated_at',
                    'current_surge_multiplier',
                ]);
            }
        });
    }
};