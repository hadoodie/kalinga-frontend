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
        Schema::create('patient_care_report_vitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_care_report_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('recorded_time', 20)->nullable();
            $table->string('blood_pressure', 20)->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->unsignedSmallInteger('respiratory_rate')->nullable();
            $table->unsignedSmallInteger('spo2')->nullable();
            $table->unsignedSmallInteger('pulse')->nullable();
            $table->unsignedTinyInteger('gcs_eyes')->nullable();
            $table->unsignedTinyInteger('gcs_verbal')->nullable();
            $table->unsignedTinyInteger('gcs_motor')->nullable();
            $table->unsignedTinyInteger('gcs_total')->nullable();
            $table->string('source', 20)->default('manual');
            $table->timestamps();

            $table->index(['patient_care_report_id', 'sort_order'], 'pcr_vitals_order_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_care_report_vitals');
    }
};
