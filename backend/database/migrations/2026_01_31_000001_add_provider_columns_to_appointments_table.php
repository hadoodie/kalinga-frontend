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
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'provider_name')) {
                $table->string('provider_name')->nullable()->after('hospital');
            }
            if (!Schema::hasColumn('appointments', 'provider_specialty')) {
                $table->string('provider_specialty')->nullable()->after('provider_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'provider_name')) {
                $table->dropColumn('provider_name');
            }
            if (Schema::hasColumn('appointments', 'provider_specialty')) {
                $table->dropColumn('provider_specialty');
            }
        });
    }
};
