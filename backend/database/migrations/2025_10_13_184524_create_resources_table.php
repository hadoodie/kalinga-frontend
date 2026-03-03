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
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique()->nullable(); // Stock Keeping Unit
            $table->string('barcode')->nullable();
            $table->string('name');
            $table->string('category'); // food, water, medical, shelter, equipment
            $table->text('description')->nullable();
            $table->string('unit'); // kg, liters, pieces, boxes, etc.
            $table->decimal('quantity', 10, 2);
            $table->decimal('minimum_stock', 10, 2)->default(0);
            $table->enum('status', ['High', 'Low', 'Critical', 'Out of Stock'])->default('Out of Stock');
            $table->string('location'); // hospital location
            $table->foreignId('hospital_id')->nullable()->constrained()->onDelete('set null');
            $table->date('expiry_date')->nullable();
            // $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_critical')->default(false); // critical supplies
            $table->boolean('requires_refrigeration')->default(false);
            $table->timestamps();
            
            $table->index('category');
            $table->index('status');
            $table->index('expiry_date');
            $table->index('sku');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};