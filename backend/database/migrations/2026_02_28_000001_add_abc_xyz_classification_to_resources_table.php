<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add ABC/XYZ inventory classification columns to resources table.
     *
     * Epic 1: ABC/XYZ Inventory Classifier
     *   abc_class: A (top 80% volume), B (next 15%), C (tail 5%)
     *   xyz_class: X (CV ≤ 0.50), Y (0.50–1.00), Z (> 1.00 or cold start)
     *   classification_updated_at: last time the classification was recomputed
     */
    public function up(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->char('abc_class', 1)->nullable()->after('is_critical')
                  ->comment('ABC volume class: A=high, B=medium, C=low');

            $table->char('xyz_class', 1)->nullable()->after('abc_class')
                  ->comment('XYZ variability class: X=stable, Y=moderate, Z=erratic');

            $table->timestamp('classification_updated_at')->nullable()->after('xyz_class')
                  ->comment('Last ABC/XYZ classification timestamp');

            // Index for queries that filter by classification
            $table->index(['hospital_id', 'abc_class', 'xyz_class'], 'idx_resources_abc_xyz');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropIndex('idx_resources_abc_xyz');
            $table->dropColumn(['abc_class', 'xyz_class', 'classification_updated_at']);
        });
    }
};
