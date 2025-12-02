<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hospital Safety Index Assessment Table
     * Based on Philippine DOH/WHO Hospital Safety Index (December 2016)
     * 
     * Scoring Model:
     * - Module 2 (Structural): 50% weight
     * - Module 3 (Non-Structural): 30% weight  
     * - Module 4 (Emergency Management): 20% weight
     */
    public function up(): void
    {
        Schema::create('hospital_safety_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            $table->foreignId('assessor_id')->nullable()->constrained('users')->onDelete('set null');
            
            // General Information (Form 1)
            $table->integer('routine_bed_capacity')->default(0);
            $table->integer('maximum_bed_capacity')->default(0); // Surge capacity
            $table->integer('routine_staff_count')->default(0);
            $table->integer('maximum_staff_count')->default(0);
            $table->json('catchment_facilities')->nullable(); // List of nearby facilities
            
            // Module 1: Hazards (Non-Scored Context)
            $table->json('hazards_geological')->nullable(); // earthquakes, volcanic, tsunami, landslide risks
            $table->json('hazards_hydrometeorological')->nullable(); // typhoons, storm surge, flooding
            $table->json('hazards_biological')->nullable(); // epidemics, foodborne outbreaks
            $table->json('hazards_societal')->nullable(); // armed conflict, security threats
            
            // Module 2: Structural Safety (50% of Index)
            $table->decimal('structural_score', 5, 2)->default(0); // 0-100 scale
            $table->boolean('has_prior_damage')->default(false);
            $table->boolean('meets_current_standards')->default(false);
            $table->boolean('has_soft_floors')->default(false); // Design flaw indicator
            $table->boolean('has_short_columns')->default(false); // Design flaw indicator
            $table->json('structural_details')->nullable(); // Additional structural assessment data
            
            // Module 3: Non-Structural Safety (30% of Index)
            $table->decimal('non_structural_score', 5, 2)->default(0); // 0-100 scale
            
            // Power Systems
            $table->boolean('generator_starts_within_10s')->default(false);
            $table->integer('generator_coverage_percent')->default(0); // % of critical areas covered
            $table->decimal('fuel_reserve_hours', 8, 2)->default(0);
            
            // Water Systems
            $table->decimal('water_reserve_liters', 12, 2)->default(0);
            $table->decimal('water_consumption_per_bed_day', 8, 2)->default(300); // Default 300L/bed/day
            $table->decimal('water_reserve_hours', 8, 2)->default(0);
            
            // Medical Gases
            $table->decimal('oxygen_reserve_days', 8, 2)->default(0);
            $table->boolean('oxygen_meets_15day_requirement')->default(false);
            
            // Equipment Safety
            $table->boolean('heavy_equipment_anchored')->default(false);
            $table->json('non_structural_details')->nullable();
            
            // Module 4: Emergency & Disaster Management (20% of Index)
            $table->decimal('emergency_mgmt_score', 5, 2)->default(0); // 0-100 scale
            $table->boolean('has_disaster_committee')->default(false);
            $table->boolean('has_eoc')->default(false); // Emergency Operations Center
            $table->boolean('has_backup_communications')->default(false);
            $table->boolean('has_vendor_mous')->default(false);
            $table->boolean('has_staff_contact_list')->default(false);
            $table->json('emergency_mgmt_details')->nullable();
            
            // Overall Safety Index
            $table->decimal('overall_safety_index', 5, 2)->default(0); // Weighted average
            $table->enum('safety_category', ['A', 'B', 'C'])->default('C');
            // A = Safe (66-100), B = Intervention needed (36-65), C = Urgent action (0-35)
            
            // Assessment metadata
            $table->date('assessment_date');
            $table->date('next_assessment_due')->nullable();
            $table->enum('status', ['draft', 'in_progress', 'completed', 'approved'])->default('draft');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->index(['hospital_id', 'assessment_date']);
            $table->index('safety_category');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospital_safety_assessments');
    }
};
