<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            // New fields
            $table->string('code')->unique()->nullable();
            $table->string('short_name')->nullable();

            $table->string('region')->nullable();
            $table->string('province')->nullable();
            $table->string('city_municipality')->nullable();

            $table->string('phone')->nullable();
            $table->string('director_name')->nullable();

            $table->integer('bed_capacity')->default(0);
            $table->integer('icu_capacity')->default(0);
            $table->integer('negative_pressure_rooms')->default(0);

            $table->enum('level', ['Level 1', 'Level 2', 'Level 3', 'DOH Hospital'])->nullable();
            $table->enum('ownership', ['government', 'private'])->default('government');

            $table->jsonb('capabilities')->default('{}');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_cold_chain_capable')->default(false);

            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            // Indexes
            $table->index('code', 'hospitals_code_index');
            $table->index('region', 'hospitals_region_index');
            $table->index('province', 'hospitals_province_index');
            $table->index('is_active', 'hospitals_is_active_index');
            $table->index('city_municipality', 'hospitals_city_municipality_index');
            $table->index('is_cold_chain_capable', 'hospitals_is_cold_chain_capable_index');
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('hospitals_code_index');
            $table->dropIndex('hospitals_region_index');
            $table->dropIndex('hospitals_province_index');
            $table->dropIndex('hospitals_is_active_index');
            $table->dropIndex('hospitals_city_municipality_index');
            $table->dropIndex('hospitals_is_cold_chain_capable_index');

            // Drop foreign keys
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);

            // Drop columns
            $table->dropColumn([
                'code', 'short_name', 'region', 'province', 'city_municipality',
                'phone', 'director_name', 'bed_capacity', 'icu_capacity',
                'negative_pressure_rooms', 'level', 'ownership',
                'capabilities', 'is_active', 'is_cold_chain_capable',
                'created_by', 'updated_by'
            ]);
        });
    }
};
