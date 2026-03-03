<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
    Schema::create('allocation_requests', function (Blueprint $table) {
        $table->id();
        $table->string('request_id')->unique();
        
        // For OUTGOING requests (Logistics user requests FROM a hospital)
        $table->foreignId('requester_user_id')->nullable()->constrained('users'); 
        
        // For INCOMING requests (Hospital requests FROM logistics)
        $table->foreignId('requester_hospital_id')->nullable()->constrained('hospitals');

        $table->foreignId('handler_id')->nullable()->constrained('users'); // Who approved/rejected it

        // Request Details
        $table->string('source_location'); 
        $table->string('destination_hospital')->nullable(); // For outgoing requests
        $table->string('urgency'); // Critical, High, etc.
        $table->string('request_type'); // Medical, Shelter, Ambulance, Blood, Organs
        $table->string('status')->default('Pending'); // Pending, Approved, Shipped, etc.
        
        // Item Details
        $table->string('item_name');
        $table->integer('item_quantity');

        // Contact & Justification
        $table->string('contact_info')->nullable();
        $table->text('justification')->nullable();
        $table->text('rejection_reason')->nullable();
        
        $table->json('tracking_history')->nullable(); 
        $table->timestamps();
    });
}
    public function down(): void {
        Schema::dropIfExists('allocation_requests');
    }
};