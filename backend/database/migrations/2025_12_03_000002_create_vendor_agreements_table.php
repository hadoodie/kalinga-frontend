<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vendor Agreements (MOUs) Table
     * Supports automatic vendor mobilization during emergencies
     * Referenced from HSI Module 4, Item 134
     */
    public function up(): void
    {
        Schema::create('vendor_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained()->onDelete('cascade');
            
            // Vendor Information
            $table->string('vendor_name');
            $table->string('vendor_code')->nullable(); // Internal reference
            $table->string('contact_person');
            $table->string('contact_email');
            $table->string('contact_phone');
            $table->string('contact_phone_alt')->nullable();
            $table->text('address')->nullable();
            
            // Agreement Details
            $table->string('mou_reference_number')->nullable();
            $table->date('agreement_start_date');
            $table->date('agreement_end_date')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Resource Categories Covered
            $table->enum('resource_category', [
                'fuel',
                'water', 
                'medical_gases',
                'medicines',
                'food',
                'medical_supplies',
                'blood_products',
                'ppe',
                'other'
            ]);
            $table->string('resource_subcategory')->nullable();
            
            // Priority & Response Terms
            $table->integer('priority_level')->default(1); // 1 = highest priority
            $table->integer('guaranteed_response_hours')->nullable(); // SLA hours
            $table->decimal('minimum_order_quantity', 12, 2)->nullable();
            $table->string('minimum_order_unit')->nullable();
            $table->decimal('maximum_supply_capacity', 12, 2)->nullable();
            $table->string('maximum_supply_unit')->nullable();
            
            // Pricing Terms
            $table->decimal('unit_price', 12, 2)->nullable();
            $table->string('price_unit')->nullable();
            $table->boolean('emergency_pricing_applies')->default(false);
            $table->decimal('emergency_price_multiplier', 5, 2)->default(1.00);
            
            // Auto-Trigger Settings
            $table->boolean('auto_trigger_enabled')->default(false);
            $table->decimal('auto_trigger_threshold_hours', 8, 2)->nullable(); // Trigger when survival hours drop below this
            $table->integer('auto_order_quantity')->nullable();
            $table->string('auto_order_unit')->nullable();
            
            // Notification History
            $table->timestamp('last_triggered_at')->nullable();
            $table->integer('total_triggers')->default(0);
            $table->json('trigger_history')->nullable();
            
            // Document Storage
            $table->string('mou_document_path')->nullable();
            $table->text('terms_summary')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->index(['hospital_id', 'resource_category']);
            $table->index(['is_active', 'auto_trigger_enabled']);
            $table->index('resource_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_agreements');
    }
};
