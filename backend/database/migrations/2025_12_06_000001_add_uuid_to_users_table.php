<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add a nullable uuid column first so we don't break existing apps.
        Schema::table('users', function (Blueprint $table) {
            $table->string('uuid', 36)->nullable()->unique()->after('id');
        });

        // Backfill existing users with generated UUIDs
        $users = DB::table('users')->select('id')->get();
        foreach ($users as $user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update(['uuid' => (string) \Illuminate\Support\Str::uuid()]);
        }

        // Make the column non-nullable if doctrine/dbal is available; if not, leave as-is.
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->string('uuid', 36)->unique()->nullable(false)->change();
            });
        } catch (\Exception $e) {
            // Changing column failed (dbal not installed); keep column nullable but unique.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
