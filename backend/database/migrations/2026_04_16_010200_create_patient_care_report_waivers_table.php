<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patient_care_report_waivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_care_report_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('consent_for_treatment')->default(false);
            $table->boolean('refusal_of_treatment')->default(false);
            $table->boolean('equipment_liability_agreement')->default(false);
            $table->string('signer_name')->nullable();
            $table->string('consent_signature_path')->nullable();
            $table->string('refusal_signature_path')->nullable();
            $table->string('equipment_signature_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_care_report_waivers');
    }
};
