<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('allocation_vehicles', function (Blueprint $table) {
            // Add responder_id if it doesn't exist
            if (!Schema::hasColumn('allocation_vehicles', 'responder_id')) {
                $table->foreignId('responder_id')
                      ->nullable()
                      ->constrained('responders')
                      ->nullOnDelete()
                      ->after('asset_id');
            }

            // Add notes if it doesn't exist
            if (!Schema::hasColumn('allocation_vehicles', 'notes')) {
                $table->text('notes')->nullable()->after('responder_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('allocation_vehicles', function (Blueprint $table) {
            if (Schema::hasColumn('allocation_vehicles', 'responder_id')) {
                $table->dropForeign(['responder_id']);
                $table->dropColumn('responder_id');
            }
            if (Schema::hasColumn('allocation_vehicles', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
