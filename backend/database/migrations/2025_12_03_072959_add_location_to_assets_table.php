<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('assets', function (Blueprint $table) {
            // Add lat/lng only if they don't exist
            if (!Schema::hasColumn('assets', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('location');
            }
            if (!Schema::hasColumn('assets', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }

            // Create composite index only if it doesn't exist
            $indexName = 'assets_lat_lng_index';
            if (!DB::select("SELECT to_regclass('{$indexName}')")[0]->to_regclass) {
                $table->index(['latitude', 'longitude'], $indexName);
            }

        });
    }

    public function down()
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
            
            // Drop our custom index only
            $table->dropIndexIfExists('assets_lat_lng_index');
        });
    }
};