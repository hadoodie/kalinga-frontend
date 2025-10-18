<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('language')->default('English')->after('is_active');
            $table->string('theme')->default('Light')->after('language');
            $table->string('availability')->nullable()->after('theme');
            $table->string('visibility')->default('Public')->after('availability');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['language', 'theme', 'availability', 'visibility']);
        });
    }
};