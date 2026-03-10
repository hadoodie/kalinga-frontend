<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'provider_name')) {
                $table->string('provider_name')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'provider_specialty')) {
                $table->string('provider_specialty')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'location')) {
                $table->string('location')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'instructions')) {
                $table->text('instructions')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['provider_name', 'provider_specialty', 'location', 'instructions'] as $column) {
                if (Schema::hasColumn('appointments', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
