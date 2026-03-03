<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Resource Resilience Configuration Table
     * Stores surge multipliers, consumption rates, and critical thresholds
     * Used to calculate "Survival Hours" per HSI Module 3 requirements
     * 
     * Formula: SurvivalHours = CurrentStock / (NormalDailyUsage × SurgeMultiplier)
     * 
     * Critical Thresholds (from HSI):
     * - Fuel: 72 hours minimum
     * - Water: 72 hours minimum (300L/bed/day at max capacity)
     * - Oxygen: 15 days (360 hours) minimum
     */
    public function up(): void
    {
        Schema::create('resource_resilience_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_id')->constrained()->onDelete('cascade');
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            
            // Resilience Category
            $table->enum('resilience_category', [
                'fuel',
                'water',
                'oxygen',
                'medical_gases_other',
                'medicines_critical',
                'blood_products',
                'food',
                'ppe',
                'other'
            ])->default('other');
            
            // Consumption Rates
            $table->decimal('normal_daily_usage', 12, 2)->default(0);
            $table->string('usage_unit')->default('units');
            $table->decimal('usage_per_bed', 10, 4)->nullable(); // Usage per occupied bed
            $table->decimal('usage_per_patient', 10, 4)->nullable(); // Usage per patient
            
            // Surge Configuration
            $table->decimal('surge_multiplier', 5, 2)->default(1.50); // Default 1.5x during disaster
            $table->decimal('max_surge_multiplier', 5, 2)->default(3.00); // Absolute max
            
            // Threshold Configuration (in hours)
            $table->decimal('critical_threshold_hours', 8, 2)->default(72); // Red alert
            $table->decimal('warning_threshold_hours', 8, 2)->default(120); // Yellow alert
            $table->decimal('optimal_threshold_hours', 8, 2)->default(168); // 7 days = green
            
            // HSI-Specific Requirements
            $table->boolean('is_hsi_critical')->default(false); // Part of HSI Module 3
            $table->decimal('hsi_minimum_hours', 8, 2)->nullable(); // HSI mandated minimum
            $table->text('hsi_requirement_notes')->nullable();
            
            // Current Resilience Status (calculated, cached for performance)
            $table->decimal('current_survival_hours', 10, 2)->nullable();
            $table->decimal('surge_survival_hours', 10, 2)->nullable(); // At max surge
            $table->enum('resilience_status', ['critical', 'warning', 'adequate', 'optimal'])->default('adequate');
            $table->timestamp('last_calculated_at')->nullable();
            
            // Alert Configuration
            $table->boolean('alerts_enabled')->default(true);
            $table->boolean('auto_vendor_trigger_enabled')->default(false);
            $table->foreignId('primary_vendor_id')->nullable()->constrained('vendor_agreements')->onDelete('set null');
            $table->foreignId('backup_vendor_id')->nullable()->constrained('vendor_agreements')->onDelete('set null');
            
            // Alert History
            $table->timestamp('last_alert_sent_at')->nullable();
            $table->integer('alerts_sent_count')->default(0);
            
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['resource_id', 'hospital_id']);
            $table->index(['hospital_id', 'resilience_category']);
            $table->index(['resilience_status', 'is_hsi_critical']);
            $table->index('resilience_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_resilience_configs');
    }
};
