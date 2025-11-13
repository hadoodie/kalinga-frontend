<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('incidents', 'responders_required')) {
                $table->unsignedTinyInteger('responders_required')->default(1)->after('description');
            }

            if (!Schema::hasColumn('incidents', 'metadata')) {
                $table->json('metadata')->nullable()->after('completed_at');
            }
        });

        // Widen the status column so we can support richer responder states
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE incidents ALTER COLUMN status TYPE VARCHAR(50)");
            DB::statement("ALTER TABLE incidents ALTER COLUMN status SET DEFAULT 'reported'");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE incidents MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'reported'");
        }

        // Normalize any existing records to the new status scheme
        DB::table('incidents')
            ->where('status', 'available')
            ->update(['status' => 'reported']);

        DB::table('incidents')
            ->where('status', 'assigned')
            ->update(['status' => 'en_route']);

        DB::table('incidents')
            ->where('status', 'completed')
            ->update(['status' => 'resolved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('incidents')
            ->where('status', 'reported')
            ->update(['status' => 'available']);

        DB::table('incidents')
            ->whereIn('status', ['acknowledged', 'en_route', 'on_scene', 'needs_support'])
            ->update(['status' => 'assigned']);

        DB::table('incidents')
            ->where('status', 'resolved')
            ->update(['status' => 'completed']);

        // Revert status column to the original definition based on driver
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'pgsql') {
            // For PostgreSQL, we'd need to recreate the enum type if it was originally an enum
            // For simplicity, just keep it as varchar since we can't easily revert to enum
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE incidents MODIFY COLUMN status ENUM('available','assigned','completed') NOT NULL DEFAULT 'available'");
        }

        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'metadata')) {
                $table->dropColumn('metadata');
            }

            if (Schema::hasColumn('incidents', 'responders_required')) {
                $table->dropColumn('responders_required');
            }
        });
    }
};
