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
        Schema::create('patient_care_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('case_no')->nullable()->index();
            $table->string('mobile_unit')->nullable();
            $table->date('dispatch_date')->nullable();
            $table->json('response_times')->nullable();
            $table->json('noi_moi')->nullable();
            $table->json('patient_details')->nullable();
            $table->json('physiological_status')->nullable();
            $table->json('vitals_entries')->nullable();
            $table->json('gcs_entries')->nullable();
            $table->json('management_transport')->nullable();
            $table->json('waivers')->nullable();
            $table->json('edge_ingest_meta')->nullable();
            $table->enum('status', ['draft', 'submitted'])->default('draft')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_care_reports');
    }
};
