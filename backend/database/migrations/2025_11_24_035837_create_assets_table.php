<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
// database/migrations/2025_11_24_000001_create_assets_table.php
public function up()
{
    Schema::create('assets', function (Blueprint $table) {
        $table->id();
        $table->string('asset_code')->unique(); // AST-REF-001
        $table->string('type');                  // "Refrigerated Van", "Generator"
        $table->string('category');              // "Cold Chain Transport", "Power Supply"
        $table->string('capacity')->nullable();  // "6 patients", "50kW", "500L"

        // EXACTLY what your frontend expects
        $table->enum('status', ['Operational', 'Under Repair', 'Standby', 'Decommissioned'])
              ->default('Standby')
              ->index();

        $table->string('location')->nullable();
        $table->string('personnel')->nullable();

        $table->date('last_maintenance')->nullable();
        $table->date('next_maintenance')->nullable();
        $table->string('condition')->nullable(); // Excellent, Good, Fair, Poor

        $table->string('manufacturer')->nullable();
        $table->string('model')->nullable();
        $table->integer('year')->nullable();

        // Vehicle fields
        $table->string('plate_number')->unique()->nullable();
        $table->string('fuelLevel')->nullable();
        $table->string('mileage')->nullable();           // "45,200 km" → stored as string
        $table->unsignedSmallInteger('current_fuel_level')->nullable(); // 0–100 (integer)

        // Equipment fields
        $table->string('operating_hours')->nullable();   // "2,450 hrs"
        $table->string('power_source')->nullable();
        $table->string('setup_time')->nullable();
        $table->string('flight_time')->nullable();

        // Critical for Phase 3 matching
        $table->jsonb('capabilities')->default('{}');

        // Monetary value stored as raw number → format in frontend/service
        $table->decimal('value', 18, 2)->nullable(); // 185000.00

        $table->date('purchase_date')->nullable();
        $table->foreignId('created_by')->constrained('users');
        $table->timestamps();

        // Indexes
        $table->index(['status', 'category']);
        $table->index('asset_code');
        $table->index('plate_number');
    });
}

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};