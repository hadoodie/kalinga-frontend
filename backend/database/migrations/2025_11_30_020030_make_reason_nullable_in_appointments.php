<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {

            if (Schema::hasColumn('appointments', 'reason')) {
                $table->string('reason')->nullable()->change();
            } else {
                $table->string('reason')->nullable();
            }

            if (Schema::hasColumn('appointments', 'type')) {
                $table->string('type')->nullable()->change();
            } else {
                $table->string('type')->nullable(); 
            }

            if (Schema::hasColumn('appointments', 'notes')) {
                $table->text('notes')->nullable()->change();
            } else {
                $table->text('notes')->nullable(); 
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            
            if (Schema::hasColumn('appointments', 'reason')) {
                $table->string('reason')->nullable(false)->change();
            }
            if (Schema::hasColumn('appointments', 'type')) {
                $table->string('type')->nullable(false)->change();
            }
            if (Schema::hasColumn('appointments', 'notes')) {
                $table->text('notes')->nullable(false)->change();
            }
        });
    }
};