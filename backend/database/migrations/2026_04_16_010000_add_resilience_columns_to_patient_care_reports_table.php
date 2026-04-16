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
        Schema::table('patient_care_reports', function (Blueprint $table) {
            $table->foreignId('incident_id')->nullable()->after('user_id')->constrained('incidents')->nullOnDelete();
            $table->foreignId('patient_user_id')->nullable()->after('incident_id')->constrained('users')->nullOnDelete();
            $table->string('client_submission_id')->nullable()->after('status')->index();
            $table->timestamp('client_updated_at')->nullable()->after('client_submission_id');
            $table->string('soft_copy_path')->nullable()->after('edge_ingest_meta');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_care_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('incident_id');
            $table->dropConstrainedForeignId('patient_user_id');
            $table->dropColumn(['client_submission_id', 'client_updated_at', 'soft_copy_path']);
        });
    }
};
