<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('allocations', function (Blueprint $table) {
            // Add responder_id if it doesn't exist
            if (!Schema::hasColumn('allocations', 'responder_id')) {
                $table->foreignId('responder_id')
                      ->nullable()
                      ->constrained('responders')
                      ->nullOnDelete()
                      ->after('destination_hospital_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('allocations', function (Blueprint $table) {
            if (Schema::hasColumn('allocations', 'responder_id')) {
                $table->dropForeign(['responder_id']);
                $table->dropColumn('responder_id');
            }
        });
    }
};
