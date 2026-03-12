<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vendor Agreements (MOUs) Table
     */
    public function up(): void
    {
        Schema::create('vendor_agreements', function (Blueprint $table) {
            $table->id();
            
            // Explicitly linking to 'hospitals' table to be safe
            $table->foreignId('hospital_id')->constrained('hospitals')->onDelete('cascade');
            
            // Vendor Information
            $table->string('vendor_name');
            $table->string('vendor_code')->nullable();
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
            
            // Resource Details
            $table->string('resource_category');
            
            $table->string('resource_subcategory')->nullable();
            
            // Priority & Response Terms
            $table->integer('priority_level')->default(1);
            $table->integer('guaranteed_response_hours')->nullable();
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
            $table->decimal('auto_trigger_threshold_hours', 8, 2)->nullable();
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
            
            // Indexes
            $table->index(['hospital_id', 'resource_category']);
            $table->index(['is_active', 'auto_trigger_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_agreements');
    }
};