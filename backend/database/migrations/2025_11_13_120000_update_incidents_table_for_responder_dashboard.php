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
            $table->unsignedTinyInteger('responders_required')->default(1); 
            $table->json('metadata')->nullable();
        });

        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE incidents ALTER COLUMN status TYPE VARCHAR(50) USING status::text");
            DB::statement("ALTER TABLE incidents ALTER COLUMN status SET DEFAULT 'reported'");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE incidents MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'reported'");
        }

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

        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn(['metadata', 'responders_required']);
        });
    }
};