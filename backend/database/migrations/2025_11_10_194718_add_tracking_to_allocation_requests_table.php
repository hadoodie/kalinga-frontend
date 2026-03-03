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
    Schema::table('allocation_requests', function (Blueprint $table) {
        $table->timestamp('eta')->nullable()->after('status'); // Estimated Time of Arrival
        $table->string('current_location_label')->nullable()->after('eta');
        $table->decimal('current_location_lat', 10, 8)->nullable()->after('current_location_label');
        $table->decimal('current_location_lng', 11, 8)->nullable()->after('current_location_lat');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('allocation_requests', function (Blueprint $table) {
            //
        });
    }
};
