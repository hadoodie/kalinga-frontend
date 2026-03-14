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
        if (!Schema::hasTable('appointments')) {
            Schema::create('appointments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('patient_name')->nullable();
                $table->string('hospital')->nullable();
                $table->string('service')->nullable();
                $table->text('complaint')->nullable();
                $table->timestamp('appointment_at')->nullable();
                $table->string('location')->nullable();
                $table->string('contact_phone')->nullable();
                $table->string('contact_email')->nullable();
                $table->text('instructions')->nullable();
                $table->string('status')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'provider_name')) {
                $table->renameColumn('provider_name', 'hospital');
            }

            if (Schema::hasColumn('appointments', 'provider_specialty')) {
                $table->renameColumn('provider_specialty', 'service');
            }

            if (Schema::hasColumn('appointments', 'reason')) {
                $table->renameColumn('reason', 'complaint');
            }

            if (!Schema::hasColumn('appointments', 'patient_name')) {
                $table->string('patient_name')->nullable()->after('user_id');
            }

            // Fallback column checks for legacy environments
            if (!Schema::hasColumn('appointments', 'appointment_at')) {
                $table->timestamp('appointment_at')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'location')) {
                $table->string('location')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'contact_phone')) {
                $table->string('contact_phone')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'contact_email')) {
                $table->string('contact_email')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'instructions')) {
                $table->text('instructions')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'status')) {
                $table->string('status')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('appointments')) {
            return;
        }

        Schema::table('appointments', function (Blueprint $table) {
            $columnsToDrop = [
                'patient_name',
                'appointment_at',
                'location',
                'contact_phone',
                'contact_email',
                'instructions',
                'status'
            ];

            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('appointments', $column)) {
                    $table->dropColumn($column);
                }
            }

            if (Schema::hasColumn('appointments', 'hospital')) {
                $table->renameColumn('hospital', 'provider_name');
            }
            if (Schema::hasColumn('appointments', 'service')) {
                $table->renameColumn('service', 'provider_specialty');
            }
            if (Schema::hasColumn('appointments', 'complaint')) {
                $table->renameColumn('complaint', 'reason');
            }
        });
    }
};