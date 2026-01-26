<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
         
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('resource_name');                                    // Human readable
            $table->foreignId('resource_id')->nullable()->constrained('resources');
            $table->unsignedInteger('quantity');                               // ← FIXED: integer only
            $table->enum('urgency_level', ['Low','Medium','High','Critical']);
            $table->enum('handling_class', ['General','ColdChain','Narcotics','HighValue']);
            $table->text('reason')->nullable();
            $table->enum('status', [
                'pending','under_review','matched','allocated', 
                'in_transit','delivered','verified','rejected','failed'
            ])->default('pending');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['status', 'urgency_level']);
            $table->index('hospital_id');
        });
        
    }

    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};
