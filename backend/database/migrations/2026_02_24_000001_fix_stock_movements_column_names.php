<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Fix stock_movements column names to match the Eloquent model,
 * Resource controller, and ML ETL pipeline expectations.
 *
 * Migration discrepancy:
 *   DB column       → Expected by Model/ETL
 *   ─────────────────────────────────────────
 *   type            → movement_type
 *   balance_after   → new_quantity
 *   (missing)       → previous_quantity
 */
return new class extends Migration
{
    public function up(): void
    {
        // If the table already has 'movement_type', it means it was created by an older/different migration
        if (Schema::hasColumn('stock_movements', 'movement_type')) {
            return;
        }

        Schema::table('stock_movements', function (Blueprint $table) {
            // 1. Rename 'type' → 'movement_type'
            //    The enum column needs to be recreated on some DB drivers,
            //    but PostgreSQL supports ALTER COLUMN RENAME natively.
            $table->renameColumn('type', 'movement_type');

            // 2. Rename 'balance_after' → 'new_quantity'
            $table->renameColumn('balance_after', 'new_quantity');

            // 3. Add 'previous_quantity' column (nullable for existing rows)
            $table->decimal('previous_quantity', 14, 4)->nullable()->after('new_quantity');
        });

        // Backfill previous_quantity for existing rows from sequential movements
        // For each resource, the previous_quantity of row N is the new_quantity of row N-1
        DB::statement("
            UPDATE stock_movements sm
            SET previous_quantity = sub.prev_qty
            FROM (
                SELECT
                    id,
                    LAG(new_quantity) OVER (
                        PARTITION BY resource_id
                        ORDER BY created_at, id
                    ) AS prev_qty
                FROM stock_movements
            ) sub
            WHERE sm.id = sub.id AND sub.prev_qty IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('previous_quantity');
            $table->renameColumn('movement_type', 'type');
            $table->renameColumn('new_quantity', 'balance_after');
        });
    }
};
