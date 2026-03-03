<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Adding the missing column. 
            // nullable() is safer for existing rows so they don't crash.
            $table->string('hospital')->after('user_id')->nullable(); 
        });
    }

    public function down()
    {
     Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('hospital');
        });
    }
};
