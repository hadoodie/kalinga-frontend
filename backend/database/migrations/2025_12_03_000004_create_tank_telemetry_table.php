<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tank Telemetry Table
     * Tracks water and fuel tank levels for HSI Module 3 compliance
     * Supports manual entry with IoT-ready schema for future sensor integration
     * 
     * HSI Requirements:
     * - Water: 300L/bed/day × 72 hours = ~3600L reserve per bed
     * - Fuel: Must cover 72 hours at maximum capacity demand
     */
    public function up(): void
    {
        Schema::create('tank_telemetry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            
            // Tank Identification
            $table->string('tank_name');
            $table->string('tank_code')->nullable(); // Internal reference
            $table->enum('tank_type', ['water', 'fuel_diesel', 'fuel_gasoline', 'lpg', 'oxygen', 'other']);
            $table->string('location_description')->nullable();
            
            // Tank Specifications
            $table->decimal('total_capacity_liters', 14, 2);
            $table->decimal('usable_capacity_liters', 14, 2)->nullable(); // May be less than total
            $table->decimal('minimum_safe_level_liters', 12, 2)->default(0); // Don't go below this
            
            // Current Levels (Manual Entry)
            $table->decimal('current_level_liters', 14, 2)->default(0);
            $table->decimal('current_level_percent', 5, 2)->default(0);
            $table->timestamp('level_recorded_at')->nullable();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('entry_method', ['manual', 'sensor', 'calculated'])->default('manual');
            
            // Consumption & Depletion Calculation
            $table->decimal('normal_daily_consumption', 12, 2)->default(0);
            $table->decimal('surge_daily_consumption', 12, 2)->default(0); // During disaster mode
            $table->decimal('estimated_hours_remaining', 10, 2)->nullable(); // Normal consumption
            $table->decimal('surge_hours_remaining', 10, 2)->nullable(); // Surge consumption
            
            // HSI Compliance
            $table->decimal('hsi_required_capacity_liters', 14, 2)->nullable(); // Based on bed count
            $table->boolean('meets_hsi_requirement')->default(false);
            $table->decimal('hsi_compliance_percent', 5, 2)->default(0);
            
            // Disaster Simulation Fields
            $table->boolean('simulation_mode_active')->default(false);
            $table->timestamp('simulation_cutoff_time')->nullable(); // When supply was "cut"
            $table->decimal('simulation_consumption_rate', 12, 2)->nullable();
            
            // Alert Thresholds
            $table->decimal('critical_level_percent', 5, 2)->default(20);
            $table->decimal('warning_level_percent', 5, 2)->default(40);
            $table->decimal('refill_level_percent', 5, 2)->default(30);
            
            // Alert Status
            $table->enum('alert_status', ['normal', 'warning', 'critical', 'empty'])->default('normal');
            $table->timestamp('last_alert_at')->nullable();
            
            // IoT-Ready Fields (for future sensor integration)
            $table->string('sensor_id')->nullable();
            $table->string('sensor_type')->nullable();
            $table->timestamp('last_sensor_reading_at')->nullable();
            $table->boolean('sensor_online')->default(false);
            
            // Refill History
            $table->timestamp('last_refill_at')->nullable();
            $table->decimal('last_refill_amount_liters', 12, 2)->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['hospital_id', 'tank_type']);
            $table->index(['alert_status', 'is_active']);
            $table->index('tank_type');
        });

        // Tank level history for tracking changes over time
        Schema::create('tank_level_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tank_id')->constrained('tank_telemetry')->onDelete('cascade');
            $table->decimal('level_liters', 14, 2);
            $table->decimal('level_percent', 5, 2);
            $table->enum('change_type', ['reading', 'refill', 'consumption', 'adjustment', 'simulation']);
            $table->decimal('change_amount_liters', 12, 2)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
            
            $table->index(['tank_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tank_level_history');
        Schema::dropIfExists('tank_telemetry');
    }
};
